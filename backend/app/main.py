import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import your database session and models
from app.database import SessionLocal, engine 
from app.models import Base, Persona, Content, Lead, AgentRun

# Import your enterprise agents
from app.agents import SupervisorAgent, CoordinatorAgent, ContentAgent, InsightAgent

# Create tables if they do not exist
Base.metadata.create_all(bind=engine)

# ==========================================
# 1. FASTAPI & CORS CONFIGURATION
# ==========================================
app = FastAPI(title="Multi-Agent Marketing Backend")

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 2. PYDANTIC SCHEMAS
# ==========================================
class ChatRequest(BaseModel):
    user_message: str
    campaign_id: int | None = None

# ==========================================
# 3. API ENDPOINTS
# ==========================================

@app.get("/api/campaigns")
def get_all_campaigns():
    db = SessionLocal()
    try:
        all_personas = db.query(Persona).all()
        formatted_campaigns = []
        for p in all_personas:
            display_name = p.goal[:30] + "..." if len(p.goal) > 30 else p.goal
            formatted_campaigns.append({"id": p.id, "name": display_name})
        return {"campaigns": formatted_campaigns}
    finally:
        db.close()

@app.get("/api/campaigns/{campaign_id}")
def get_campaign(campaign_id: int):
    db = SessionLocal()
    try:
        camp = db.query(Persona).filter(Persona.id == campaign_id).first()
        if not camp:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return {
            "id": camp.id,
            "chat_history": camp.chat_history or []
        }
    finally:
        db.close()

@app.delete("/api/campaigns/{campaign_id}")
def delete_campaign(campaign_id: int):
    db = SessionLocal()
    try:
        camp = db.query(Persona).filter(Persona.id == campaign_id).first()
        if not camp:
            raise HTTPException(status_code=404, detail="Campaign not found")
        db.delete(camp)
        db.commit()
        return {"status": "success", "message": "Campaign deleted"}
    finally:
        db.close()

@app.post("/api/chat")
def universal_chat(request: ChatRequest):
    """
    API Gateway. Passes input to the SupervisorAgent, which routes it 
    to the correct worker agent based on intent.
    """
    db = SessionLocal()
    
    try:
        active_id = request.campaign_id
        
        # 1. Initialize Supervisor & Determine Action
        supervisor = SupervisorAgent()
        action_type = supervisor.route_request(request.user_message)
        
        # 2. Check for New Campaigns (Force PLAN action)
        if not active_id:
            action_type = "PLAN"
            new_campaign = Persona(goal=request.user_message)
            db.add(new_campaign)
            db.commit()
            db.refresh(new_campaign)
            active_id = new_campaign.id

        # 3. Execute Worker Agents Based on Supervisor Output
        ai_reply = ""
        
        if action_type == "PLAN":
            coord = CoordinatorAgent()
            ai_reply = coord.create_campaign_plan(active_id, request.user_message)
            
        elif action_type == "CREATE":
            content_agent = ContentAgent()
            caption, slug = content_agent.create_campaign_post(active_id, request.user_message)
            ai_reply = f"**Generated Social Post:**\n\n{caption}\n\n*Tracking Slug generated: `{slug}`*"
            
        elif action_type == "ANALYZE":
            insight = InsightAgent()
            review = insight.analyze_performance(active_id)
            ai_reply = f"**Performance Insight:**\n\n{review}"
            
        else:
            ai_reply = "I'm sorry, I didn't understand. I can help you PLAN a campaign, CREATE content, or ANALYZE metrics."

        # 4. Telemetry: Write to AgentRun Audit Table
        audit_log = AgentRun(
            run_type=action_type,
            persona_id=active_id,
            plan=ai_reply,
            human_decision="pending",
            provider="ollama/llama3.2",
            tokens_used=0 
        )
        db.add(audit_log)
        
        # 5. UI State: Update the JSON chat history for the React Frontend
        campaign_record = db.query(Persona).filter(Persona.id == active_id).first()
        if campaign_record:
            current_history = list(campaign_record.chat_history) if campaign_record.chat_history else []
            current_history.append({"role": "user", "content": request.user_message})
            current_history.append({"role": "ai", "content": ai_reply})
            
            campaign_record.chat_history = current_history
            db.commit()

        # Return standardized response to Next.js
        return {
            "status": "success",
            "action": action_type,
            "persona_id": active_id,
            "response": ai_reply
        }
            
    except Exception as e:
        return {
            "status": "error",
            "action": "DISPLAY_TEXT",
            "response": f"System execution failed: {str(e)}"
        }
    finally:
        db.close()
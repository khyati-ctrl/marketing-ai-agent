from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional

from app.database import SessionLocal
from app.models import Persona
from app.agents import SupervisorAgent, CoordinatorAgent, ContentAgent, AttributionAgent, InsightAgent

# 1. Initialize the App
app = FastAPI(title="Marketing AI Pipeline")

# 2. Configure CORS (Security VIP List for Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Define the Universal Menu (Pydantic Model)
class ChatRequest(BaseModel):
    user_message: str
    persona_id: Optional[int] = None # Optional because a brand new campaign won't have an ID yet

# --- 1: The Universal Chat Doorway ---
@app.post("/api/chat")
def universal_chat(request: ChatRequest):
    
    # Step 1: The Supervisor routes the request
    supervisor = SupervisorAgent()
    action = supervisor.route_request(request.user_message)
    
    db = SessionLocal()
    
    # Step 2: Execute based on the routing action
    if action == "PLAN":
        # Create the new campaign folder in Postgres
        new_campaign = Persona(goal=request.user_message)
        db.add(new_campaign)
        db.commit()
        db.refresh(new_campaign) 
        
        # Wake up the Coordinator
        coordinator = CoordinatorAgent()
        plan = coordinator.create_campaign_plan(new_campaign.id)
        db.close()
        
        return {
            "status": "success", 
            "action": action,
            "persona_id": new_campaign.id, 
            "response": plan
        }
        
    elif action == "CREATE":
        # Security check: Ensure persona_id is provided
        if not request.persona_id:
            db.close()
            raise HTTPException(status_code=400, detail="Missing persona_id. Select a campaign first.")
            
        # Wake up the Content Agent (The RAG memory handles reading the past plan!)
        content_agent = ContentAgent()
        new_post = content_agent.create_campaign_post(request.persona_id, request.user_message)
        db.close()
        
        return {
            "status": "success",
            "action": action,
            "persona_id": request.persona_id,
            "tracking_slug": new_post.tracking_slug,
            "response": new_post.post_text
        }
        
    elif action == "ANALYZE":
        # Security check: Ensure persona_id is provided
        if not request.persona_id:
            db.close()
            raise HTTPException(status_code=400, detail="Missing persona_id. Select a campaign first.")
            
        # Wake up the Insight Agent
        insight_agent = InsightAgent()
        report = insight_agent.analyze_campaign(request.persona_id, request.user_message)
        db.close()
        
        return {
            "status": "success",
            "action": action,
            "persona_id": request.persona_id,
            "response": report
        }
        
    else:
        # Handle UNKNOWN or unrecognized intents
        db.close()
        return {
            "status": "success",
            "action": "UNKNOWN",
            "response": "I am a marketing AI. I can only help you plan campaigns, create content, or analyze performance."
        }

# --- 2: The Magic Tracking Link ---
@app.get("/t/{slug}")
def track_click(slug: str):
    # Wake up the Tracker
    tracker = AttributionAgent()
    success = tracker.process_click(slug)
    
    if not success:
        raise HTTPException(status_code=404, detail="Tracking link not found")
        
    # After counting the click, instantly redirect the user
    return RedirectResponse(url="https://www.google.com")

# --- 3. Fetch All Campaigns ---
@app.get("/api/campaigns")
def get_all_campaigns():
    db = SessionLocal()
    
    # 1. Ask SQLAlchemy to grab every row in the Persona table
    all_personas = db.query(Persona).all()
    db.close()
    
    # 2. Format the data to perfectly match what the React Sidebar expects
    formatted_campaigns = []
    for p in all_personas:
        # We use the first 30 characters of their goal as the "name" for the sidebar
        display_name = p.goal[:30] + "..." if len(p.goal) > 30 else p.goal
        
        formatted_campaigns.append({
            "id": p.id,
            "name": display_name
        })
        
    return {"campaigns": formatted_campaigns}
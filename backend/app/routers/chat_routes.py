from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response, RedirectResponse
from pydantic import BaseModel
from app.database import SessionLocal
from app.models import Persona, Content, AgentRun, User
from app.auth import get_current_user
import os

BASE_URL = os.getenv("BACKEND_URL")

# Import your enterprise agents
from app.agents import SupervisorAgent, CoordinatorAgent, AttributionAgent, ContentAgent, InsightAgent

# 1. Initialize the Router
router = APIRouter(
    tags=["Chat & Agents"]
)

# 2. Pydantic Schema for Chat
class ChatRequest(BaseModel):
    user_message: str
    campaign_id: int | None = None

# 3. Click Tracking Redirection
@router.get("/go/{slug}")
def handle_click(slug: str):
    tracker = AttributionAgent()
    tracker.process_click(slug)
    
    return RedirectResponse(url="https://www.google.com")

# 4. Fetch Generated Images
@router.get("/api/content/{slug}/image")
def get_campaign_image(slug: str):
    db = SessionLocal()
    try:
        content_item = db.query(Content).filter(Content.tracking_slug == slug).first()
        if not content_item or not content_item.image_data:
            raise HTTPException(status_code=404, detail="Image not found for this slug")
        
        return Response(content_item.image_data, media_type="image/png")
    finally:
        db.close()

# 5. Main AI Agent Gateway
@router.post("/api/chat")
def universal_chat(request: ChatRequest, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    
    try:
        active_id = request.campaign_id
        
        # 1. Create the campaign FIRST if it doesn't exist
        if not active_id:
            new_campaign = Persona(goal=request.user_message, user_id=current_user.id)
            db.add(new_campaign)
            db.commit()
            db.refresh(new_campaign)
            active_id = new_campaign.id
        else:
            campaign_record = db.query(Persona).filter(Persona.id == active_id).first()
            if not campaign_record:
                raise HTTPException(status_code=404, detail="Campaign not found")
            if campaign_record.user_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized")

        # 2. NOW ask the Supervisor what to do (it will return a list like ['PLAN', 'CREATE'])
        supervisor = SupervisorAgent()
        actions = supervisor.route_request(request.user_message)
        
        response_parts = []
        
        # 3. Execute actions sequentially (No more 'elif'!)
        if "PLAN" in actions:
            coord = CoordinatorAgent()
            plan = coord.create_campaign_plan(active_id, request.user_message)
            response_parts.append(f"### Marketing Plan\n{plan}")
            
        if "CREATE" in actions:
            content_agent = ContentAgent()
            caption, slug = content_agent.create_campaign_post(active_id, request.user_message)
            image_url = f"{BASE_URL}/api/content/{slug}/image"
            tracking_url = f"{BASE_URL}/go/{slug}"
            response_parts.append(
                f"""
                ### Generated Social Post
                {caption}
                ![Campaign Poster]({image_url})
                **Share this tracking link:**
                [{tracking_url}]({tracking_url})
                """
                )
            
        if "ANALYZE" in actions:
            insight = InsightAgent()
            review = insight.analyze_performance(active_id)
            response_parts.append(f"### Performance Insight\n{review}")
            
        if not response_parts:
            response_parts.append("I'm sorry, I didn't understand. I can help you PLAN a campaign, CREATE content, or ANALYZE metrics.")

        # Mash all the generated parts together with a divider
        ai_reply = "\n\n---\n\n".join(response_parts)

        # 4. Audit Logging & Memory Saving
        audit_log = AgentRun(
            run_type=", ".join(actions), # Save the list as a string
            persona_id=active_id,
            plan=ai_reply,
            human_decision="pending",
            provider="ollama/llama3.2",
            tokens_used=0 
        )
        db.add(audit_log)
        
        campaign_record = db.query(Persona).filter(Persona.id == active_id).first()
        if campaign_record:
            current_history = list(campaign_record.chat_history) if campaign_record.chat_history else []
            current_history.append({"role": "user", "content": request.user_message})
            current_history.append({"role": "ai", "content": ai_reply})
            
            campaign_record.chat_history = current_history
            db.commit()

        return {
            "status": "success",
            "action": ", ".join(actions),
            "persona_id": active_id,
            "response": ai_reply
        }
            
    except HTTPException:
        raise
    except Exception as e:
        return {
            "status": "error",
            "action": "DISPLAY_TEXT",
            "response": f"System execution failed: {str(e)}"
        }
    finally:
        db.close()
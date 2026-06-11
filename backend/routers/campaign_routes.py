from fastapi import APIRouter, Depends, HTTPException
from app.database import SessionLocal
# ADDED Content and AgentRun to your imports!
from app.models import Persona, User, Content, AgentRun 
from app.auth import get_current_user

# 1. Initialize the Router
router = APIRouter(
    prefix="/api/campaigns",
    tags=["Campaigns"]
)

# 2. Get ALL Campaigns
@router.get("/")
def get_all_campaigns(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        all_personas = db.query(Persona).filter(Persona.user_id == current_user.id).all()
        
        formatted_campaigns = []
        for p in all_personas:
            display_name = p.goal[:30] + "..." if len(p.goal) > 30 else p.goal
            formatted_campaigns.append({"id": p.id, "name": display_name})
            
        return {"campaigns": formatted_campaigns}
    finally:
        db.close()

# 3. Get a SPECIFIC Campaign
@router.get("/{campaign_id}")
def get_campaign(campaign_id: int, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        campaign = db.query(Persona).filter(Persona.id == campaign_id).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
            
        if campaign.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this campaign")
            
        return {"chat_history": campaign.chat_history or []}
    finally:
        db.close()

# 4. DELETE a Campaign
@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: int, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        campaign = db.query(Persona).filter(Persona.id == campaign_id).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
            
        if campaign.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this campaign")
            
        # CRITICAL FIX: Delete connected data first so the database doesn't complain!
        db.query(Content).filter(Content.persona_id == campaign_id).delete()
        db.query(AgentRun).filter(AgentRun.persona_id == campaign_id).delete()
        
        # Now it is safe to delete the campaign
        db.delete(campaign)
        db.commit()
        
        return {"status": "success", "message": "Campaign deleted"}
    except Exception as e:
        db.rollback() # If something goes wrong, undo the deletion to be safe
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
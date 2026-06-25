from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from app.database import SessionLocal
from app.models import Persona, User, Content, AgentRun 
from app.auth import get_current_user
from app.agents import InsightAgent

# 1. Initialize the Router
router = APIRouter(
    prefix="/api/campaigns",
    tags=["Campaigns"]
)

# --- Pydantic Models for the Dashboard ---
class CampaignStat(BaseModel):
    id: str
    name: str
    date: str
    clicks: int
    leads: int       
    conversions: int  

class DashboardMetrics(BaseModel):
    total_posts: int
    total_clicks: int
    avg_engagement: str
    campaigns: List[CampaignStat]



# 2. Get Dashboard Metrics
# CRITICAL: This must be above /{campaign_id} so FastAPI doesn't confuse "dashboard" for an ID
@router.get("/dashboard", response_model=DashboardMetrics)
def get_dashboard_data(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        # Fetch ONLY the current user's campaigns
        personas = db.query(Persona).filter(Persona.user_id == current_user.id).all()
        
        total_posts = 0
        total_clicks = 0
        total_impressions = 0
        campaigns_data = []

        for persona in personas:
            posts = db.query(Content).filter(Content.persona_id == persona.id).all()
            
            camp_posts_count = len(posts)
            camp_clicks = sum(post.clicks for post in posts) 
            
            # Mock impressions based on clicks for now
            camp_impressions = camp_clicks * 24 if camp_clicks > 0 else 0
            
            total_posts += camp_posts_count
            total_clicks += camp_clicks
            total_impressions += camp_impressions

            # Shorten goal for the table name
            camp_name = persona.goal[:40] + "..." if len(persona.goal) > 40 else persona.goal

            # 1. Calculate the totals from the posts
            camp_leads = sum(post.leads_generated for post in posts)
            camp_conversions = sum(post.converted for post in posts)

            # 2. Append to your dashboard data
            campaigns_data.append(CampaignStat(
                id=str(persona.id),
                name=camp_name,
                date="Recent", 
                impressions=camp_impressions,
                clicks=camp_clicks,
                leads=camp_leads,             
                conversions=camp_conversions
                
            ))

        # Calculate Average Engagement
        if total_impressions > 0:
            engagement_rate = (total_clicks / total_impressions) * 100
            avg_engagement = f"+{engagement_rate:.1f}%"
        else:
            avg_engagement = "0.0%"

        return DashboardMetrics(
            total_posts=total_posts,
            total_clicks=total_clicks,
            avg_engagement=avg_engagement,
            campaigns=campaigns_data
        )
    finally:
        db.close()


# 3. Get ALL Campaigns (For the Sidebar)
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


# 4. Get a SPECIFIC Campaign
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


# 5. DELETE a Campaign
@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: int, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        campaign = db.query(Persona).filter(Persona.id == campaign_id).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
            
        if campaign.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this campaign")
            
        # Delete connected data first so the database doesn't complain!
        db.query(Content).filter(Content.persona_id == campaign_id).delete()
        db.query(AgentRun).filter(AgentRun.persona_id == campaign_id).delete()
        
        db.delete(campaign)
        db.commit()
        
        return {"status": "success", "message": "Campaign deleted"}
    except Exception as e:
        db.rollback() 
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@router.get("/{campaign_id}/insights")
def get_campaign_insights(campaign_id: int):
    # We don't even need to query the DB here, the agent does it!
    try:
        agent = InsightAgent()
        
        # Pass the integer ID directly instead of the data string
        insight_text = agent.analyze_performance(campaign_id) 
        
        return {"insight": insight_text}
    except Exception as e:
        # This will catch any future errors and print them nicely
        raise HTTPException(status_code=500, detail=str(e))
    
# 1. Track a Lead (e.g., User submitted an email form)
@router.post("/track/{slug}/lead")
def track_lead(slug: str):
    db = SessionLocal()
    try:
        post = db.query(Content).filter(Content.tracking_slug == slug).first()
        if post:
            post.leads_generated += 1
            db.commit()
            return {"status": "success", "leads": post.leads_generated}
        raise HTTPException(status_code=404, detail="Post not found")
    finally:
        db.close()

# 2. Track a Conversion (e.g., User bought a product)
@router.post("/track/{slug}/convert")
def track_conversion(slug: str):
    db = SessionLocal()
    try:
        post = db.query(Content).filter(Content.tracking_slug == slug).first()
        if post:
            post.converted += 1
            db.commit()
            return {"status": "success", "conversions": post.converted}
        raise HTTPException(status_code=404, detail="Post not found")
    finally:
        db.close()
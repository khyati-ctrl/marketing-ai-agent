from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from app.database import SessionLocal
from app.models import Persona, User, Content, AgentRun 
from app.auth import get_current_user
from app.agents import InsightAgent
from datetime import datetime, timezone

# 1. Initialize the Router
router = APIRouter(
    prefix="/api/campaigns",
    tags=["Campaigns"]
)

@router.get("/debug/slugs")
def get_valid_slugs():
    db = SessionLocal()
    try:
        # Grab the first 5 posts in the database
        posts = db.query(Content).limit(5).all()
        return {"valid_slugs_you_can_use": [post.tracking_slug for post in posts]}
    finally:
        db.close()

# --- Pydantic Models for the Dashboard ---
class CampaignStat(BaseModel):
    id: str
    name: str
    date: str
    impressions: int
    clicks: int
    leads: int       
    conversions: int  

class DashboardMetrics(BaseModel):
    total_posts: int
    total_clicks: int
    avg_cvr: str
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
        total_conversions = 0 # <-- FIXED 1: Added this variable
        campaigns_data = []

        for persona in personas:
            posts = db.query(Content).filter(Content.persona_id == persona.id).all()
            
            camp_posts_count = len(posts)
            camp_clicks = sum(post.clicks for post in posts) 
            
            # Mock impressions based on clicks for now
            camp_impressions = camp_clicks * 24 if camp_clicks > 0 else 0
            
            # 1. Calculate the totals from the posts
            camp_leads = sum(post.leads_generated for post in posts)
            camp_conversions = sum(post.converted for post in posts)

            # <-- FIXED 2: Actually add the campaign totals to the global totals
            total_posts += camp_posts_count
            total_clicks += camp_clicks
            total_impressions += camp_impressions
            total_conversions += camp_conversions 

            # Shorten goal for the table name
            camp_name = persona.goal[:40] + "..." if len(persona.goal) > 40 else persona.goal

            # Format the database timestamp into "Month Day, Year" (e.g., "Oct 24, 2024")
            # The getattr() is a safety net in case the column is missing
            if getattr(persona, 'created_at', None):
                display_date = persona.created_at.strftime("%b %d, %Y")
            else:
                # The updated Python 3.12+ standard
                display_date = datetime.now(timezone.utc).strftime("%b %d, %Y")

            # 2. Append to your dashboard data
            campaigns_data.append(CampaignStat(
                id=str(persona.id),
                name=camp_name,
                date=display_date,
                impressions=camp_impressions,
                clicks=camp_clicks,
                leads=camp_leads,            
                conversions=camp_conversions
            ))

        # 3. Calculate Average Conversion Rate (CVR)
        if total_clicks > 0:
            cvr_rate = (total_conversions / total_clicks) * 100
            avg_cvr = f"{cvr_rate:.1f}%"
        else:
            avg_cvr = "0.0%"

        # 4. Calculate Average Engagement
        if total_impressions > 0:
            engagement_rate = (total_clicks / total_impressions) * 100
            avg_engagement = f"{engagement_rate:.1f}%"
        else:
            avg_engagement = "0.0%"

        return DashboardMetrics(
            total_posts=total_posts,
            total_clicks=total_clicks,
            avg_cvr=avg_cvr, 
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

# --- ADD THIS NEW POST ROUTE ---
@router.post("/")
def create_new_campaign(campaign_data: dict, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        # Your Persona model uses 'goal' to store the name/prompt
        campaign_name = campaign_data.get("name", "New Campaign")
        
        new_campaign = Persona(
            goal=campaign_name, 
            user_id=current_user.id,
            chat_history=[] # Initialize with an empty history
        )
        db.add(new_campaign)
        db.commit()
        db.refresh(new_campaign)
        
        # Return exactly what React is expecting
        return {"id": new_campaign.id, "name": new_campaign.goal}
    finally:
        db.close()
# -------------------------------

# 4. Get a SPECIFIC Campaign
@router.get("/{campaign_id}")
def get_campaign(campaign_id: int, current_user: User = Depends(get_current_user)):
    db = SessionLocal()

    try:
        campaign = db.query(Persona).filter(
            Persona.id == campaign_id
        ).first()

        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")

        if campaign.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Fetch every content item belonging to this campaign
        posts = db.query(Content).filter(
            Content.persona_id == campaign_id
        ).all()

        total_clicks = sum(post.clicks for post in posts)
        total_leads = sum(post.leads_generated for post in posts)
        total_conversions = sum(post.converted for post in posts)

        impressions = total_clicks * 24 if total_clicks > 0 else 0

        return {
            "chat_history": campaign.chat_history or [],
            "clicks": total_clicks,
            "leads": total_leads,
            "conversions": total_conversions,
            "impressions": impressions
        }

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

@router.post("/track/{slug}/click")
def track_click(slug: str):
    db = SessionLocal()

    try:
        post = db.query(Content).filter(
            Content.tracking_slug == slug
        ).first()

        if not post:
            raise HTTPException(
                status_code=404,
                detail="Post not found"
            )

        post.clicks += 1

        db.commit()

        return {
            "status": "success",
            "clicks": post.clicks
        }

    finally:
        db.close()
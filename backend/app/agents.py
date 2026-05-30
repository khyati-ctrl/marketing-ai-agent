from app.database import SessionLocal
from app.models import Persona, Content, Lead
from app.llm_service import generate_ai_text, generate_ai_image # Import your centralized LLM gateway 

import uuid #tool for generating random strings- here used for creating unique tracking slugs

class SupervisorAgent:
    def route_request(self, user_prompt: str) -> str:
        routing_prompt = f"""
        Categorize the user's request into exactly ONE of these actions:
        - PLAN: Set a goal, start a campaign, or strategize.
        - CREATE: Make a poster, write a caption, or generate content.
        - ANALYZE: Check metrics, funnel data, or review performance.
        - UNKNOWN: Irrelevant to marketing.
        
        User Request: "{user_prompt}"
        Respond ONLY with the exact action word.
        """
        response = generate_ai_text(routing_prompt)
        return response.strip().upper()

class CoordinatorAgent:
    def create_campaign_plan(self, persona_id: int, goal: str) -> str:
        prompt = f"Write a 3-step marketing strategy for this goal: {goal}"
        plan = generate_ai_text(prompt)
        return plan

class ContentAgent:
    def create_campaign_post(self, persona_id: int, user_prompt: str):
        db = SessionLocal()
        
        # 1. RAG RETRIEVAL: Gather campaign context and past history
        campaign = db.query(Persona).filter(Persona.id == persona_id).first()
        past_content = db.query(Content).filter(Content.persona_id == persona_id).all()
        
        history_text = "\n".join([f"- Past post: {c.post_text}" for c in past_content])
        if not history_text:
            history_text = "This is the first post for this campaign."

        # 2. CONTEXT INJECTION: Build the master prompt
        master_prompt = f"""
        Campaign Goal: {campaign.goal}
        Campaign History: {history_text}
        
        New Task: {user_prompt}
        
        Write an engaging, short social media caption. Ensure it flows logically from the history.
        """
        caption = generate_ai_text(master_prompt)
        
        # Generate tracking slug
        slug = f"promo-{str(uuid.uuid4())[:6]}"
        
        # Save to database
        new_post = Content(
            persona_id=persona_id, 
            tracking_slug=slug, 
            post_text=caption
        )
        db.add(new_post)
        
        # Update Persona counter
        campaign.content_produced += 1
        
        db.commit()
        db.close()
        
        return caption, slug

class AttributionAgent:
    def process_click(self, slug: str) -> bool:
        db = SessionLocal()
        post = db.query(Content).filter(Content.tracking_slug == slug).first()
        
        if not post:
            db.close()
            return False
            
        # Increment tracking metrics
        post.clicks += 1
        
        # Log the lead entry
        new_lead = Lead(source_content=slug, channel="automated_link", stage_history="clicked")
        db.add(new_lead)
        
        db.commit()
        db.close()
        return True

class InsightAgent:
    def analyze_performance(self, persona_id: int) -> str:
        db = SessionLocal()
        campaign = db.query(Persona).filter(Persona.id == persona_id).first()
        posts = db.query(Content).filter(Content.persona_id == persona_id).all()
        
        total_clicks = sum(post.clicks for post in posts)
        
        prompt = f"""
        Analyze this campaign performance:
        Goal: {campaign.goal}
        Total Clicks Generated: {total_clicks}
        Write a 2-sentence performance review.
        """
        review = generate_ai_text(prompt)
        
        campaign.insight_findings = review
        db.commit()
        db.close()
        
        return review
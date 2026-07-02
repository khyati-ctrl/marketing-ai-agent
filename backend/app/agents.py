from app.database import SessionLocal
from app.models import Persona, Content, Lead
from app.llm_service import generate_ai_text, generate_ai_image # Import your centralized LLM gateway 

import uuid #tool for generating random strings- here used for creating unique tracking slugs


def refine_goal(user_input: str) -> str:
    """
    Acts as a Refiner Agent to strip commands and extract only the 
    core business topic from a user's prompt.
    """
    prompt = f"""
    You are a data assistant. Your job is to extract the subject of a business request.
    If the user says "Make a marketing plan for my cafe", you return "Cafe business".
    If the user says "I need a strategy for my crypto app", you return "Crypto app".
    
    User Input: "{user_input}"
    
    Return ONLY the subject. No sentences, no commands.
    """
    return generate_ai_text(prompt).strip()

class SupervisorAgent:
    def route_request(self, user_prompt: str) -> list:
        routing_prompt = f"""
        Analyze the user's request and classify it into EXACTLY ONE of these categories:
        - PLAN: Setting goals, starting a campaign, or strategizing.
        - CREATE: Making a poster, writing a caption, or generating content.
        - ANALYZE: Checking metrics, funnel data, or reviewing performance.
        
        User Request: "{user_prompt}"
        
        Respond with ONLY ONE word (PLAN, CREATE, or ANALYZE).
        """
        
        # 1. Get the raw text from the AI
        raw_response = generate_ai_text(routing_prompt).upper()
        
        # 2. Define our strict list of allowed actions
        valid_actions = ["PLAN", "CREATE", "ANALYZE"]
        
        # 3. Scan the AI's response for our allowed words
        found_actions = [action for action in valid_actions if action in raw_response]
        
        # 4. The Guardrail: No matter what the AI said, ONLY return the first valid action
        if found_actions:
            print(f"🤖 Supervisor routed to: {found_actions[0]}")
            return [found_actions[0]]
            
        # Fallback if the AI says something completely unreadable
        print("🤖 Supervisor could not route request. Defaulting to UNKNOWN.")
        return ["UNKNOWN"]

class CoordinatorAgent:
    def create_campaign_plan(self, persona_id: int, goal: str) -> str:
        prompt = f"Write a 3-step marketing strategy for this goal: {goal}"
        plan = generate_ai_text(prompt)
        return plan

class ContentAgent:
    def create_campaign_post(self, persona_id: int, user_prompt: str):
        db = SessionLocal()
        
        # 1. Gather campaign context
        campaign = db.query(Persona).filter(Persona.id == persona_id).first()
        past_content = db.query(Content).filter(Content.persona_id == persona_id).all()
        
        history_text = "\n".join([f"- Past post: {c.post_text}" for c in past_content])
        if not history_text:
            history_text = "This is the first post for this campaign."

        # 2. Build master text prompt & generate caption
        master_prompt = f"""
        Campaign Goal: {campaign.goal}
        Campaign History: {history_text}
        New Task: {user_prompt}
        Write an engaging, short social media caption.
        """
        caption = generate_ai_text(master_prompt)
        
        # 3. Synchronous Image Generation
        # Construct a visual layout prompt based on the campaign goal
        image_prompt = f"A professional, clean digital marketing social media post banner for: {campaign.goal}. Graphic design layout, modern typography."
        image_blob = generate_ai_image(image_prompt)
        
        # Generate tracking slug
        slug = f"promo-{str(uuid.uuid4())[:6]}"
        
        # 4. Save both text AND image binary blob to database
        new_post = Content(
            persona_id=persona_id, 
            tracking_slug=slug, 
            post_text=caption,
            image_data=image_blob  # Storing the Hugging Face output here
        )
        db.add(new_post)
        
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
        try:
            campaign = db.query(Persona).filter(Persona.id == persona_id).first()
            posts = db.query(Content).filter(Content.persona_id == persona_id).all()
            
            if not campaign:
                return "Error: Campaign not found."

            # 1. Grab all the new funnel metrics
            total_clicks = sum(post.clicks for post in posts)
            total_leads = sum(post.leads_generated for post in posts)
            total_sales = sum(post.converted for post in posts)
            
            # 2. Calculate Conversion Rate (CVR)
            cvr = (total_sales / total_clicks * 100) if total_clicks > 0 else 0
            
            # 3. The Upgraded Prompt
            prompt = f"""
            You are an expert Chief Marketing Officer evaluating an AI-generated campaign.
            The goal of this campaign was: "{campaign.goal}"
            
            Here is the raw performance data from the bottom-of-funnel tracker:
            - Total Clicks: {total_clicks}
            - Leads Generated (Emails Captured): {total_leads}
            - Total Sales/Conversions: {total_sales}
            - Conversion Rate (CVR): {cvr:.1f}%
            
            Analyze these numbers. 
            
            STRICT FORMATTING RULES:
            1. You must respond with EXACTLY three short bullet points.
            2. Do NOT use any Markdown formatting, asterisks, or bold text.
            3. Use plain text only.
            
            Draft your 3-bullet response now:
            """
            
            # 4. Use your existing custom LLM function
            review = generate_ai_text(prompt)
            
            # 5. Keep your existing database save logic!
            campaign.insight_findings = review
            db.commit()
            
            return review
        finally:
            db.close()

def run_background_summarizer():
    print("🌙 Waking up: Starting background summarizer...")
    db = SessionLocal()
    try:
        campaigns = db.query(Persona).all()
        
        for campaign in campaigns:
            # 1. Grab posts that haven't been summarized yet
            new_posts = db.query(Content).filter(
                Content.persona_id == campaign.id,
                Content.is_summarized == False
            ).all()

            if not new_posts:
                continue 

            print(f"📝 Summarizing {len(new_posts)} new posts for campaign ID {campaign.id}...")

            # 2. Mash the new posts into a single text block
            raw_text = "\n".join([f"- {p.post_text}" for p in new_posts])

            # 3. Prompt the AI to update the memory
            prompt = f"""
            You are a marketing AI maintaining a campaign summary.
            
            PREVIOUS CAMPAIGN MEMORY:
            "{campaign.master_summary}"

            NEW POSTS GENERATED TODAY:
            {raw_text}

            TASK: Update the "Previous Campaign Memory" to include the core details of the new posts. 
            Keep it strictly under 3 sentences. Be concise.
            """

            new_summary = generate_ai_text(prompt)

            # 4. Save the memory and check off the posts
            campaign.master_summary = new_summary
            for post in new_posts:
                post.is_summarized = True

            db.commit()
            
        print("✅ Background summarization complete! Going back to sleep.")
    except Exception as e:
        print(f"❌ Error in background summarizer: {e}")
    finally:
        db.close()
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from litellm import completion, image_generation

# ==========================================
# 1. DATABASE SETUP (PostgreSQL)
# ==========================================
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/marketing_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Persona(Base):
    __tablename__ = "personas"

    id = Column(Integer, primary_key=True, index=True)
    goal = Column(String(255), nullable=False)
    strategy = Column(Text, nullable=True)

# Create tables if they do not exist
Base.metadata.create_all(bind=engine)

# ==========================================
# 2. FASTAPI & CORS CONFIGURATION
# ==========================================
app = FastAPI(title="AI Marketing Supervisor Backend")

# Enable CORS so your Next.js frontend (port 3000) can securely communicate with FastAPI
app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 3. PYDANTIC SCHEMAS
# ==========================================
class ChatRequest(BaseModel):
    user_message: str
    campaign_id: int | None = None

# ==========================================
# 4. API ENDPOINTS
# ==========================================

@app.get("/api/campaigns")
def get_all_campaigns():
    """
    Fetches all historical campaigns from PostgreSQL to populate the React Sidebar.
    """
    db = SessionLocal()
    try:
        all_personas = db.query(Persona).all()
        
        formatted_campaigns = []
        for p in all_personas:
            # Shorten the name string for clean sidebar rendering
            display_name = p.goal[:30] + "..." if len(p.goal) > 30 else p.goal
            formatted_campaigns.append({
                "id": p.id,
                "name": display_name
            })
            
        return {"campaigns": formatted_campaigns}
    finally:
        db.close()


@app.post("/api/chat")
def universal_chat(request: ChatRequest):
    """
    Main router agent. Automatically switches between local Ollama processing 
    and safe cloud routing depending on the user's explicit task.
    """
    user_message_lower = request.user_message.lower()
    db = SessionLocal()
    
    try:
        # ---- TRACK A: IMAGE GENERATION REQUESTS ----
        if any(keyword in user_message_lower for keyword in ["image", "poster", "visual", "banner"]):
            api_key = os.getenv("OPENAI_API_KEY")
            
            # Key Safety Check: If no key or placeholder is detected, fallback gracefully without a crash
            if not api_key or "your-real-key" in api_key:
                return {
                    "status": "warning",
                    "action": "DISPLAY_TEXT",
                    "response": (
                        "🎨 [Local Mode Notice] I detected an image request! I would love to generate a "
                        "high-resolution visual using DALL-E 3, but your OpenAI API key is not configured yet. "
                        "To prevent app crashes, here is a detailed structural breakdown for your asset concept instead:\n\n"
                        "**Visual Layout Plan:** High-contrast layout matching your current campaign theme.\n"
                        "**Typography Style:** Clean, geometric sans-serif headings with structural subtext.\n"
                        "**Content Focus:** Clear visual emphasis on the primary value proposition."
                    )
                }
            
            # Secure cloud execution if key exists
            try:
                image_response = image_generation(
                    prompt=request.user_message,
                    model="dall-e-3"
                )
                return {
                    "status": "success",
                    "action": "DISPLAY_IMAGE",
                    "response": f"Generated asset successfully: {image_response.data[0].url}"
                }
            except Exception as e:
                return {"status": "error", "action": "DISPLAY_TEXT", "response": f"DALL-E 3 Execution Failed: {str(e)}"}

        # ---- TRACK B: TEXT PROCESSING & PLANNING (Free via Ollama) ----
        else:
            action_type = "TEXT_RESPONSE"
            active_id = request.campaign_id
            
            # Identify if this is a brand new campaign concept initializing a PLAN phase
            is_new_campaign = any(keyword in user_message_lower for keyword in ["start", "plan", "create a new", "run a"]) 
            
            if is_new_campaign or not active_id:
                action_type = "PLAN"
                new_campaign = Persona(goal=request.user_message)
                db.add(new_campaign)
                db.commit()
                db.refresh(new_campaign)
                active_id = new_campaign.id

            # Execute localized LLM processing completely offline using LiteLLM
            response = completion(
                model="ollama/llama3",
                messages=[{"role": "user", "content": request.user_message}]
            )
            
            ai_reply = response.choices[0].message.content
            
            # If we initialized a new campaign, update the database entry with the generated strategy
            if action_type == "PLAN":
                campaign_record = db.query(Persona).filter(Persona.id == active_id).first()
                if campaign_record:
                    campaign_record.strategy = ai_reply
                    db.commit()

            return {
                "status": "success",
                "action": action_type,
                "persona_id": active_id,
                "response": ai_reply
            }
            
    except Exception as general_error:
        return {
            "status": "error",
            "action": "DISPLAY_TEXT",
            "response": f"Server processing error. Ensure Ollama is running (`ollama run llama3`). Technical logs: {str(general_error)}"
        }
    finally:
        db.close()
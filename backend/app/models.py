from sqlalchemy import Column, Integer, Text, String, Float, DateTime, ForeignKey, LargeBinary, JSON, Boolean
from datetime import datetime
from sqlalchemy.orm import declarative_base
from datetime import datetime, timezone

Base = declarative_base()

class Persona(Base):
    __tablename__ = 'personas'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    goal = Column(Text, nullable=False)
    content_produced = Column(Integer, default=0)
    insight_findings = Column(Text)
    chat_history = Column(JSON, default=list)
    # Use a lambda so it calculates the exact exact moment the row is created
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    master_summary = Column(String, default="This is a new campaign. No history yet.")

class Content(Base):
    __tablename__ = 'content_items'
    id = Column(Integer, primary_key=True, index=True)
    persona_id = Column(Integer, ForeignKey('personas.id')) 
    tracking_slug = Column(String, unique=True, index=True)
    post_text = Column(Text)
    image_data = Column(LargeBinary, nullable=True) 
    clicks = Column(Integer, default=0)
    leads_generated = Column(Integer, default=0)
    active = Column(Integer, default=0)
    dropped = Column(Integer, default=0)
    converted = Column(Integer, default=0)
    avg_days_to_entry = Column(Float, default=0.0)
    is_summarized = Column(Boolean, default=False)

class Lead(Base):
    __tablename__ = 'leads'
    id = Column(Integer, primary_key=True, index=True)
    entry_date = Column(DateTime, default=datetime.utcnow)
    source_content = Column(String) 
    channel = Column(String)
    stage_history = Column(Text) 

class AgentRun(Base):
    __tablename__ = 'agent_runs'
    id = Column(Integer, primary_key=True, index=True)
    run_type = Column(String) 
    persona_id = Column(Integer, ForeignKey('personas.id'))
    plan = Column(Text)
    human_decision = Column(String) 
    provider = Column(String) 
    tokens_used = Column(Integer, default=0)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
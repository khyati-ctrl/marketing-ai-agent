from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# This imports the blueprint you just wrote in models.py
from app.models import Base 


DATABASE_URL = "postgresql://postgres:admin123@localhost:5432/marketing_agent"

# This creates the "bridge" to your database
engine = create_engine(DATABASE_URL)

# This creates the session (the tool we will use later to save data)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# THIS is the magic line that physically creates your 4 tables in PostgreSQL
Base.metadata.create_all(bind=engine)

print("Database connected and tables created successfully!")
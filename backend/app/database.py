import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# This imports the blueprint you just wrote in models.py
from app.models import Base 

# Load variables from .env
load_dotenv()

# Pull the URL securely from the environment
DATABASE_URL = os.getenv("DATABASE_URL")

# This creates the "bridge" to your database
engine = create_engine(DATABASE_URL)

# This creates the session (the tool we will use later to save data)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# THIS is the magic line that physically creates your 4 tables in PostgreSQL
Base.metadata.create_all(bind=engine)

print("Database connected and tables created successfully!")
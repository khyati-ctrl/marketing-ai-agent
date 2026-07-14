from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler

# Import your database tools
from app.database import engine
from app.models import Base

# Import your new modular routers
from app.routers import auth_routes, campaign_routes, chat_routes

# Import the function you just wrote
from app.agents import run_background_summarizer 

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 App starting...")
    print("🚀 Starting scheduler...")

    scheduler = BackgroundScheduler()

    scheduler.add_job(
        run_background_summarizer,
        "interval",
        minutes=1
    )

    scheduler.start()

    print("✅ Scheduler started!")

    yield

    print("🛑 Shutting down scheduler...")
    scheduler.shutdown()

# Hook the lifespan to your app & Initialize the FastAPI App
app = FastAPI(
    title="Multi-Agent Marketing Backend",
    lifespan=lifespan
)

# 1. Initialize the Database Tables
Base.metadata.create_all(bind=engine)

# 2. Configure CORS (Allows Next.js to talk to FastAPI)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Your React App
        "http://127.0.0.1:5500",   # Your Dummy Store (Live Server)
        "https://marketing-ai-agent-three.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Plug in all the modular routes!
app.include_router(auth_routes.router)
app.include_router(campaign_routes.router)
app.include_router(chat_routes.router)

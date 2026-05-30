# Marketing AI Agent

## Overview
This project is a multi-agent backend pipeline built for a 2-Week Intern Project Build. It automates campaign planning, content generation, and lead attribution using a RAG-based memory architecture. 

Currently in **Week 1** development: Backend API, full agent cycle in the terminal, and live tracking links. (UI slated for Week 2).

## Quick Start (Week 1 Testing)

### 1. Environment Setup
Ensure you have a `.env` file in the `backend/` directory with your API key:
\`\`\`env
OPENAI_API_KEY="sk-..."
\`\`\`

### 2. Install Dependencies
Ensure you are in the project root, then install the required Python packages:
\`\`\`bash
pip install fastapi uvicorn pydantic litellm python-dotenv sqlalchemy psycopg2 requests
\`\`\`

### 3. Initialize Database
Ensure PostgreSQL is running and your blank `marketing_agent` database is created in pgAdmin. Then, build the tables:
\`\`\`bash
cd backend
python database.py
\`\`\`

### 4. Run the Server
While inside the `backend` folder, start the FastAPI server:
\`\`\`bash
uvicorn main:app --reload
\`\`\`
The API will spin up at `http://127.0.0.1:8000`. 
You can interact with the endpoints and run the full agent cycle via the automated Swagger UI at `http://127.0.0.1:8000/docs`.

## Documentation Directory
Please see the `/docs` folder for detailed system specifications:
* `architecture.md` - Overall system and LLM Gateway design
* `agent-cycle.md` - The chronological trigger loop for the 4 agents
* `schema.md` - PostgreSQL table structures and memory scope
* `tracking-links.md` - Funnel attribution and manual lead entry
# AI Marketing Supervisor Dashboard

A full-stack, AI-powered marketing campaign manager. This application acts as an autonomous marketing supervisor, allowing users to chat with AI agents to generate strategic plans, create marketing assets, and track campaign data—all managed through a modern React interface and persisted in a PostgreSQL database.

## 🚀 Tech Stack

**Frontend:**
* Next.js (App Router)
* React.js
* Tailwind CSS
* Fetch API for client-server communication

**Backend:**
* Python & FastAPI
* PostgreSQL & SQLAlchemy (Database ORM)
* LiteLLM (OpenAI API integration)
* Uvicorn (ASGI web server)

## ✨ Core Features

* **Multi-Agent Architecture:** The backend features a Supervisor Agent that dynamically routes user requests to specialized sub-agents (Planner, Creator, Analyzer).
* **Interactive Chat Interface:** A real-time, responsive chat UI built with React state management.
* **Campaign Management:** A dynamic sidebar that fetches and displays the user's historical campaign database in real-time.
* **Persistent Memory:** All campaigns and personas are saved to a PostgreSQL database, allowing the AI to maintain context across different sessions.

## 🛠️ Local Setup & Installation

### Prerequisites
* Node.js & npm installed
* Python 3.8+ installed
* PostgreSQL installed and running
* An OpenAI API Key

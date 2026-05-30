# System Architecture

## Overview
This project is a multi-agent marketing pipeline built on a Retrieval-Augmented Generation (RAG) architecture. It automates campaign planning, asset generation, lead tracking, and post-campaign analysis.

## Core Layers
1. **Frontend (Next.js):** The user interface for human operators to set goals, approve plans, and view memory. *(Slated for Week 2)*.
2. **Backend Server:** A REST API that handles HTTP requests and orchestrates the agent workflows.
3. **Agent Logic:** Four specialized, chronological agents (Coordinator, Content, Attribution, Insight).
4. **LLM Gateway:** A single `LLMService` class. Agents do not call provider SDKs directly; all requests route through this gateway to ensure standardized prompting and centralized token management.
5. **Memory (PostgreSQL):** A relational database storing campaign goals, heavy assets (image BLOBs), tracking metrics, and an immutable audit log of agent API usage.
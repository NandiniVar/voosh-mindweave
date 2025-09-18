# RAG Chatbot System - Voosh Assignment Submission

## 🎯 Project Overview

A complete, production-ready Retrieval-Augmented Generation (RAG) chatbot system built with modern technologies. The system enables intelligent conversations backed by a comprehensive knowledge base of news articles and research papers.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │────│     Backend     │────│   Vector DB     │
│   React + TS    │    │  Node.js + TS   │    │ Qdrant/Chroma   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐    ┌─────────────────┐
                       │     Redis       │    │      LLM        │
                       │   (Sessions)    │    │ Gemini/OpenAI   │
                       └─────────────────┘    └─────────────────┘
```

## 📋 Tech Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with security middleware
- **Vector Store**: Qdrant (primary) / ChromaDB (fallback)
- **LLM**: Google Gemini (primary) / OpenAI (fallback) / HuggingFace (local)
- **Embeddings**: Jina AI (primary) / OpenAI / HuggingFace
- **Cache**: Redis for session management
- **Database**: Optional PostgreSQL with Prisma

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + SCSS
- **Build Tool**: Vite
- **State Management**: React hooks + Context
- **HTTP Client**: Axios
- **UI Components**: Custom components with Tailwind

## 🔗 Repository Links

- **Backend Repository**: `https://github.com/username/rag-backend` (placeholder)
- **Frontend Repository**: `https://github.com/username/rag-frontend` (placeholder)

## 🌐 Live Demo Links

- **Frontend**: `https://rag-frontend.vercel.app` (placeholder)
- **Backend API**: `https://rag-backend.render.com` (placeholder)
- **Demo Video**: `https://youtu.be/demo-video-id` (placeholder)

## ⚡ Quick Start Commands

### Complete Local Setup (Recommended)
```bash
# 1. Clone and setup backend
git clone <backend-repo-url>
cd rag-backend
npm install
cp .env.example .env
# Edit .env with your API keys

# 2. Start full stack with Docker
cd ..
docker-compose up --build

# 3. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Qdrant: http://localhost:6333
```

### Alternative: Manual Setup
```bash
# Terminal 1 - Infrastructure
docker run -d -p 6379:6379 redis:7-alpine
docker run -d -p 6333:6333 qdrant/qdrant:latest

# Terminal 2 - Backend
cd backend && npm install && npm run dev

# Terminal 3 - Frontend  
cd frontend && npm install && npm run dev
```

## 🔑 Required Environment Variables

### Backend (.env)
```bash
# Core (Required)
REDIS_URL=redis://localhost:6379
VECTOR_STORE_TYPE=qdrant
QDRANT_URL=http://localhost:6333

# LLM Provider (Choose one)
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
# OR
OPENAI_API_KEY=your_openai_api_key_here

# Embeddings Provider
EMBEDDINGS_PROVIDER=jina
JINA_API_KEY=your_jina_api_key_here

# Optional
DATABASE_ENABLED=false
QDRANT_API_KEY=your_qdrant_cloud_key
```

### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:3001
```

## 📊 Feature Implementation Checklist

### ✅ Backend Requirements
- [x] **Node.js + TypeScript + Express** - Complete REST API
- [x] **Chat Endpoints**:
  - [x] `POST /api/chat/send` - Streaming/chunked responses
  - [x] `GET /api/chat/history` - Session message retrieval
  - [x] `POST /api/chat/reset` - Clear session history
- [x] **System Endpoints**:
  - [x] `POST /api/ingest` - Document ingestion pipeline  
  - [x] `GET /api/health` - Health check
- [x] **Session Management** - Redis with configurable TTL (7 days default)
- [x] **Vector Store** - Qdrant client + ChromaDB fallback
- [x] **Embeddings** - Jina AI (primary) + OpenAI/HF fallbacks
- [x] **LLM Integration** - Pluggable providers (Gemini/OpenAI/HF)
- [x] **Streaming** - Server-Sent Events implementation
- [x] **Robustness** - Retry logic, rate limiting, error handling
- [x] **Ingestion Scripts** - RSS feed processing (~50 articles)
- [x] **Sample Data** - Seed script for offline demo
- [x] **Dockerfile** - Production-ready container
- [x] **Environment Config** - Comprehensive .env.example

### ✅ Frontend Requirements
- [x] **React + TypeScript** - Modern component architecture
- [x] **Chat Interface**:
  - [x] Message history display
  - [x] Real-time streaming responses
  - [x] Session reset functionality
  - [x] SessionId display for testing
  - [x] Ingest control button
- [x] **Responsive Design** - Mobile and desktop optimized
- [x] **SSE Integration** - Streaming response handling
- [x] **UX Features** - Loading states, error handling, theme
- [x] **Dockerfile** - Nginx-based production build
- [x] **Environment Config** - API URL configuration

### ✅ Infrastructure & Deployment
- [x] **Docker Compose** - Complete stack orchestration
- [x] **Multi-service Setup** - Backend, Frontend, Redis, Qdrant
- [x] **Scripts** - `Makefile` for easy local run
- [x] **Documentation** - Comprehensive README files
- [x] **Deployment Guides** - Step-by-step production setup

### ✅ Documentation & Testing
- [x] **README Files** - Tech stack, setup, API docs
- [x] **DEPLOYMENT.md** - Production deployment guides
- [x] **Environment Examples** - Complete .env.example files
- [x] **Demo Scripts** - Sample curl commands
- [x] **Architecture Diagrams** - ASCII art documentation
- [x] **Manual Testing** - E2E testing checklist

## 🧪 Testing the System

### Manual API Testing
```bash
# 1. Health check
curl http://localhost:3001/api/health

# 2. Send chat message
curl -X POST http://localhost:3001/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the latest developments in AI?"}'

# 3. Get chat history (use sessionId from previous response)
curl "http://localhost:3001/api/chat/history?sessionId=session-123"

# 4. Trigger data ingestion
curl -X POST http://localhost:3001/api/ingest

# 5. Reset session
curl -X POST http://localhost:3001/api/chat/reset \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session-123"}'
```

### Frontend Testing
1. Open http://localhost:3000
2. Send a test message
3. Verify streaming response appears
4. Check source attribution
5. Test session reset button
6. Test data ingestion button

## 🔄 Provider Switching Guide

### Change LLM Provider
```bash
# In backend/.env, modify:
LLM_PROVIDER=openai  # or 'gemini' or 'huggingface'
OPENAI_API_KEY=your_key_here
```

### Change Vector Store
```bash
# In backend/.env, modify:
VECTOR_STORE_TYPE=chroma  # or 'qdrant'
CHROMA_URL=http://localhost:8000

# In docker-compose.yml, activate chroma profile:
docker-compose --profile chroma up
```

### Change Embeddings Provider
```bash
# In backend/.env, modify:
EMBEDDINGS_PROVIDER=openai  # or 'jina' or 'huggingface'
OPENAI_API_KEY=your_key_here
```

## 🚀 Production Deployment

### Frontend (Vercel)
1. Connect GitHub repository
2. Set environment variable: `REACT_APP_API_URL=https://your-backend-url.com`
3. Deploy automatically on push

### Backend (Render/Railway)
1. Connect GitHub repository
2. Set all environment variables from `.env.example`
3. Add Redis add-on
4. Add Qdrant Cloud connection

### Managed Services
- **Redis**: Upstash Redis
- **Vector DB**: Qdrant Cloud
- **Database**: Supabase PostgreSQL (optional)

## 📈 Cache Configuration

### Session TTL Settings
- **Session History**: 7 days (604800 seconds)
- **Query Cache**: 1 hour (3600 seconds)
- **Document Cache**: Persistent in vector store

### Cache Warming Strategy
1. Pre-populate frequently asked questions
2. Background ingestion of trending topics
3. Periodic cache refresh for time-sensitive data

## 🔒 Security Implementation

- **Rate Limiting**: 100 requests/15min per IP
- **CORS Protection**: Configurable allowed origins
- **Input Validation**: Zod schema validation
- **API Key Security**: Environment-based configuration
- **Error Handling**: Sanitized error responses
- **Logging**: Comprehensive request/response logging

## 🎥 Demo Script

### Recording Timeline (5-minute demo)
1. **0:00-0:30** - System overview and architecture
2. **0:30-1:30** - Frontend chat interface demonstration
3. **1:30-2:30** - Real-time streaming responses with sources
4. **2:30-3:30** - Data ingestion and knowledge base update
5. **3:30-4:30** - API testing with curl commands
6. **4:30-5:00** - Provider switching and deployment notes

### Recording Commands
```bash
# Screen recording with ffmpeg (optional)
ffmpeg -f screen -r 30 -i :0.0 -c:v libx264 -preset ultrafast demo.mp4

# Alternative: Use OBS Studio or similar screen recording software
```

## 📋 Assignment Requirements Mapping

| Requirement | Implementation | Status |
|-------------|----------------|---------|
| Backend Tech Stack | Node.js + TypeScript + Express | ✅ |
| Chat Endpoints | Full CRUD + streaming | ✅ |
| Session Management | Redis with TTL | ✅ |
| Vector Database | Qdrant + Chroma fallback | ✅ |
| LLM Integration | Multi-provider support | ✅ |
| Ingestion Pipeline | RSS + web scraping | ✅ |
| Frontend Tech | React + TypeScript + SCSS | ✅ |
| Responsive UI | Mobile + desktop | ✅ |
| Docker Setup | Complete orchestration | ✅ |
| Documentation | Comprehensive guides | ✅ |
| Production Ready | Deployment instructions | ✅ |

## 🤝 Contribution Guidelines

1. Fork the repositories
2. Create feature branches
3. Follow TypeScript strict mode
4. Add tests for new features
5. Update documentation
6. Submit pull requests

## 📄 License

MIT License - See LICENSE files in individual repositories.

---

**Submission Date**: [Current Date]  
**Assignment**: Voosh RAG Chatbot System  
**Developer**: [Your Name]  
**Contact**: [Your Email]
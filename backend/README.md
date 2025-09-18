# RAG Backend

A production-ready Retrieval-Augmented Generation (RAG) backend built with Node.js, TypeScript, and Express.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │────│     Backend     │────│   Vector DB     │
│   (React)       │    │  (Node.js/TS)   │    │ (Qdrant/Chroma) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐    ┌─────────────────┐
                       │     Redis       │    │      LLM        │
                       │   (Sessions)    │    │ (Gemini/OpenAI) │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with security middleware
- **Vector Store**: Qdrant (primary) / Chroma (fallback)
- **LLM**: Google Gemini (primary) / OpenAI (fallback) / HuggingFace (local)
- **Embeddings**: Jina AI (primary) / OpenAI / HuggingFace
- **Cache**: Redis for session management
- **Database**: Optional PostgreSQL with Prisma

## 📋 Environment Variables

Copy `.env.example` to `.env` and configure:

### Required Variables
```bash
# Core Configuration
PORT=3001
NODE_ENV=development
REDIS_URL=redis://localhost:6379

# Vector Store (choose one)
VECTOR_STORE_TYPE=qdrant  # or 'chroma'
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_api_key_here

# LLM Provider (choose one)
LLM_PROVIDER=gemini  # or 'openai' or 'huggingface'
GEMINI_API_KEY=your_gemini_api_key_here

# Embeddings Provider
EMBEDDINGS_PROVIDER=jina  # or 'openai' or 'huggingface'
JINA_API_KEY=your_jina_api_key_here
```

### Cache TTL Settings
- **Session TTL**: 7 days (604800 seconds)
- **Query Cache TTL**: 1 hour (3600 seconds)

## 🛠️ Setup & Installation

### Local Development (without Docker)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start Redis and Vector DB**:
   ```bash
   # Redis
   docker run -d -p 6379:6379 redis:7-alpine
   
   # Qdrant
   docker run -d -p 6333:6333 qdrant/qdrant:latest
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

### Docker Deployment

1. **Build and run with docker-compose**:
   ```bash
   docker-compose up --build
   ```

## 📊 Data Ingestion

### Automated Ingestion
```bash
# Ingest latest articles from RSS feeds
npm run ingest

# Seed with sample data (offline demo)
npm run seed
```

### Manual Ingestion via API
```bash
curl -X POST http://localhost:3001/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"maxArticles": 25}'
```

## 🔌 API Endpoints

### Chat Endpoints

#### Send Message
```http
POST /api/chat/send
Content-Type: application/json

{
  "sessionId": "optional-session-id",
  "message": "What are the latest developments in AI?"
}
```

**Response**:
```json
{
  "sessionId": "session-123",
  "response": "Based on recent articles...",
  "sources": [
    {
      "title": "AI Breakthrough in 2024",
      "url": "https://example.com/article",
      "relevance": 0.95
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Get Chat History
```http
GET /api/chat/history?sessionId=session-123
```

#### Reset Session
```http
POST /api/chat/reset
Content-Type: application/json

{
  "sessionId": "session-123"
}
```

### System Endpoints

#### Health Check
```http
GET /api/health
```

#### Trigger Ingestion
```http
POST /api/ingest
```

## 🔄 Switching Providers

### LLM Provider
Change `LLM_PROVIDER` in `.env`:
- `gemini` - Google Gemini (requires GEMINI_API_KEY)
- `openai` - OpenAI GPT (requires OPENAI_API_KEY)
- `huggingface` - HuggingFace models (requires HUGGINGFACE_API_KEY)

### Vector Store
Change `VECTOR_STORE_TYPE` in `.env`:
- `qdrant` - Qdrant vector database
- `chroma` - ChromaDB

### Embeddings Provider
Change `EMBEDDINGS_PROVIDER` in `.env`:
- `jina` - Jina AI embeddings
- `openai` - OpenAI embeddings
- `huggingface` - HuggingFace sentence transformers

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Manual Testing
```bash
# Test chat endpoint
curl -X POST http://localhost:3001/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what can you tell me about recent tech news?"}'

# Test health endpoint
curl http://localhost:3001/api/health

# Test ingestion
curl -X POST http://localhost:3001/api/ingest
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable origins
- **Helmet Security**: Security headers middleware
- **Input Validation**: Zod schema validation
- **Error Handling**: Comprehensive error middleware
- **Logging**: Winston structured logging

## 📈 Performance & Optimization

### Caching Strategy
- **Session Cache**: Redis with 7-day TTL
- **Query Cache**: Redis with 1-hour TTL for frequently asked questions
- **Vector Cache**: Persistent storage in Qdrant/Chroma

### Retry & Backoff
- LLM API calls: Exponential backoff with 3 retries
- Vector store operations: Linear backoff with 2 retries
- External API calls: Circuit breaker pattern

## 🚀 Production Deployment

### Environment Setup
1. **Render/Railway Backend**:
   - Set environment variables
   - Connect Redis add-on
   - Deploy from GitHub

2. **Qdrant Cloud**:
   - Create cluster
   - Update QDRANT_URL and QDRANT_API_KEY

3. **Upstash Redis**:
   - Create database
   - Update REDIS_URL

### Health Monitoring
- Health endpoint: `/api/health`
- Metrics collection via Winston logs
- Docker health checks included

## 🐛 Troubleshooting

### Common Issues

1. **Vector Store Connection Failed**:
   ```bash
   # Check if Qdrant is running
   curl http://localhost:6333/collections
   
   # Check if Chroma is running
   curl http://localhost:8000/api/v1/heartbeat
   ```

2. **Redis Connection Failed**:
   ```bash
   # Test Redis connection
   redis-cli ping
   ```

3. **LLM API Errors**:
   - Verify API keys in `.env`
   - Check rate limits
   - Switch to fallback provider

### Logs Location
- Development: Console output
- Production: Structured JSON logs via Winston

## 📝 License

MIT License - see LICENSE file for details.
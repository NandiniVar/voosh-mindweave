import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  port: z.number().default(3001),
  environment: z.enum(['development', 'production', 'test']).default('development'),
  
  // Redis Configuration
  redis: z.object({
    url: z.string().default('redis://localhost:6379'),
    sessionTtl: z.number().default(7 * 24 * 60 * 60), // 7 days in seconds
    queryTtl: z.number().default(60 * 60), // 1 hour in seconds
  }),

  // Vector Store Configuration
  vectorStore: z.object({
    type: z.enum(['qdrant', 'chroma']).default('qdrant'),
    qdrant: z.object({
      url: z.string().default('http://localhost:6333'),
      apiKey: z.string().optional(),
      collectionName: z.string().default('rag_documents'),
    }),
    chroma: z.object({
      url: z.string().default('http://localhost:8000'),
      collectionName: z.string().default('rag_documents'),
    }),
  }),

  // LLM Configuration
  llm: z.object({
    provider: z.enum(['gemini', 'openai', 'huggingface']).default('gemini'),
    gemini: z.object({
      apiKey: z.string().default(''),
      model: z.string().default('gemini-pro'),
    }),
    openai: z.object({
      apiKey: z.string().default(''),
      model: z.string().default('gpt-3.5-turbo'),
    }),
    huggingface: z.object({
      apiKey: z.string().default(''),
      model: z.string().default('microsoft/DialoGPT-medium'),
    }),
  }),

  // Embeddings Configuration
  embeddings: z.object({
    provider: z.enum(['jina', 'openai', 'huggingface']).default('jina'),
    jina: z.object({
      apiKey: z.string().default(''),
      model: z.string().default('jina-embeddings-v2-base-en'),
    }),
    openai: z.object({
      apiKey: z.string().default(''),
      model: z.string().default('text-embedding-3-small'),
    }),
    huggingface: z.object({
      apiKey: z.string().default(''),
      model: z.string().default('sentence-transformers/all-MiniLM-L6-v2'),
    }),
  }),

  // Database Configuration (Optional)
  database: z.object({
    enabled: z.boolean().default(false),
    url: z.string().default('postgresql://localhost:5432/rag_db'),
  }),

  // Security
  corsOrigins: z.array(z.string()).default(['http://localhost:3000', 'http://localhost:5173']),
  
  // Data Ingestion
  ingest: z.object({
    rssFeeds: z.array(z.string()).default([
      'https://feeds.reuters.com/reuters/technologyNews',
      'https://rss.cnn.com/rss/edition.rss',
      'https://feeds.bbci.co.uk/news/technology/rss.xml'
    ]),
    maxArticles: z.number().default(50),
    chunkSize: z.number().default(1000),
    chunkOverlap: z.number().default(200),
  }),
});

const envConfig = {
  port: parseInt(process.env.PORT || '3001'),
  environment: process.env.NODE_ENV || 'development',
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    sessionTtl: parseInt(process.env.REDIS_SESSION_TTL || '604800'), // 7 days
    queryTtl: parseInt(process.env.REDIS_QUERY_TTL || '3600'), // 1 hour
  },

  vectorStore: {
    type: (process.env.VECTOR_STORE_TYPE || 'qdrant') as 'qdrant' | 'chroma',
    qdrant: {
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: process.env.QDRANT_COLLECTION || 'rag_documents',
    },
    chroma: {
      url: process.env.CHROMA_URL || 'http://localhost:8000',
      collectionName: process.env.CHROMA_COLLECTION || 'rag_documents',
    },
  },

  llm: {
    provider: (process.env.LLM_PROVIDER || 'gemini') as 'gemini' | 'openai' | 'huggingface',
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-pro',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    },
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY || '',
      model: process.env.HUGGINGFACE_MODEL || 'microsoft/DialoGPT-medium',
    },
  },

  embeddings: {
    provider: (process.env.EMBEDDINGS_PROVIDER || 'jina') as 'jina' | 'openai' | 'huggingface',
    jina: {
      apiKey: process.env.JINA_API_KEY || '',
      model: process.env.JINA_MODEL || 'jina-embeddings-v2-base-en',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_EMBEDDINGS_MODEL || 'text-embedding-3-small',
    },
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY || '',
      model: process.env.HUGGINGFACE_EMBEDDINGS_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',
    },
  },

  database: {
    enabled: process.env.DATABASE_ENABLED === 'true',
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/rag_db',
  },

  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],

  ingest: {
    rssFeeds: process.env.RSS_FEEDS?.split(',') || [
      'https://feeds.reuters.com/reuters/technologyNews',
      'https://rss.cnn.com/rss/edition.rss',
      'https://feeds.bbci.co.uk/news/technology/rss.xml'
    ],
    maxArticles: parseInt(process.env.MAX_ARTICLES || '50'),
    chunkSize: parseInt(process.env.CHUNK_SIZE || '1000'),
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '200'),
  },
};

export const config = configSchema.parse(envConfig);
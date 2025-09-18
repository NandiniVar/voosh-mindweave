import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { chatRouter } from './routes/chat';
import { ingestRouter } from './routes/ingest';
import { healthRouter } from './routes/health';
import { RedisClient } from './services/redis';
import { VectorStore } from './services/vectorStore';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Routes
app.use('/api/health', healthRouter);
app.use('/api/chat', chatRouter);
app.use('/api/ingest', ingestRouter);

// Error handling
app.use(errorHandler);

// Initialize services
async function startServer() {
  try {
    // Initialize Redis connection
    await RedisClient.connect();
    logger.info('Redis connected successfully');

    // Initialize Vector Store
    await VectorStore.initialize();
    logger.info('Vector store initialized successfully');

    const server = app.listen(config.port, () => {
      logger.info(`🚀 RAG Backend server running on port ${config.port}`, {
        environment: config.environment,
        vectorStore: config.vectorStore.type
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await RedisClient.disconnect();
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
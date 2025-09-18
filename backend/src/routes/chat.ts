import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { RedisClient } from '../services/redis';
import { LLMService } from '../services/llm';
import { VectorStore } from '../services/vectorStore';
import { validateRequest } from '../middleware/validation';

const chatRouter = Router();

// Schemas
const sendMessageSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1).max(4000),
});

const resetSessionSchema = z.object({
  sessionId: z.string(),
});

const historySchema = z.object({
  sessionId: z.string(),
});

// POST /api/chat/send
chatRouter.post('/send', validateRequest(sendMessageSchema), async (req, res) => {
  try {
    const { sessionId: providedSessionId, message } = req.body;
    const sessionId = providedSessionId || uuidv4();

    logger.info('Processing chat message', { sessionId, messageLength: message.length });

    // Get conversation history
    const history = await RedisClient.getSessionHistory(sessionId);

    // Retrieve relevant documents
    const retrievedDocs = await VectorStore.search(message, 5);
    logger.info(`Retrieved ${retrievedDocs.length} relevant documents`);

    // Generate response using LLM
    const response = await LLMService.generateResponse({
      message,
      history,
      context: retrievedDocs,
      sessionId,
    });

    // Store message and response in session history
    await RedisClient.addToSessionHistory(sessionId, {
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    await RedisClient.addToSessionHistory(sessionId, {
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      sources: response.sources,
    });

    // Set response headers for SSE if streaming is supported
    if (response.streaming) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // Stream the response
      for await (const chunk of response.stream!) {
        res.write(`data: ${JSON.stringify({ content: chunk, done: false })}\\n\\n`);
      }

      res.write(`data: ${JSON.stringify({ 
        content: '', 
        done: true, 
        sources: response.sources,
        sessionId 
      })}\\n\\n`);
      res.end();
    } else {
      // Send complete response
      res.json({
        sessionId,
        response: response.content,
        sources: response.sources,
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error('Error processing chat message:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process message',
    });
  }
});

// GET /api/chat/history
chatRouter.get('/history', async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        error: 'Invalid sessionId',
        message: 'sessionId is required',
      });
    }

    const history = await RedisClient.getSessionHistory(sessionId);
    
    res.json({
      sessionId,
      messages: history,
      count: history.length,
    });

  } catch (error) {
    logger.error('Error fetching chat history:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch chat history',
    });
  }
});

// POST /api/chat/reset
chatRouter.post('/reset', validateRequest(resetSessionSchema), async (req, res) => {
  try {
    const { sessionId } = req.body;

    await RedisClient.clearSessionHistory(sessionId);
    
    logger.info('Session reset', { sessionId });

    res.json({
      success: true,
      message: 'Session history cleared',
      sessionId,
    });

  } catch (error) {
    logger.error('Error resetting session:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to reset session',
    });
  }
});

export { chatRouter };
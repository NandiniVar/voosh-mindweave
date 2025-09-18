import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { HfInference } from '@huggingface/inference';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: Array<{
    title: string;
    url: string;
    relevance: number;
  }>;
}

export interface RetrievedDocument {
  id: string;
  content: string;
  metadata: {
    title: string;
    url: string;
    timestamp: string;
  };
  score: number;
}

export interface GenerateResponseParams {
  message: string;
  history: ChatMessage[];
  context: RetrievedDocument[];
  sessionId: string;
}

export interface LLMResponse {
  content: string;
  sources: Array<{
    title: string;
    url: string;
    relevance: number;
  }>;
  streaming?: boolean;
  stream?: AsyncGenerator<string>;
}

class LLMServiceClass {
  private gemini?: GoogleGenerativeAI;
  private openai?: OpenAI;
  private huggingface?: HfInference;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize Gemini
    if (config.llm.gemini.apiKey) {
      this.gemini = new GoogleGenerativeAI(config.llm.gemini.apiKey);
      logger.info('Gemini AI initialized');
    }

    // Initialize OpenAI
    if (config.llm.openai.apiKey) {
      this.openai = new OpenAI({
        apiKey: config.llm.openai.apiKey,
      });
      logger.info('OpenAI initialized');
    }

    // Initialize HuggingFace
    if (config.llm.huggingface.apiKey) {
      this.huggingface = new HfInference(config.llm.huggingface.apiKey);
      logger.info('HuggingFace initialized');
    }
  }

  async generateResponse(params: GenerateResponseParams): Promise<LLMResponse> {
    const { message, history, context, sessionId } = params;

    try {
      // Build context from retrieved documents
      const contextText = this.buildContextText(context);
      
      // Build conversation history
      const conversationHistory = this.buildConversationHistory(history);

      // Generate system prompt
      const systemPrompt = this.buildSystemPrompt(contextText);

      let response: LLMResponse;

      switch (config.llm.provider) {
        case 'gemini':
          response = await this.generateWithGemini(message, conversationHistory, systemPrompt);
          break;
        case 'openai':
          response = await this.generateWithOpenAI(message, conversationHistory, systemPrompt);
          break;
        case 'huggingface':
          response = await this.generateWithHuggingFace(message, conversationHistory, systemPrompt);
          break;
        default:
          throw new Error(`Unsupported LLM provider: ${config.llm.provider}`);
      }

      // Add sources from retrieved documents
      response.sources = context.map(doc => ({
        title: doc.metadata.title,
        url: doc.metadata.url,
        relevance: doc.score,
      }));

      logger.info('LLM response generated', {
        sessionId,
        provider: config.llm.provider,
        responseLength: response.content.length,
        sourcesCount: response.sources.length,
      });

      return response;

    } catch (error) {
      logger.error('Error generating LLM response:', error);
      
      // Fallback response
      return {
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        sources: [],
      };
    }
  }

  private async generateWithGemini(
    message: string,
    history: string,
    systemPrompt: string
  ): Promise<LLMResponse> {
    if (!this.gemini) {
      throw new Error('Gemini not initialized');
    }

    const model = this.gemini.getGenerativeModel({ model: config.llm.gemini.model });

    const prompt = `${systemPrompt}\\n\\nConversation History:\\n${history}\\n\\nUser: ${message}\\n\\nAssistant:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      content: text,
      sources: [],
    };
  }

  private async generateWithOpenAI(
    message: string,
    history: string,
    systemPrompt: string
  ): Promise<LLMResponse> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `Previous conversation:\\n${history}\\n\\nCurrent message: ${message}` },
    ];

    const completion = await this.openai.chat.completions.create({
      model: config.llm.openai.model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      content: completion.choices[0]?.message?.content || 'No response generated',
      sources: [],
    };
  }

  private async generateWithHuggingFace(
    message: string,
    history: string,
    systemPrompt: string
  ): Promise<LLMResponse> {
    if (!this.huggingface) {
      throw new Error('HuggingFace not initialized');
    }

    const prompt = `${systemPrompt}\\n\\nConversation History:\\n${history}\\n\\nUser: ${message}\\n\\nAssistant:`;

    const response = await this.huggingface.textGeneration({
      model: config.llm.huggingface.model,
      inputs: prompt,
      parameters: {
        max_new_tokens: 1000,
        temperature: 0.7,
        return_full_text: false,
      },
    });

    return {
      content: response.generated_text,
      sources: [],
    };
  }

  private buildContextText(context: RetrievedDocument[]): string {
    if (context.length === 0) {
      return 'No relevant context found in the knowledge base.';
    }

    return context
      .map((doc, index) => `[${index + 1}] ${doc.metadata.title}\\n${doc.content}\\n`)
      .join('\\n');
  }

  private buildConversationHistory(history: ChatMessage[]): string {
    return history
      .slice(-5) // Keep last 5 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\\n');
  }

  private buildSystemPrompt(contextText: string): string {
    return `You are a helpful AI assistant with access to a knowledge base of recent news articles and research papers. Your responses should be accurate, informative, and cite relevant sources when available.

KNOWLEDGE BASE CONTEXT:
${contextText}

INSTRUCTIONS:
1. Answer the user's question based on the provided context
2. If the context contains relevant information, reference it in your response
3. If the context doesn't contain relevant information, clearly state this
4. Be concise but thorough in your explanations
5. Maintain a helpful and professional tone
6. If asked about current events or recent developments, rely on the knowledge base context

Remember to provide accurate information and cite sources when referencing specific facts or claims.`;
  }
}

export const LLMService = new LLMServiceClass();
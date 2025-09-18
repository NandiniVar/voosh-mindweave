import { QdrantClient } from '@qdrant/js-client-rest';
import { ChromaApi, OpenAIApi, Configuration } from 'chromadb';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { EmbeddingService } from './embeddings';

export interface Document {
  id: string;
  content: string;
  metadata: {
    title: string;
    url: string;
    timestamp: string;
    source: string;
  };
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: {
    title: string;
    url: string;
    timestamp: string;
  };
  score: number;
}

class VectorStoreService {
  private qdrant?: QdrantClient;
  private chroma?: ChromaApi;
  private initialized = false;

  async initialize(): Promise<void> {
    try {
      if (config.vectorStore.type === 'qdrant') {
        await this.initializeQdrant();
      } else {
        await this.initializeChroma();
      }
      this.initialized = true;
      logger.info(`Vector store initialized: ${config.vectorStore.type}`);
    } catch (error) {
      logger.error('Failed to initialize vector store:', error);
      throw error;
    }
  }

  private async initializeQdrant(): Promise<void> {
    this.qdrant = new QdrantClient({
      url: config.vectorStore.qdrant.url,
      apiKey: config.vectorStore.qdrant.apiKey,
    });

    // Test connection
    await this.qdrant.getCollections();

    // Create collection if it doesn't exist
    try {
      await this.qdrant.getCollection(config.vectorStore.qdrant.collectionName);
    } catch (error) {
      logger.info('Creating Qdrant collection...');
      await this.qdrant.createCollection(config.vectorStore.qdrant.collectionName, {
        vectors: {
          size: 768, // Default embedding size for most models
          distance: 'Cosine',
        },
      });
    }
  }

  private async initializeChroma(): Promise<void> {
    const configuration = new Configuration({
      basePath: config.vectorStore.chroma.url,
    });
    this.chroma = new ChromaApi(configuration);

    // Test connection and create collection if needed
    try {
      await this.chroma.getCollection(config.vectorStore.chroma.collectionName);
    } catch (error) {
      logger.info('Creating Chroma collection...');
      await this.chroma.createCollection({
        name: config.vectorStore.chroma.collectionName,
        metadata: { description: 'RAG documents collection' },
      });
    }
  }

  async addDocuments(documents: Document[]): Promise<void> {
    if (!this.initialized) {
      throw new Error('Vector store not initialized');
    }

    logger.info(`Adding ${documents.length} documents to vector store`);

    if (config.vectorStore.type === 'qdrant') {
      await this.addDocumentsToQdrant(documents);
    } else {
      await this.addDocumentsToChroma(documents);
    }

    logger.info('Documents added successfully');
  }

  private async addDocumentsToQdrant(documents: Document[]): Promise<void> {
    if (!this.qdrant) throw new Error('Qdrant not initialized');

    // Generate embeddings for all documents
    const embeddings = await Promise.all(
      documents.map(doc => EmbeddingService.generateEmbedding(doc.content))
    );

    // Prepare points for Qdrant
    const points = documents.map((doc, index) => ({
      id: doc.id,
      vector: embeddings[index],
      payload: {
        content: doc.content,
        metadata: doc.metadata,
      },
    }));

    // Batch insert points
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      await this.qdrant.upsert(config.vectorStore.qdrant.collectionName, {
        wait: true,
        points: batch,
      });
    }
  }

  private async addDocumentsToChroma(documents: Document[]): Promise<void> {
    if (!this.chroma) throw new Error('Chroma not initialized');

    // Generate embeddings for all documents
    const embeddings = await Promise.all(
      documents.map(doc => EmbeddingService.generateEmbedding(doc.content))
    );

    // Prepare data for Chroma
    const ids = documents.map(doc => doc.id);
    const metadatas = documents.map(doc => ({
      content: doc.content,
      ...doc.metadata,
    }));
    const documents_content = documents.map(doc => doc.content);

    // Add to Chroma
    await this.chroma.add(config.vectorStore.chroma.collectionName, {
      ids,
      embeddings,
      metadatas,
      documents: documents_content,
    });
  }

  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    if (!this.initialized) {
      throw new Error('Vector store not initialized');
    }

    logger.info(`Searching for query: "${query}" (top ${topK})`);

    if (config.vectorStore.type === 'qdrant') {
      return this.searchQdrant(query, topK);
    } else {
      return this.searchChroma(query, topK);
    }
  }

  private async searchQdrant(query: string, topK: number): Promise<SearchResult[]> {
    if (!this.qdrant) throw new Error('Qdrant not initialized');

    // Generate embedding for query
    const queryEmbedding = await EmbeddingService.generateEmbedding(query);

    // Search in Qdrant
    const results = await this.qdrant.search(config.vectorStore.qdrant.collectionName, {
      vector: queryEmbedding,
      limit: topK,
      with_payload: true,
    });

    return results.map(result => ({
      id: result.id as string,
      content: result.payload?.content as string,
      metadata: result.payload?.metadata as any,
      score: result.score,
    }));
  }

  private async searchChroma(query: string, topK: number): Promise<SearchResult[]> {
    if (!this.chroma) throw new Error('Chroma not initialized');

    // Generate embedding for query
    const queryEmbedding = await EmbeddingService.generateEmbedding(query);

    // Search in Chroma
    const results = await this.chroma.query(config.vectorStore.chroma.collectionName, {
      query_embeddings: [queryEmbedding],
      n_results: topK,
      include: ['metadatas', 'documents', 'distances'],
    });

    return results.ids[0].map((id, index) => ({
      id: id as string,
      content: results.documents[0][index] as string,
      metadata: results.metadatas[0][index] as any,
      score: 1 - (results.distances?.[0]?.[index] || 0), // Convert distance to similarity
    }));
  }

  async deleteDocument(id: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Vector store not initialized');
    }

    if (config.vectorStore.type === 'qdrant') {
      await this.qdrant?.delete(config.vectorStore.qdrant.collectionName, {
        wait: true,
        points: [id],
      });
    } else {
      await this.chroma?.delete(config.vectorStore.chroma.collectionName, {
        ids: [id],
      });
    }

    logger.info(`Document deleted: ${id}`);
  }

  async clearCollection(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Vector store not initialized');
    }

    if (config.vectorStore.type === 'qdrant') {
      await this.qdrant?.delete(config.vectorStore.qdrant.collectionName, {
        wait: true,
        filter: {}, // Delete all points
      });
    } else {
      // For Chroma, we need to recreate the collection
      try {
        await this.chroma?.deleteCollection(config.vectorStore.chroma.collectionName);
      } catch (error) {
        // Collection might not exist
      }
      await this.chroma?.createCollection({
        name: config.vectorStore.chroma.collectionName,
        metadata: { description: 'RAG documents collection' },
      });
    }

    logger.info('Vector store collection cleared');
  }

  async getCollectionInfo(): Promise<any> {
    if (!this.initialized) {
      throw new Error('Vector store not initialized');
    }

    if (config.vectorStore.type === 'qdrant') {
      return await this.qdrant?.getCollection(config.vectorStore.qdrant.collectionName);
    } else {
      return await this.chroma?.getCollection(config.vectorStore.chroma.collectionName);
    }
  }
}

export const VectorStore = new VectorStoreService();
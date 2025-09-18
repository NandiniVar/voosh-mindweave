#!/usr/bin/env tsx

import Parser from 'rss-parser';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../src/config/config';
import { VectorStore, Document } from '../src/services/vectorStore';
import { logger } from '../src/utils/logger';

interface Article {
  title: string;
  content: string;
  url: string;
  publishedAt: string;
  source: string;
}

class DataIngestionService {
  private parser = new Parser();

  async ingestData(): Promise<void> {
    logger.info('Starting data ingestion process...');

    try {
      // Initialize vector store
      await VectorStore.initialize();

      const articles = await this.fetchArticles();
      logger.info(`Fetched ${articles.length} articles`);

      const documents = await this.processArticles(articles);
      logger.info(`Processed ${documents.length} documents`);

      await VectorStore.addDocuments(documents);
      logger.info('Data ingestion completed successfully');

    } catch (error) {
      logger.error('Data ingestion failed:', error);
      throw error;
    }
  }

  private async fetchArticles(): Promise<Article[]> {
    const articles: Article[] = [];
    const maxArticlesPerFeed = Math.ceil(config.ingest.maxArticles / config.ingest.rssFeeds.length);

    for (const feedUrl of config.ingest.rssFeeds) {
      try {
        logger.info(`Fetching from feed: ${feedUrl}`);
        const feed = await this.parser.parseURL(feedUrl);
        
        const feedArticles = await Promise.all(
          feed.items.slice(0, maxArticlesPerFeed).map(async (item) => {
            const content = await this.extractContent(item.link || '');
            return {
              title: item.title || 'Untitled',
              content,
              url: item.link || '',
              publishedAt: item.pubDate || new Date().toISOString(),
              source: this.extractDomain(feedUrl),
            };
          })
        );

        articles.push(...feedArticles.filter(article => article.content.length > 100));
        
      } catch (error) {
        logger.error(`Error fetching from feed ${feedUrl}:`, error);
      }
    }

    return articles;
  }

  private async extractContent(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RAG-Bot/1.0)',
        },
        timeout: 10000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style, nav, header, footer, aside');
      scripts.forEach(el => el.remove());

      // Try to find main content
      const contentSelectors = [
        'article',
        '[role="main"]',
        '.post-content',
        '.article-content',
        '.entry-content',
        '.content',
        'main',
      ];

      let content = '';
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          content = element.textContent || '';
          break;
        }
      }

      // Fallback to body content
      if (!content) {
        content = document.body?.textContent || '';
      }

      // Clean up the content
      content = content
        .replace(/\\s+/g, ' ')
        .replace(/\\n+/g, '\\n')
        .trim();

      return content.slice(0, 10000); // Limit content length

    } catch (error) {
      logger.error(`Error extracting content from ${url}:`, error);
      return '';
    }
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  private async processArticles(articles: Article[]): Promise<Document[]> {
    const documents: Document[] = [];

    for (const article of articles) {
      const chunks = this.chunkText(article.content);
      
      for (let i = 0; i < chunks.length; i++) {
        const doc: Document = {
          id: `${uuidv4()}-${i}`,
          content: chunks[i],
          metadata: {
            title: article.title,
            url: article.url,
            timestamp: article.publishedAt,
            source: article.source,
          },
        };
        documents.push(doc);
      }
    }

    return documents;
  }

  private chunkText(text: string): string[] {
    const chunks: string[] = [];
    const { chunkSize, chunkOverlap } = config.ingest;

    for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
      const chunk = text.slice(i, i + chunkSize);
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
    }

    return chunks;
  }
}

// CLI execution
async function main() {
  const ingestionService = new DataIngestionService();
  
  try {
    await ingestionService.ingestData();
    process.exit(0);
  } catch (error) {
    logger.error('Ingestion script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DataIngestionService };
// AI Platform Main Index
// Exports all AI platform services and engines

// Core Foundation
export { featureFlagsService } from './services/feature-flags.service';
export { llmEngine } from './ai/llm-engine';
export { cacheEngine } from './cache/cache-engine';
export { knowledgeEngine } from './knowledge/knowledge-engine';

// Adapters
export { geminiAdapter } from './providers/gemini-adapter';
export { googleSearchAdapter } from './providers/google-search-adapter';
export { googleNewsRSSAdapter } from './providers/google-news-rss-adapter';
export { wikipediaAdapter } from './providers/wikipedia-adapter';
export { githubAdapter } from './providers/github-adapter';
export { youtubeAdapter } from './providers/youtube-adapter';

// Engines
export { researchEngine } from './services/research-engine';
export { writingEngine } from './services/writing-engine';
export { knowledgeGraphEngine } from './services/knowledge-graph-engine';
export { recommendationEngine } from './services/recommendation-engine';

// Features
export { editorAI } from './services/editor-ai';
export { trendingEngine } from './services/trending-engine';
export { analyticsEngine } from './services/analytics-engine';
export { searchEngine } from './services/search-engine';
export { learningEngine } from './services/learning-engine';

// Types
export * from './types/ai.types';

/**
 * RAG Module — Public API
 */

export { chatStream, chat, getSources } from './chat';
export type { BotPersona, ChatMessage } from './chat';
export { indexAllSources, isIndexed, getIndexStats } from './indexer';
export type { IndexResult } from './indexer';
export { embedQuery, embedDocuments, embedTexts } from './embeddings';
export { getVectorStore } from './vector-store';
export type { VectorDocument, SearchResult } from './vector-store';
export { chunkText, chunkMarkdown, chunkCSV, chunkSQL } from './chunker';
export type { Chunk } from './chunker';

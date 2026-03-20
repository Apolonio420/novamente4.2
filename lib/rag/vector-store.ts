/**
 * In-Memory Vector Store for RAG
 * Cosine-similarity based. No external DB required.
 */

export interface VectorDocument {
    id: string;
    text: string;
    embedding: number[];
    metadata: {
        source: string;
        category: string;
        audience: string;
        title?: string;
        chunkIndex?: number;
    };
}

export interface SearchResult {
    document: VectorDocument;
    score: number;
}

class InMemoryVectorStore {
    private documents: VectorDocument[] = [];

    addDocuments(docs: VectorDocument[]): void {
        this.documents.push(...docs);
    }

    clear(): void {
        this.documents = [];
    }

    get size(): number {
        return this.documents.length;
    }

    search(
        queryEmbedding: number[],
        options: {
            topK?: number;
            audience?: string;
            category?: string;
            minScore?: number;
        } = {}
    ): SearchResult[] {
        const { topK = 5, audience, category, minScore = 0.3 } = options;

        let candidates = this.documents;

        if (audience) {
            candidates = candidates.filter(
                d => d.metadata.audience === audience || d.metadata.audience === 'both'
            );
        }

        if (category) {
            candidates = candidates.filter(d => d.metadata.category === category);
        }

        const scored: SearchResult[] = candidates.map(doc => ({
            document: doc,
            score: cosineSimilarity(queryEmbedding, doc.embedding),
        }));

        return scored
            .filter(r => r.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }

    export(): VectorDocument[] {
        return this.documents;
    }

    import(docs: VectorDocument[]): void {
        this.documents = docs;
    }
}

function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
}

let _store: InMemoryVectorStore | null = null;

export function getVectorStore(): InMemoryVectorStore {
    if (!_store) {
        _store = new InMemoryVectorStore();
    }
    return _store;
}

export { InMemoryVectorStore, cosineSimilarity };

/**
 * RAG Embeddings Module — Gemini Embedding API (REST)
 *
 * Uses direct fetch() calls — no heavy SDK needed.
 * Works within Vercel's 300mb serverless function limit.
 */

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MAX_TEXT_CHARS = 7500;

function getApiKey(): string {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set. Required for RAG embeddings.');
    }
    return apiKey;
}

export type TaskType = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' | 'QUESTION_ANSWERING' | 'SEMANTIC_SIMILARITY';

function truncateText(text: string): string {
    if (text.length <= MAX_TEXT_CHARS) return text;
    const truncated = text.slice(0, MAX_TEXT_CHARS);
    const lastPeriod = truncated.lastIndexOf('. ');
    if (lastPeriod > MAX_TEXT_CHARS * 0.7) {
        return truncated.slice(0, lastPeriod + 1);
    }
    return truncated;
}

export async function embedTexts(
    texts: string[],
    taskType: TaskType = 'RETRIEVAL_DOCUMENT'
): Promise<number[][]> {
    if (texts.length === 0) return [];

    const apiKey = getApiKey();
    const url = `${GEMINI_BASE}/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`;

    const safetexts = texts.map(t => truncateText(t));

    const requests = safetexts.map(text => ({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: EMBEDDING_DIMENSIONS,
    }));

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini embeddings API error (${res.status}): ${errorText.slice(0, 500)}`);
    }

    const data = await res.json();

    if (!data.embeddings || !Array.isArray(data.embeddings)) {
        throw new Error(`Unexpected Gemini response structure: ${JSON.stringify(data).slice(0, 300)}`);
    }

    return data.embeddings.map((e: { values?: number[] }) => {
        if (!e.values || !Array.isArray(e.values)) {
            return new Array(EMBEDDING_DIMENSIONS).fill(0);
        }
        return e.values;
    });
}

export async function embedQuery(query: string): Promise<number[]> {
    const vectors = await embedTexts([query], 'RETRIEVAL_QUERY');
    return vectors[0];
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
    const BATCH_SIZE = 50;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);

        try {
            const embeddings = await embedTexts(batch, 'RETRIEVAL_DOCUMENT');
            for (const emb of embeddings) {
                allEmbeddings.push(emb);
            }
        } catch (err) {
            console.error(`[RAG Embeddings] Batch failed:`, err instanceof Error ? err.message : err);
            for (let j = 0; j < batch.length; j++) {
                allEmbeddings.push(new Array(EMBEDDING_DIMENSIONS).fill(0));
            }
        }

        if (i + BATCH_SIZE < texts.length) {
            await new Promise(r => setTimeout(r, 200));
        }
    }

    return allEmbeddings;
}

export { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL };

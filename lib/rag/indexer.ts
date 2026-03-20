/**
 * RAG Indexer — Novamente Partner Assistant
 *
 * Reads source documents, chunks them, embeds them, and loads them
 * into the in-memory vector store. Designed for lazy initialization
 * at request time (first call indexes, subsequent calls skip).
 */

import { readFileSync } from 'fs'
import path from 'path'
import { chunkMarkdown } from './chunker'
import { embedDocuments } from './embeddings'
import { getVectorStore } from './vector-store'
import type { VectorDocument } from './vector-store'

const ROOT = process.cwd()

interface SourceDefinition {
    file: string
    audience: string
    type: 'markdown'
    category: string
}

const SOURCES: SourceDefinition[] = [
    {
        file: 'docs/rag/WORKSPACE_GUIDE.md',
        audience: 'partner',
        type: 'markdown',
        category: 'guide',
    },
    {
        file: 'docs/rag/CATALOG_GUIDE.md',
        audience: 'partner',
        type: 'markdown',
        category: 'guide',
    },
    {
        file: 'docs/rag/DESIGN_ENGINE_GUIDE.md',
        audience: 'partner',
        type: 'markdown',
        category: 'guide',
    },
    {
        file: 'docs/rag/LEADS_GUIDE.md',
        audience: 'partner',
        type: 'markdown',
        category: 'guide',
    },
    {
        file: 'docs/rag/BILLING_PLANS.md',
        audience: 'partner',
        type: 'markdown',
        category: 'billing',
    },
    {
        file: 'docs/rag/FAQ_PARTNERS.md',
        audience: 'partner',
        type: 'markdown',
        category: 'faq',
    },
    {
        file: 'docs/rag/TROUBLESHOOTING.md',
        audience: 'partner',
        type: 'markdown',
        category: 'support',
    },
]

export interface IndexResult {
    totalSources: number
    totalChunks: number
    skippedSources: string[]
    errors: string[]
}

function readFile(filePath: string): string | null {
    try {
        const absolute = path.join(ROOT, filePath)
        return readFileSync(absolute, 'utf-8')
    } catch {
        return null
    }
}

function chunkSource(source: SourceDefinition, content: string): VectorDocument[] {
    const chunks = chunkMarkdown(content, source.file)

    return chunks.map((chunk, i) => ({
        id: `${source.file}::${i}`,
        text: chunk.text,
        embedding: [],
        metadata: {
            source: source.file,
            category: source.category,
            audience: source.audience,
            title: chunk.title,
            chunkIndex: chunk.index,
        },
    }))
}

export async function indexAllSources(): Promise<IndexResult> {
    const store = getVectorStore()
    store.clear()

    const result: IndexResult = {
        totalSources: SOURCES.length,
        totalChunks: 0,
        skippedSources: [],
        errors: [],
    }

    const allDocs: VectorDocument[] = []

    for (const source of SOURCES) {
        const content = readFile(source.file)
        if (!content) {
            result.skippedSources.push(source.file)
            continue
        }

        try {
            const docs = chunkSource(source, content)
            allDocs.push(...docs)
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            result.errors.push(`${source.file}: ${msg}`)
        }
    }

    if (allDocs.length > 0) {
        try {
            const texts = allDocs.map(d => d.text)
            const embeddings = await embedDocuments(texts)

            for (let i = 0; i < allDocs.length; i++) {
                allDocs[i].embedding = embeddings[i]
            }

            store.addDocuments(allDocs)
            result.totalChunks = allDocs.length
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            result.errors.push(`Embedding failed: ${msg}`)
        }
    }

    return result
}

export function isIndexed(): boolean {
    return getVectorStore().size > 0
}

export function getIndexStats(): { totalChunks: number } {
    return { totalChunks: getVectorStore().size }
}

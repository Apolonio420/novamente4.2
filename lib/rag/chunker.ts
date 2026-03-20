/**
 * Document Chunker for RAG
 *
 * Splits documents into overlapping chunks optimized for embedding.
 * Uses semantic boundaries (headers, paragraphs) when possible.
 */

export interface Chunk {
    text: string;
    index: number;
    source: string;
    title?: string;
}

const DEFAULT_CHUNK_SIZE = 1500;   // ~375 tokens (4 chars/token avg)
const DEFAULT_CHUNK_OVERLAP = 200; // overlap between chunks
const MAX_CHUNKS_PER_DOCUMENT = 500; // safety limit

/**
 * Split text into chunks with overlap.
 * Tries to break at paragraph boundaries.
 */
export function chunkText(
    text: string,
    source: string,
    options: {
        chunkSize?: number;
        chunkOverlap?: number;
        title?: string;
    } = {}
): Chunk[] {
    const { chunkSize = DEFAULT_CHUNK_SIZE, chunkOverlap = DEFAULT_CHUNK_OVERLAP, title } = options;

    const normalized = text.replace(/\r\n/g, '\n').trim();
    if (normalized.length === 0) return [];

    if (normalized.length <= chunkSize) {
        return [{ text: normalized, index: 0, source, title }];
    }

    const chunks: Chunk[] = [];
    let start = 0;
    let index = 0;

    while (start < normalized.length && index < MAX_CHUNKS_PER_DOCUMENT) {
        let end = Math.min(start + chunkSize, normalized.length);

        if (end < normalized.length) {
            const minBreak = start + Math.floor(chunkSize * 0.5);

            const lastParagraph = normalized.lastIndexOf('\n\n', end);
            if (lastParagraph > minBreak) {
                end = lastParagraph;
            } else {
                const lastNewline = normalized.lastIndexOf('\n', end);
                if (lastNewline > minBreak) {
                    end = lastNewline;
                } else {
                    const lastPeriod = normalized.lastIndexOf('. ', end);
                    if (lastPeriod > minBreak) {
                        end = lastPeriod + 1;
                    }
                }
            }
        }

        const chunkContent = normalized.slice(start, end).trim();
        if (chunkContent.length > 0) {
            chunks.push({ text: chunkContent, index, source, title });
            index++;
        }

        const nextStart = end - chunkOverlap;
        if (nextStart <= start) {
            start = end;
        } else {
            start = nextStart;
        }
    }

    return chunks;
}

/**
 * Split a Markdown document into chunks, preserving header context.
 */
export function chunkMarkdown(
    markdown: string,
    source: string,
    options: { chunkSize?: number; chunkOverlap?: number } = {}
): Chunk[] {
    const lines = markdown.split('\n');
    const sections: { header: string; content: string }[] = [];
    let currentHeader = '';
    let currentContent: string[] = [];

    for (const line of lines) {
        if (/^#{1,3}\s/.test(line)) {
            if (currentContent.length > 0) {
                sections.push({ header: currentHeader, content: currentContent.join('\n') });
            }
            currentHeader = line.replace(/^#+\s*/, '').trim();
            currentContent = [];
        } else {
            currentContent.push(line);
        }
    }

    if (currentContent.length > 0) {
        sections.push({ header: currentHeader, content: currentContent.join('\n') });
    }

    const allChunks: Chunk[] = [];
    for (const section of sections) {
        const prefixedText = section.header
            ? `## ${section.header}\n\n${section.content}`
            : section.content;

        const chunks = chunkText(prefixedText, source, {
            ...options,
            title: section.header || undefined,
        });
        for (const chunk of chunks) {
            allChunks.push(chunk);
        }
    }

    return allChunks.map((c, i) => ({ ...c, index: i }));
}

/**
 * Split a CSV into row-based chunks (header repeated per chunk).
 */
export function chunkCSV(
    csv: string,
    source: string,
    options: { chunkSize?: number } = {}
): Chunk[] {
    const { chunkSize = DEFAULT_CHUNK_SIZE } = options;
    const lines = csv.split('\n').filter(l => l.trim());
    if (lines.length === 0) return [];

    const header = lines[0];
    const chunks: Chunk[] = [];
    let currentChunk = header + '\n';
    let index = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i] + '\n';
        if (currentChunk.length + line.length > chunkSize && currentChunk.length > header.length + 1) {
            chunks.push({ text: currentChunk.trim(), index, source });
            currentChunk = header + '\n';
            index++;
        }
        currentChunk += line;
    }

    if (currentChunk.length > header.length + 1) {
        chunks.push({ text: currentChunk.trim(), index, source });
    }

    return chunks;
}

/**
 * Split SQL DDL into table-based chunks.
 */
export function chunkSQL(sql: string, source: string): Chunk[] {
    const tableRegex = /CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\([^;]+\);/gi;
    const chunks: Chunk[] = [];
    let match;
    let index = 0;

    while ((match = tableRegex.exec(sql)) !== null) {
        chunks.push({
            text: match[0],
            index,
            source,
            title: `Table: ${match[1]}`,
        });
        index++;
    }

    return chunks;
}

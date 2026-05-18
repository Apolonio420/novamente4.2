'use strict';

/**
 * TASK-004 — Regenerar imágenes hero baja calidad con Gemini
 * Uso: node --env-file .env.local scripts/regen-heroes.js
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const PROJECT_ROOT = path.join(__dirname, '..');
const LIFESTYLE_DIR = path.join(PROJECT_ROOT, 'public', 'marketing', 'lifestyle');
const ORIGINALS_DIR = path.join(LIFESTYLE_DIR, '_originals');
const UPDATES_MD = path.join(PROJECT_ROOT, 'backlog', 'UPDATES.md');

// 5 smallest candidates (all < 100 KB, matching naming criteria, confirmed used in TSX)
const CANDIDATES = [
  'home-carousel-2.webp',       // ~38 KB
  'hero-otono-streetwear.webp', // ~47 KB
  'hero-azotea-blue-hour.webp', // ~48 KB
  'hero-regalo-pareja.webp',    // ~48 KB
  'hero-lanza-tu-marca.webp',   // ~49 KB
];

const MIN_SIZE_BYTES = 150 * 1024; // 150 KB
const MIN_DIMENSION = 1600;

async function analyzeImage(genAI, imageBuffer) {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_TEXT_MODEL || 'gemini-1.5-pro',
  });

  const prompt = `Analyze this lifestyle/fashion marketing photo for a merch clothing brand.
Provide:
1. A brief description of the scene (subject, setting, lighting, mood, color palette, clothing style)
2. An image generation prompt in English to recreate this exact scene in professional high-quality photographic style. Same artistic direction, mood, palette, and composition. Under 400 characters.

Reply EXACTLY in this format (no extra lines):
DESCRIPTION: <one paragraph>
PROMPT: <english prompt>`;

  const result = await model.generateContent([
    { inlineData: { mimeType: 'image/webp', data: imageBuffer.toString('base64') } },
    prompt,
  ]);

  const text = result.response.text();
  const descMatch = text.match(/DESCRIPTION:\s*(.+?)(?=\nPROMPT:)/s);
  const promptMatch = text.match(/PROMPT:\s*(.+)/s);

  return {
    description: descMatch ? descMatch[1].trim() : 'No description',
    prompt: promptMatch ? promptMatch[1].trim().split('\n')[0].trim() : null,
  };
}

async function generateImage(genAI, textPrompt) {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview',
  });

  const fullPrompt = `Generate a high-quality professional lifestyle marketing photograph (1920x1080, photorealistic, editorial quality): ${textPrompt}`;

  const result = await model.generateContent([fullPrompt]);

  // Extract inlineData image from candidates
  for (const cand of result.response?.candidates ?? []) {
    for (const part of cand?.content?.parts ?? []) {
      const inline = part?.inlineData;
      if (inline?.mimeType?.startsWith('image/') && typeof inline?.data === 'string') {
        return { mimeType: inline.mimeType, data: Buffer.from(inline.data, 'base64') };
      }
    }
  }

  // Fallback: check response text for base64 data URI
  const text = result.response.text();
  if (text && text.startsWith('data:image/')) {
    const [header, b64] = text.split(',');
    const mimeType = header.replace('data:', '').replace(';base64', '');
    return { mimeType, data: Buffer.from(b64, 'base64') };
  }

  return null;
}

async function processImage(genAI, sharp, imageName) {
  const imagePath = path.join(LIFESTYLE_DIR, imageName);
  const backupPath = path.join(ORIGINALS_DIR, imageName);

  const statBefore = fs.statSync(imagePath);
  const kbBefore = Math.round(statBefore.size / 1024);

  console.log(`\n[${imageName}] ${kbBefore} KB`);

  // 1. Backup
  fs.copyFileSync(imagePath, backupPath);
  console.log(`  backup OK`);

  // 2. Read current image
  const imageBuffer = fs.readFileSync(imagePath);

  // 3. Analyze with Gemini vision
  console.log(`  analyzing...`);
  let analysis;
  try {
    analysis = await analyzeImage(genAI, imageBuffer);
    console.log(`  prompt: ${(analysis.prompt || '').slice(0, 80)}...`);
  } catch (err) {
    console.error(`  analysis failed: ${err.message}`);
    return { file: imageName, status: 'SKIP', reason: `Analysis failed: ${err.message}`, kbBefore, kbAfter: kbBefore, dimensions: 'n/a', prompt: '' };
  }

  if (!analysis.prompt) {
    console.log(`  no prompt — SKIP`);
    return { file: imageName, status: 'SKIP', reason: 'No prompt from analysis', kbBefore, kbAfter: kbBefore, dimensions: 'n/a', prompt: '' };
  }

  // 4. Generate new image (max 2 attempts)
  let imageData = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    console.log(`  generating (attempt ${attempt})...`);
    try {
      imageData = await generateImage(genAI, analysis.prompt);
      if (imageData) break;
      console.log(`  no image data returned`);
    } catch (err) {
      console.error(`  generation attempt ${attempt} error: ${err.message}`);
      if (attempt === 2) {
        fs.copyFileSync(backupPath, imagePath);
        return { file: imageName, status: 'FAIL', reason: `Generation failed: ${err.message}`, kbBefore, kbAfter: kbBefore, dimensions: 'n/a', prompt: analysis.prompt };
      }
    }
  }

  if (!imageData) {
    console.log(`  SKIP — no image data after 2 attempts`);
    return { file: imageName, status: 'SKIP', reason: 'No image data in Gemini response', kbBefore, kbAfter: kbBefore, dimensions: 'n/a', prompt: analysis.prompt };
  }

  // 5. Convert to WebP at 1920x1080 quality 85
  console.log(`  converting to WebP...`);
  let webpBuffer;
  try {
    webpBuffer = await sharp(imageData.data)
      .resize(1920, 1080, { fit: 'cover', position: 'centre' })
      .webp({ quality: 85 })
      .toBuffer();
  } catch (err) {
    console.error(`  sharp failed: ${err.message}`);
    fs.copyFileSync(backupPath, imagePath);
    return { file: imageName, status: 'FAIL', reason: `Sharp failed: ${err.message}`, kbBefore, kbAfter: kbBefore, dimensions: 'n/a', prompt: analysis.prompt };
  }

  // 6. Verify size and dimensions
  const kbAfter = Math.round(webpBuffer.length / 1024);
  const meta = await sharp(webpBuffer).metadata();
  const dimensions = `${meta.width}x${meta.height}`;
  const maxDim = Math.max(meta.width || 0, meta.height || 0);

  console.log(`  result: ${kbAfter} KB, ${dimensions}`);

  if (webpBuffer.length < MIN_SIZE_BYTES || maxDim < MIN_DIMENSION) {
    console.log(`  FAIL — too small (${kbAfter}KB / ${maxDim}px). Restoring backup.`);
    fs.copyFileSync(backupPath, imagePath);
    return { file: imageName, status: 'FAIL', reason: `Too small: ${kbAfter}KB / ${maxDim}px`, kbBefore, kbAfter, dimensions, prompt: analysis.prompt };
  }

  // 7. Overwrite original
  fs.writeFileSync(imagePath, webpBuffer);
  console.log(`  OK: ${kbBefore} KB => ${kbAfter} KB`);

  return { file: imageName, status: 'OK', kbBefore, kbAfter, dimensions, prompt: analysis.prompt };
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not set. Run: node --env-file .env.local scripts/regen-heroes.js');
    process.exit(1);
  }

  let sharp;
  try {
    sharp = require('sharp');
  } catch (err) {
    console.error('sharp not available:', err.message);
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  if (!fs.existsSync(ORIGINALS_DIR)) {
    fs.mkdirSync(ORIGINALS_DIR, { recursive: true });
    console.log('Created _originals/');
  }

  const today = new Date().toISOString().split('T')[0];
  console.log(`\n=== TASK-004 regen-heroes ${today} ===`);
  console.log(`Candidates: ${CANDIDATES.join(', ')}`);

  const results = [];
  for (const name of CANDIDATES) {
    const r = await processImage(genAI, sharp, name);
    results.push(r);
  }

  // Append report to UPDATES.md
  const rows = results.map(r =>
    `| ${r.file} | ${r.kbBefore} KB | ${r.kbAfter} KB | ${r.dimensions} | ${(r.prompt || '').slice(0, 60)}... | ${r.status}${r.reason ? ` — ${r.reason}` : ''} |`
  ).join('\n');

  const report = `\n## Regeneracion imagenes hero Gemini — ${today}\n\n| archivo | KB antes | KB despues | dimensiones | prompt usado | resultado |\n|---------|----------|------------|-------------|--------------|----------|\n${rows}\n`;

  fs.appendFileSync(UPDATES_MD, report);
  console.log('\nReport appended to UPDATES.md');

  const ok = results.filter(r => r.status === 'OK').length;
  const skip = results.filter(r => r.status === 'SKIP').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  console.log(`\nSUMMARY: ${ok} OK, ${skip} SKIP, ${fail} FAIL`);

  // Exit with error code if nothing succeeded (to flag in CI)
  if (ok === 0) process.exit(2);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

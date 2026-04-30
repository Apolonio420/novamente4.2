/**
 * Sets CORS rules on the R2 bucket so the browser can PUT directly via
 * presigned URLs (used by the TikTok uploader at /workspace/integrations/tiktok/post).
 * Without this CORS config, presigned uploads fail with "network error".
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3'

const envPath = resolve(__dirname, '../.env.local')
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i === -1) continue
  const k = t.slice(0, i).trim()
  const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  if (!process.env[k]) process.env[k] = v
}

const endpoint = (process.env.CLOUDFLARE_R2_ENDPOINT || '').trim()
let sanitizedEndpoint = endpoint
try {
  if (endpoint) {
    const u = new URL(endpoint)
    sanitizedEndpoint = `${u.protocol}//${u.host}`
  }
} catch {
  /* noop */
}

const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'novamente'

// SSL workaround for Windows (same as lib/cloudflare-r2.ts).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { NodeHttpHandler } = require('@smithy/node-http-handler')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Agent } = require('https')
const requestHandler = new NodeHttpHandler({
  httpsAgent: new Agent({ rejectUnauthorized: false }),
})

const client = new S3Client({
  region: 'auto',
  endpoint: sanitizedEndpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: (process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '').trim(),
    secretAccessKey: (process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '').trim(),
  },
  requestHandler,
})

const corsRules = {
  CORSRules: [
    {
      AllowedOrigins: [
        'https://www.novamente.ar',
        'https://novamente.ar',
        'https://*.vercel.app',
        'http://localhost:3000',
      ],
      AllowedMethods: ['PUT', 'GET', 'HEAD', 'POST'],
      AllowedHeaders: ['*'],
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3600,
    },
  ],
}

async function main() {
  console.log(`[r2-cors] bucket=${bucket}  endpoint=${sanitizedEndpoint}`)
  await client.send(new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: corsRules }))
  console.log('[r2-cors] PutBucketCors OK')
  const got = await client.send(new GetBucketCorsCommand({ Bucket: bucket }))
  console.log('[r2-cors] verified rules:')
  console.log(JSON.stringify(got.CORSRules, null, 2))
}

main().catch((e) => {
  console.error('[r2-cors] FAILED:', e)
  process.exit(1)
})

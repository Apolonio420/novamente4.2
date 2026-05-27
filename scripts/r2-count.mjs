import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const today = Date.now() - 24 * 60 * 60 * 1000
const week = Date.now() - 7 * 24 * 60 * 60 * 1000

const cmd = new ListObjectsV2Command({
  Bucket: process.env.R2_BUCKET_NAME || 'novamente',
  Prefix: 'v1/raw-designs/',
  MaxKeys: 1000,
})
const r = await client.send(cmd)
const objects = r.Contents || []
const todayCount = objects.filter(o => {
  const ts = parseInt(o.Key.match(/v1\/raw-designs\/(\d+)/)?.[1] || '0')
  return ts > today
}).length
const weekCount = objects.filter(o => {
  const ts = parseInt(o.Key.match(/v1\/raw-designs\/(\d+)/)?.[1] || '0')
  return ts > week
}).length
console.log('Total raw-designs:', objects.length)
console.log('Last 24h:', todayCount)
console.log('Last 7d:', weekCount)

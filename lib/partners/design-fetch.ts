/**
 * Helper compartido para resolver una URL de diseño (data:, /api/proxy-image
 * de R2, absoluta o relativa) a un Buffer — mismo patrón de 4 casos que ya
 * usa app/api/partners/design/mockup/route.ts, factorizado para que los
 * endpoints de Fase 3 (mockup-preview, from-design) no lo dupliquen.
 */
export function resolveRequestOrigin(h: Headers): string {
  const hostHeader = h.get('host')
  const protoHeader = h.get('x-forwarded-proto') || 'https'
  const originFromHeaders = hostHeader ? `${protoHeader}://${hostHeader}` : null
  return (
    originFromHeaders
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'http://localhost:3000'
  )
}

export async function fetchDesignBuffer(designUrl: string, origin: string): Promise<Buffer> {
  if (designUrl.startsWith('data:')) {
    return Buffer.from(designUrl.replace(/^data:image\/[^;]+;base64,/, ''), 'base64')
  }

  if (designUrl.startsWith('/api/proxy-image')) {
    const u = new URL(designUrl, origin)
    const key = u.searchParams.get('key')
    if (!key) throw new Error('designUrl inválido: falta param key')
    const { r2Client, BUCKET_NAME } = await import('@/lib/cloudflare-r2')
    const { GetObjectCommand } = await import('@aws-sdk/client-s3')
    const { normalizeR2Key } = await import('@/lib/r2')
    const normalizedKey = normalizeR2Key(decodeURIComponent(key))
    if (!normalizedKey) throw new Error(`R2 key inválido: ${key}`)
    const cmd = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: normalizedKey })
    const resp = await r2Client.send(cmd)
    const body = resp.Body as any
    const bytes = typeof body.transformToByteArray === 'function'
      ? await body.transformToByteArray()
      : await (async () => {
          const chunks: Buffer[] = []
          for await (const chunk of body) chunks.push(Buffer.from(chunk))
          return Buffer.concat(chunks)
        })()
    return Buffer.from(bytes)
  }

  const absolute = designUrl.startsWith('http')
    ? designUrl
    : `${origin}${designUrl.startsWith('/') ? '' : '/'}${designUrl}`
  const resp = await fetch(absolute)
  if (!resp.ok) throw new Error(`No se pudo descargar el diseño (${resp.status} en ${absolute})`)
  return Buffer.from(await resp.arrayBuffer())
}

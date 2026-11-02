import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Validación del header `x-signature` de los webhooks de MercadoPago
 * (doc oficial "Validar a origem da notificação"):
 *   x-signature: "ts=<ms>,v1=<hex>"
 *   manifest:    "id:<data.id de la URL>;request-id:<x-request-id>;ts:<ts>;"
 *                (si un valor no viene en la notificación, ese par se omite;
 *                data.id alfanumérico va en minúsculas)
 *   v1 = HMAC-SHA256(secreto de la app, manifest) en hex.
 *
 * Pendiente de la auditoría del workspace partner (08/10): el webhook de
 * suscripciones no validaba la firma — la defensa era solo "fetch-to-verify"
 * (se re-consulta el pago/preapproval a MP con nuestro token).
 */
export type MpSignatureResult = 'valid' | 'invalid' | 'missing'

export function buildMpManifest(dataId: string | null, requestId: string | null, ts: string | null): string {
  let manifest = ''
  if (dataId) manifest += `id:${/^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId};`
  if (requestId) manifest += `request-id:${requestId};`
  if (ts) manifest += `ts:${ts};`
  return manifest
}

export function verifyMpSignature(opts: {
  xSignature: string | null
  xRequestId: string | null
  dataId: string | null
  secret: string
}): MpSignatureResult {
  if (!opts.xSignature) return 'missing'
  let ts: string | null = null
  let v1: string | null = null
  for (const part of opts.xSignature.split(',')) {
    const [rawKey, ...rest] = part.split('=')
    const key = rawKey?.trim()
    const value = rest.join('=').trim()
    if (key === 'ts') ts = value
    else if (key === 'v1') v1 = value
  }
  if (!ts || !v1) return 'invalid'

  const expected = createHmac('sha256', opts.secret)
    .update(buildMpManifest(opts.dataId, opts.xRequestId, ts))
    .digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(v1.toLowerCase(), 'utf8')
  return a.length === b.length && timingSafeEqual(a, b) ? 'valid' : 'invalid'
}

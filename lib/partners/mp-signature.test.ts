import { describe, it, expect } from 'vitest'
import { createHmac } from 'crypto'
import { buildMpManifest, verifyMpSignature } from './mp-signature'

const secret = 's3cr3t'
const sign = (manifest: string, key = secret) => createHmac('sha256', key).update(manifest).digest('hex')

describe('buildMpManifest', () => {
  it('arma id;request-id;ts; en ese orden', () => {
    expect(buildMpManifest('123', 'req', '99')).toBe('id:123;request-id:req;ts:99;')
  })
  it('omite los pares que no vienen y pasa el id alfanumérico a minúsculas', () => {
    expect(buildMpManifest('ABC123', null, '99')).toBe('id:abc123;ts:99;')
    expect(buildMpManifest(null, 'req', '99')).toBe('request-id:req;ts:99;')
  })
})

describe('verifyMpSignature', () => {
  const base = { xRequestId: 'req', dataId: '123', secret }
  it('firma correcta → valid (tolera espacios y orden de las partes)', () => {
    const v1 = sign('id:123;request-id:req;ts:99;')
    expect(verifyMpSignature({ ...base, xSignature: `ts=99,v1=${v1}` })).toBe('valid')
    expect(verifyMpSignature({ ...base, xSignature: ` v1=${v1} , ts=99` })).toBe('valid')
  })
  it('otro secreto, otro id o ts alterado → invalid', () => {
    const v1 = sign('id:123;request-id:req;ts:99;', 'otro')
    expect(verifyMpSignature({ ...base, xSignature: `ts=99,v1=${v1}` })).toBe('invalid')
    const good = sign('id:123;request-id:req;ts:99;')
    expect(verifyMpSignature({ ...base, dataId: '124', xSignature: `ts=99,v1=${good}` })).toBe('invalid')
    expect(verifyMpSignature({ ...base, xSignature: `ts=100,v1=${good}` })).toBe('invalid')
  })
  it('header ausente → missing; header sin ts o v1 → invalid', () => {
    expect(verifyMpSignature({ ...base, xSignature: null })).toBe('missing')
    expect(verifyMpSignature({ ...base, xSignature: 'v1=abc' })).toBe('invalid')
    expect(verifyMpSignature({ ...base, xSignature: 'basura' })).toBe('invalid')
  })
})

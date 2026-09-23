import { beforeEach, describe, expect, it, vi } from 'vitest'

const insertResult: { data: unknown; error: unknown } = { data: null, error: null }
const insertSpy = vi.fn()

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: () => ({
      insert: (row: unknown) => {
        insertSpy(row)
        return { select: () => ({ single: async () => insertResult }) }
      },
    }),
  },
}))

const notifyError = vi.fn(async () => undefined)
vi.mock('@/lib/notifications', () => ({ notifyError }))

import { saveDesignAsset, __resetSaveDesignAssetAlertThrottle } from './design-engine'

describe('saveDesignAsset', () => {
  beforeEach(() => {
    insertSpy.mockClear()
    notifyError.mockClear()
    __resetSaveDesignAssetAlertThrottle()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('inserta la fila con type/status/storage_key y la devuelve', async () => {
    insertResult.data = { id: 'a1', type: 'mockup' }
    insertResult.error = null

    const asset = await saveDesignAsset('t1', 'https://cdn/x.png', 'partners/s/mockups/x.png', 'mockup', { side: 'front' })

    expect(asset).toEqual({ id: 'a1', type: 'mockup' })
    expect(insertSpy).toHaveBeenCalledWith({
      tenant_id: 't1',
      type: 'mockup',
      status: 'active',
      storage_key: 'partners/s/mockups/x.png',
      public_url: 'https://cdn/x.png',
      metadata: { side: 'front' },
    })
    expect(notifyError).not.toHaveBeenCalled()
  })

  it('si el insert falla devuelve null y avisa por notifyError con el código del error', async () => {
    insertResult.data = null
    insertResult.error = { code: '23514', message: 'violates check constraint "partner_assets_status_check"' }

    const asset = await saveDesignAsset('t1', 'https://cdn/x.png', 'partners/s/mockups/x.png', 'mockup')

    expect(asset).toBeNull()
    expect(notifyError).toHaveBeenCalledTimes(1)
    const payload = (notifyError.mock.calls[0] as unknown as [{ message: string }])[0]
    expect(payload.message).toContain('23514')
    expect(payload.message).toContain('partners/s/mockups/x.png')
  })

  it('throttlea: fallos repetidos mandan UNA sola alerta', async () => {
    insertResult.data = null
    insertResult.error = { code: '23514', message: 'check' }

    await saveDesignAsset('t1', 'u', 'k1', 'design')
    await saveDesignAsset('t1', 'u', 'k2', 'stamp')
    await saveDesignAsset('t1', 'u', 'k3', 'mockup')

    expect(notifyError).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledTimes(3)
  })

  it('si notifyError explota, saveDesignAsset igual devuelve null sin tirar', async () => {
    insertResult.data = null
    insertResult.error = { code: 'X', message: 'boom' }
    notifyError.mockRejectedValueOnce(new Error('telegram caído'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(saveDesignAsset('t1', 'u', 'k', 'design')).resolves.toBeNull()
  })
})

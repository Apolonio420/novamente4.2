/**
 * E2E: el arte print-ready guardado en un producto (metadata.print_ready_url)
 * lo ve el workspace (lo que usa el modal de carga para matchear la estampa).
 * Crea un producto draft de prueba y lo borra al final (no toca datos reales).
 */
import { test, expect } from '@playwright/test'
import { getPartnerAccessToken, hasPartnerAuthCreds } from './fixtures/partner-auth'

test.describe('Partner: arte print-ready por producto', () => {
  test.skip(!hasPartnerAuthCreds(), 'Faltan creds de partner E2E')

  test('guardar arte en un producto → el workspace lo lee', async ({ request }) => {
    const token = await getPartnerAccessToken()
    const auth = { Authorization: `Bearer ${token}` }
    const artUrl = 'https://example.com/partner-print-ready/test-e2e-arte.png'

    // Crear producto draft con arte print-ready en metadata
    const createRes = await request.post('/api/partners/catalog', {
      headers: auth,
      data: {
        name: 'Remera Test E2E Arte',
        category: 'remera',
        status: 'draft',
        images: [],
        metadata: { print_ready_url: artUrl, print_side: 'dorso', sizes: ['M'] },
      },
    })
    expect(createRes.status()).toBe(201)
    const { product } = await createRes.json()
    expect(product?.id).toBeTruthy()

    try {
      // El catálogo del workspace (lo que consume el modal) devuelve el arte sin strip
      const listRes = await request.get('/api/partners/catalog', { headers: auth })
      expect(listRes.ok()).toBeTruthy()
      const { products } = await listRes.json()
      const found = products.find((p: { id: string }) => p.id === product.id)
      expect(found?.metadata?.print_ready_url).toBe(artUrl)
      expect(found?.metadata?.print_side).toBe('dorso')
    } finally {
      await request.delete(`/api/partners/catalog/${product.id}`, { headers: auth }).catch(() => null)
    }
  })
})

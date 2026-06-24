/**
 * E2E: carga self-service de pedidos por el partner (parser IA + creación) y,
 * sobre todo, el GATE DE NO-FILTRACIÓN: las APIs cara al partner NUNCA deben
 * devolver el costo del proveedor ni el margen de Novamente.
 *
 * Requiere creds de partner (ver e2e/fixtures/partner-auth.ts) y el server local
 * (`npx next dev -p 3000`). Si faltan creds, el suite se skipea.
 */
import { test, expect } from '@playwright/test'
import { getPartnerAccessToken, hasPartnerAuthCreds } from './fixtures/partner-auth'

const SAMPLE_TEXT =
  'Hola! Quiero 2 remeras oversize negras talle L con estampa adelante y atras, y 1 hoodie blanco M. Es para Juan Perez (test e2e).'

// Strings que JAMAS deben aparecer en una respuesta cara al partner.
const FORBIDDEN_LEAK_KEYS = [
  'costo_proveedor',
  'costo_proveedor_unit',
  'costo_proveedor_total',
  'margen',
  'margen_novamente',
  'a_pagar_proveedor',
  'cost_1_print',
  'cost_2_print',
  'cost_chica',
  'supplier_cost',
  'producto_dreamful',
  // Economía interna del pago al proveedor (transferencia −3%) — nunca al partner
  'costo_proveedor_lista',
  'costo_proveedor_neto_transfer',
  'neto_transfer',
  'supplier_paid_amount',
  'supplier_paid_at',
  'transfer_discount',
]

test.describe('Partner: cargar venta + no-filtración', () => {
  test.skip(!hasPartnerAuthCreds(), 'Faltan creds de partner E2E')

  test('parse exige autenticación (401 sin token)', async ({ request }) => {
    const res = await request.post('/api/partners/orders/parse', {
      data: { text: SAMPLE_TEXT },
    })
    expect(res.status()).toBe(401)
  })

  test('parse con token devuelve items estructurados', async ({ request }) => {
    const token = await getPartnerAccessToken()
    const res = await request.post('/api/partners/orders/parse', {
      headers: { Authorization: `Bearer ${token}` },
      data: { text: SAMPLE_TEXT },
    })
    // 502 = Gemini no configurado en este entorno → inconcluso, no fallar.
    if (res.status() === 502) {
      test.info().annotations.push({ type: 'inconclusive', description: 'GEMINI_API_KEY ausente' })
      return
    }
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(Array.isArray(body.items)).toBe(true)
  })

  test('crear pedido manual (solo registro) y verificar NO-FILTRACIÓN', async ({ request }) => {
    const token = await getPartnerAccessToken()
    const auth = { Authorization: `Bearer ${token}` }

    // produce:false → no toca producción/economía interna.
    const createRes = await request.post('/api/partners/orders', {
      headers: auth,
      data: {
        customer_name: 'Cliente Test E2E',
        produce: false,
        items: [
          {
            name: 'Remera Oversize unisex',
            producto_canonical: 'Remera Oversize unisex',
            color: 'NEGRO',
            talle: 'L',
            quantity: 2,
            doble_estampa: 'Si',
            unit_price: 18000,
            partner_price: 11000,
          },
        ],
      },
    })
    expect(createRes.status()).toBe(201)
    const { order } = await createRes.json()
    expect(order?.id).toBeTruthy()
    // El pedido guarda PVP + precio partner, NUNCA costo/margen.
    const orderStr = JSON.stringify(order).toLowerCase()
    for (const k of FORBIDDEN_LEAK_KEYS) {
      expect(orderStr).not.toContain(k.toLowerCase())
    }
    expect(order.total).toBe(36000) // 2 * 18000 (PVP)

    // El listado cara al partner tampoco filtra costos.
    const listRes = await request.get('/api/partners/orders?limit=50', { headers: auth })
    expect(listRes.ok()).toBeTruthy()
    const listStr = (await listRes.text()).toLowerCase()
    for (const k of FORBIDDEN_LEAK_KEYS) {
      expect(listStr).not.toContain(k.toLowerCase())
    }

    // Cleanup: cancelar el pedido de prueba.
    await request.put(`/api/partners/orders/${order.id}`, {
      headers: auth,
      data: { status: 'cancelled' },
    }).catch(() => null)
  })
})

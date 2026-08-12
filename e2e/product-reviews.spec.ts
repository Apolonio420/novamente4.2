import { test, expect } from '@playwright/test'
import { createReviewToken } from '../lib/partners/review-token'
import { OWN_CATALOG_TENANT_SLUG, staticProductUuid } from '../lib/partners/catalog-reviews'

/**
 * Reseñas reales en la página de producto de una tienda partner.
 *
 * Cubre el camino completo del link post-entrega: ?review=1 abre el formulario,
 * ?t=<token> hace que la reseña quede como compra verificada, y la reseña entra
 * en 'pending' (no se publica sola).
 *
 * La reseña de prueba se borra en el afterAll — el test corre contra la base real.
 */

const TENANT = 'cabalaurbana'
const TENANT_ID = '1f9fd3f0-b0db-4db5-afd7-fd9becc57066'
const PRODUCT_SLUG = '3-estrellas-ba-blanca'
const PRODUCT_ID = '0a69eaee-41ef-49b7-b647-3a0114722171'
const MARKER = 'E2E-REVIEW-TEST-BORRAR'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const dbHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }

async function findTestReviews() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/product_reviews?select=id,customer_name,rating,status,verified_purchase&customer_name=eq.${encodeURIComponent(MARKER)}`,
    { headers: dbHeaders },
  )
  return (await res.json()) as any[]
}

async function deleteTestReviews() {
  await fetch(
    `${SUPABASE_URL}/rest/v1/product_reviews?customer_name=eq.${encodeURIComponent(MARKER)}`,
    { method: 'DELETE', headers: dbHeaders },
  )
}

test.beforeEach(deleteTestReviews)
test.afterAll(deleteTestReviews)

test('sin reseñas aprobadas: la sección se ve y el JSON-LD NO emite rating', async ({ page }) => {
  await page.goto(`/p/${TENANT}/${PRODUCT_SLUG}`, { timeout: 120_000 })

  await expect(page.getByRole('heading', { name: 'Opiniones' })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Todavía no hay reseñas de este producto')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Escribir reseña' })).toBeVisible()

  // La regla que protege el dominio: sin reseñas reales, nada de aggregateRating.
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents()
  const productSchema = schemas.map((s) => JSON.parse(s)).find((s: any) => s['@type'] === 'Product')
  expect(productSchema).toBeTruthy()
  expect(productSchema.aggregateRating).toBeUndefined()
  expect(productSchema.review).toBeUndefined()

  await page.screenshot({ path: 'test-results/reviews-empty.png', fullPage: false })
})

test('?review=1 abre el formulario directo, sin token no promete verificación', async ({ page }) => {
  await page.goto(`/p/${TENANT}/${PRODUCT_SLUG}?review=1`, { timeout: 120_000 })

  await expect(page.getByPlaceholder('Tu nombre *')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('button', { name: 'Publicar reseña' })).toBeVisible()
  await expect(page.getByText('Tu reseña va a figurar como compra verificada')).toHaveCount(0)
})

test('con token válido: badge de verificada + la reseña entra pending y verificada', async ({ page }) => {
  const token = createReviewToken(TENANT, PRODUCT_ID)
  await page.goto(`/p/${TENANT}/${PRODUCT_SLUG}?review=1&t=${token}`, { timeout: 120_000 })

  await expect(page.getByText('Tu reseña va a figurar como compra verificada')).toBeVisible({ timeout: 30_000 })

  await page.getByPlaceholder('Tu nombre *').fill(MARKER)
  await page.getByPlaceholder(/Contanos qué te pareció/).fill('Reseña automática de verificación E2E.')
  await page.getByLabel('4 estrellas').click()
  await page.screenshot({ path: 'test-results/reviews-form-verified.png', fullPage: false })

  await page.getByRole('button', { name: 'Publicar reseña' }).click()
  await expect(page.getByText(/Tu reseña se publica apenas la revise la marca/)).toBeVisible({ timeout: 30_000 })

  // Lo que llegó a la base es lo que importa
  const rows = await findTestReviews()
  expect(rows).toHaveLength(1)
  expect(rows[0].status).toBe('pending')
  expect(rows[0].verified_purchase).toBe(true)
  expect(rows[0].rating).toBe(4)
})

test('con una reseña aprobada: se ve en la página Y sale el aggregateRating', async ({ page }) => {
  // Insertamos directo como 'approved' — la moderación la cubre /workspace/reviews.
  const insert = await fetch(`${SUPABASE_URL}/rest/v1/product_reviews`, {
    method: 'POST',
    headers: { ...dbHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({
      tenant_id: TENANT_ID,
      product_id: PRODUCT_ID,
      customer_name: MARKER,
      rating: 5,
      body: 'Calidad impecable y llegó antes de lo que esperaba.',
      verified_purchase: true,
      status: 'approved',
    }),
  })
  expect(insert.ok).toBe(true)

  await page.goto(`/p/${TENANT}/${PRODUCT_SLUG}`, { timeout: 120_000 })

  // Visible para el comprador
  await expect(page.getByText('Calidad impecable y llegó antes de lo que esperaba.')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Compra verificada')).toBeVisible()

  // Y legible para Google: el rating tiene que corresponder a esa reseña real
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents()
  const productSchema: any = schemas.map((s) => JSON.parse(s)).find((s: any) => s['@type'] === 'Product')
  expect(productSchema.aggregateRating).toMatchObject({
    '@type': 'AggregateRating',
    ratingValue: 5,
    reviewCount: 1,
  })
  expect(productSchema.review).toHaveLength(1)
  expect(productSchema.review[0].reviewBody).toBe('Calidad impecable y llegó antes de lo que esperaba.')

  await page.screenshot({ path: 'test-results/reviews-con-resena.png', fullPage: false })
})

test('token de otro producto no otorga compra verificada', async ({ page }) => {
  const foreignToken = createReviewToken(TENANT, '00000000-0000-4000-8000-000000000000')
  await page.goto(`/p/${TENANT}/${PRODUCT_SLUG}?review=1&t=${foreignToken}`, { timeout: 120_000 })

  // Nada de prometer un badge que la API no va a dar
  await expect(page.getByPlaceholder('Tu nombre *')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Tu reseña va a figurar como compra verificada')).toHaveCount(0)

  await page.getByPlaceholder('Tu nombre *').fill(MARKER)
  await page.getByRole('button', { name: 'Publicar reseña' }).click()
  await expect(page.getByText(/Tu reseña se publica apenas la revise la marca/)).toBeVisible({ timeout: 30_000 })

  const rows = await findTestReviews()
  expect(rows).toHaveLength(1)
  expect(rows[0].verified_purchase).toBe(false)
})

// ---------------------------------------------------------------------------
// Catálogo propio de Novamente (/products/[id])
//
// Estas páginas son estáticas y usan ids que no son UUID, así que las reseñas
// cuelgan de un UUID derivado (lib/partners/catalog-reviews) bajo el tenant
// novamente-internal — el único de los candidatos con miembros que puedan moderar.
// ---------------------------------------------------------------------------

const OWN_PRODUCT_ID = 'aura-tshirt-blanco'
const OWN_PRODUCT_UUID = staticProductUuid(OWN_PRODUCT_ID)

async function ownTenantId(): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tenants?select=id&slug=eq.${OWN_CATALOG_TENANT_SLUG}`,
    { headers: dbHeaders },
  )
  const rows = (await res.json()) as any[]
  return rows[0].id
}

test('catálogo propio: la sección se ve y no emite rating sin reseñas', async ({ page }) => {
  await page.goto(`/products/${OWN_PRODUCT_ID}`, { timeout: 120_000 })

  await expect(page.getByRole('heading', { name: 'Opiniones' })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Todavía no hay reseñas de este producto')).toBeVisible()

  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents()
  const productSchema: any = schemas.map((s) => JSON.parse(s)).find((s: any) => s['@type'] === 'Product')
  expect(productSchema).toBeTruthy()
  expect(productSchema.aggregateRating).toBeUndefined()
})

test('catálogo propio: el link post-entrega deja la reseña verificada y moderable', async ({ page }) => {
  const token = createReviewToken(OWN_CATALOG_TENANT_SLUG, OWN_PRODUCT_UUID)
  await page.goto(`/products/${OWN_PRODUCT_ID}?review=1&t=${token}`, { timeout: 120_000 })

  await expect(page.getByText('Tu reseña va a figurar como compra verificada')).toBeVisible({ timeout: 30_000 })
  await page.getByPlaceholder('Tu nombre *').fill(MARKER)
  await page.getByPlaceholder(/Contanos qué te pareció/).fill('Reseña E2E del catálogo propio.')
  await page.getByRole('button', { name: 'Publicar reseña' }).click()
  await expect(page.getByText(/Tu reseña se publica apenas la revise la marca/)).toBeVisible({ timeout: 30_000 })

  const rows = await findTestReviews()
  expect(rows).toHaveLength(1)
  expect(rows[0].verified_purchase).toBe(true)
  expect(rows[0].status).toBe('pending')

  // Tiene que quedar colgada del tenant que sí se puede moderar
  const full = await fetch(
    `${SUPABASE_URL}/rest/v1/product_reviews?select=tenant_id,product_id&customer_name=eq.${encodeURIComponent(MARKER)}`,
    { headers: dbHeaders },
  ).then((r) => r.json())
  expect(full[0].tenant_id).toBe(await ownTenantId())
  expect(full[0].product_id).toBe(OWN_PRODUCT_UUID)
})

test('catálogo propio: reseña aprobada ⇒ visible + aggregateRating', async ({ page }) => {
  const insert = await fetch(`${SUPABASE_URL}/rest/v1/product_reviews`, {
    method: 'POST',
    headers: { ...dbHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({
      tenant_id: await ownTenantId(),
      product_id: OWN_PRODUCT_UUID,
      customer_name: MARKER,
      rating: 5,
      body: 'La remera quedó impecable, el algodón es muy bueno.',
      verified_purchase: true,
      status: 'approved',
    }),
  })
  expect(insert.ok).toBe(true)

  await page.goto(`/products/${OWN_PRODUCT_ID}`, { timeout: 120_000 })
  await expect(page.getByText('La remera quedó impecable, el algodón es muy bueno.')).toBeVisible({ timeout: 30_000 })

  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents()
  const productSchema: any = schemas.map((s) => JSON.parse(s)).find((s: any) => s['@type'] === 'Product')
  expect(productSchema.aggregateRating).toMatchObject({ ratingValue: 5, reviewCount: 1 })
  expect(productSchema.review[0].reviewBody).toBe('La remera quedó impecable, el algodón es muy bueno.')

  await page.screenshot({ path: 'test-results/reviews-catalogo-propio.png' })
})

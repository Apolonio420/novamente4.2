/**
 * QA E2E del checkout web (/checkout → /checkout/transfer | Mercado Pago).
 *
 * Por qué (01/10/2026): partner la-blancq reportó "la transferencia no
 * funciona" — el botón quedaba deshabilitado con datos incompletos. Ahora el
 * botón siempre responde, marca en ROJO los campos con problema y el envío de
 * /checkout/transfer es el real. Este spec recorre el flujo completo SIN
 * crear órdenes ni pagos: todas las APIs que escriben (POST /api/checkout,
 * /api/checkout/transfer, /viewed, /api/discounts/validate) y cualquier
 * dominio de Mercado Pago / pixels están INTERCEPTADOS.
 *
 * Correr contra un server local:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3117 npx playwright test e2e/checkout-qa.spec.ts
 * Tienda partner: CHECKOUT_QA_STORE (default /p/la-blancq).
 * Screenshots: e2e/out/ (gitignored).
 */
import { test, expect, type Page, type Request } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const STORE = process.env.CHECKOUT_QA_STORE ?? '/p/la-blancq'
const OUT = path.join(__dirname, 'out')
fs.mkdirSync(OUT, { recursive: true })

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
] as const

const FIELDS = ['email', 'firstName', 'lastName', 'phone', 'address', 'city', 'postalCode'] as const
const VALID: Record<(typeof FIELDS)[number], string> = {
  email: 'qa.checkout@example.com',
  firstName: 'QA',
  lastName: 'Tester',
  phone: '11 5555-0000',
  address: 'Av. Siempreviva 742',
  city: 'CABA',
  postalCode: '1414',
}
const MP_INIT_POINT = 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=QA-MOCK'

type Captured = { checkout: any[]; transfer: any[]; events: any[]; leaked: string[] }

/** Intercepta TODO lo que escribe o cobra. Devuelve los payloads capturados. */
async function mockPayments(page: Page): Promise<Captured> {
  const cap: Captured = { checkout: [], transfer: [], events: [], leaked: [] }
  // Red de seguridad: cualquier POST/PUT/PATCH/DELETE a la API que no esté
  // mockeado abajo se aborta (no queremos escribir nada en la base real).
  await page.route('**/api/**', (route) => {
    const req = route.request()
    if (req.method() === 'GET') return route.continue()
    // tracking de visitas del storefront: se responde vacío, no cuenta como fuga
    if (!/\/api\/partners\/track/.test(req.url())) cap.leaked.push(`${req.method()} ${new URL(req.url()).pathname}`)
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })
  // Pixels / analytics: que el QA no ensucie métricas reales.
  await page.route(/(facebook\.(net|com)|google-analytics|googletagmanager|doubleclick|tiktok|clarity\.ms)/, (r) => r.abort())
  // Cualquier dominio de Mercado Pago / Mercado Libre: página falsa.
  await page.route(/mercadopago|mercadolibre|mlstatic/, (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body><h1>MP MOCK</h1></body></html>' }),
  )
  await page.route('**/api/checkout', async (route) => {
    cap.checkout.push(route.request().postDataJSON())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, init_point: MP_INIT_POINT, external_reference: 'QA-MOCK-REF' }),
    })
  })
  await page.route('**/api/checkout/transfer', async (route) => {
    cap.transfer.push(route.request().postDataJSON())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, order_id: 'qa-mock-order', order_number: 'NOV-QA-0001' }),
    })
  })
  await page.route('**/api/checkout/transfer/viewed', (r) => r.fulfill({ status: 200, body: '{}' }))
  // Embudo (lib/checkout/funnel.ts): se capturan, no llegan a la base.
  await page.route('**/api/checkout/events', async (route) => {
    try { cap.events.push(route.request().postDataJSON()) } catch {}
    await route.fulfill({ status: 204, body: '' })
  })
  await page.route('**/api/discounts/validate', async (route) => {
    const body = route.request().postDataJSON() as { code: string; subtotal: number }
    if (body.code === 'QA10') {
      const discountARS = Math.round(body.subtotal * 0.1)
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true, discountARS, finalARS: body.subtotal - discountARS, codeId: 'qa', codeLabel: '10% OFF' }),
      })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'Código no válido' }) })
  })
  return cap
}

/** Carrito sembrado directo en el store persistido (zustand "cart-storage"). */
async function seedCart(page: Page, items: any[]) {
  await page.addInitScript((its) => {
    if (!sessionStorage.getItem('qa-seeded')) {
      localStorage.setItem('cart-storage', JSON.stringify({ state: { items: its }, version: 0 }))
      sessionStorage.setItem('qa-seeded', '1')
    }
  }, items)
}

const item = (over: Partial<Record<string, any>> = {}) => ({
  id: `qa-${Math.random().toString(36).slice(2)}`,
  name: 'Remera QA',
  garmentType: 'Aura T-Shirt',
  color: 'Negro',
  size: 'M',
  price: 35750,
  quantity: 1,
  image: '/placeholder.svg',
  ...over,
})

async function fillAll(page: Page, except: string[] = []) {
  for (const f of FIELDS) if (!except.includes(f)) await page.fill(`#${f}`, VALID[f])
}

async function shot(page: Page, name: string, full = true) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full })
}

async function confirmButton(page: Page) {
  return page.getByRole('button', { name: /Confirmar (y Pagar|Pedido)/ })
}

/** Campos con aria-invalid=true. */
async function invalidFields(page: Page): Promise<string[]> {
  return page.$$eval('input[aria-invalid="true"]', (els) => els.map((e) => e.id))
}

/** Precios en es-AR sin decimales ("$35.750"): el punto es separador de miles. */
function money(s: string): number {
  const m = s.match(/\$\s?([\d.]+)/)
  return m ? Number(m[1].replace(/\./g, '')) : NaN
}

const findings: Record<string, unknown> = {}
test.afterEach(() => {
  // Playwright reinicia el worker tras un fallo: se mergea con lo ya escrito.
  const file = path.join(OUT, 'findings.json')
  let prev: Record<string, unknown> = {}
  try { prev = JSON.parse(fs.readFileSync(file, 'utf8')) } catch {}
  fs.writeFileSync(file, JSON.stringify({ ...prev, ...findings }, null, 2))
})

for (const vp of VIEWPORTS) {
  test.describe(`checkout QA — ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } })
    test.setTimeout(180_000)

    test('a+b+c+d: tienda partner → carrito → campos en rojo → transferencia', async ({ page }) => {
      const cap = await mockPayments(page)
      const res = await page.goto(STORE, { waitUntil: 'domcontentloaded' })
      expect(res?.status(), `tienda ${STORE}`).toBeLessThan(400)
      await shot(page, `${vp.name}-a1-tienda`, false)

      // a) primer producto de la tienda
      const productLink = page.locator(`a[href^="${STORE}/"]`).first()
      await productLink.click()
      await page.waitForURL(new RegExp(`${STORE}/.+`))
      const addBtn = page.getByRole('button', { name: /Agregar al carrito/ })
      await expect(addBtn).toBeVisible({ timeout: 60_000 })
      await shot(page, `${vp.name}-a2-producto`, false)
      await addBtn.click()
      await page.goto('/checkout')
      await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 60_000 })

      // b) botón sin datos → todos en rojo + aviso + foco en el primero
      const dialogs: string[] = []
      page.on('dialog', (d) => {
        dialogs.push(d.message())
        d.accept()
      })
      await (await confirmButton(page)).click()
      await expect.poll(() => invalidFields(page)).toEqual([...FIELDS])
      expect(dialogs.at(-1)).toContain('completá')
      expect(await page.evaluate(() => document.activeElement?.id)).toBe('email')
      await expect(page.locator('#postalCode-error')).toHaveText('Completá el código postal')
      // Borde rojo real (computed style), no sólo el atributo.
      const border = await page.$eval('#postalCode', (el) => getComputedStyle(el).borderTopColor)
      const [r, g, b] = border.match(/\d+/g)!.map(Number)
      expect(r, `borde ${border}`).toBeGreaterThan(g + 80)
      expect(r).toBeGreaterThan(b + 80)
      await page.locator('#email').scrollIntoViewIfNeeded()
      await shot(page, `${vp.name}-b1-campos-en-rojo`, false)
      await shot(page, `${vp.name}-b1-campos-en-rojo-full`)

      // completar uno por uno → el rojo se va de ese campo y queda en el resto
      for (let i = 0; i < FIELDS.length; i++) {
        await page.fill(`#${FIELDS[i]}`, VALID[FIELDS[i]])
        await expect.poll(() => invalidFields(page)).toEqual(FIELDS.slice(i + 1))
      }
      await expect(page.locator('[id$="-error"]')).toHaveCount(0)
      await shot(page, `${vp.name}-b2-completo-sin-rojo`, false)
      findings[`${vp.name}-checkout-scrollWidth`] = await page.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth }))

      // c) email inválido → rojo sólo en email, y se limpia al corregir
      await page.fill('#email', 'juan@gmail')
      await (await confirmButton(page)).click()
      await expect.poll(() => invalidFields(page)).toEqual(['email'])
      await expect(page.locator('#email-error')).toContainText('Revisá el email')
      expect(dialogs.at(-1)).toContain('email')
      await page.locator('#email').scrollIntoViewIfNeeded()
      await shot(page, `${vp.name}-c-email-invalido`, false)
      expect(cap.transfer.length + cap.checkout.length, 'no debe llamar al backend con datos inválidos').toBe(0)
      // Embudo: vista del checkout + clicks inválidos con qué campo faltó
      await expect.poll(() => cap.events.filter((e) => e.event === 'checkout_view').length).toBe(1)
      const clicks = () => cap.events.filter((e) => e.event === 'confirm_click')
      await expect.poll(() => clicks().length).toBe(2)
      expect(clicks()[0]).toMatchObject({ valid: false, missing_fields: [...FIELDS] })
      expect(clicks()[1]).toMatchObject({ valid: false, missing_fields: ['email'] })
      expect(clicks()[0].session_id).toMatch(/^[A-Za-z0-9_-]{8,64}$/)
      await page.fill('#email', VALID.email)
      await expect.poll(() => invalidFields(page)).toEqual([])

      // d) transferencia
      const subtotalCheckout = money(await page.locator('text=Subtotal').locator('xpath=..').locator('span').nth(1).innerText())
      await page.getByText('Transferencia Bancaria').click()
      const btnText = await (await confirmButton(page)).innerText()
      await (await confirmButton(page)).click()
      await page.waitForURL('**/checkout/transfer')
      expect(cap.transfer).toHaveLength(1)
      const p = cap.transfer[0]
      expect(p.items.length).toBeGreaterThan(0)
      expect(p.items[0].tenantId, 'item de partner con tenantId').toBeTruthy()
      expect(p.customer).toMatchObject(VALID)
      expect(p.subtotal).toBe(subtotalCheckout)
      expect(p.total).toBe(p.subtotal + p.shippingCost)
      expect(p.shippingZone).toBe('BA')
      expect(p.shippingCost).toBeGreaterThan(0) // un producto < umbral de envío gratis
      expect(money(btnText)).toBe(p.total)
      await expect.poll(() => cap.events.filter((e) => e.event === 'confirm_click').at(-1)).toMatchObject({ valid: true, payment_method: 'transferencia' })
      expect(p.funnelSessionId, 'el pedido viaja con la sesión del embudo').toBe(cap.events[0].session_id)

      await expect(page.getByText('Total a Transferir')).toBeVisible()
      await expect(page.locator('div.font-mono', { hasText: /^novamente$/ })).toBeVisible()
      const envioRow = page.locator('div.flex.justify-between', { has: page.getByText('Envío', { exact: true }) }).last()
      const envioTxt = await envioRow.innerText()
      expect(envioTxt).not.toContain('Gratis')
      expect(money(envioTxt)).toBe(p.shippingCost)
      const totalTxt = await page.locator('div.flex.justify-between', { has: page.getByText('Total a Transferir') }).innerText()
      expect(money(totalTxt)).toBe(p.total)
      findings[`${vp.name}-transfer-scrollWidth`] = await page.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
      const sw = findings[`${vp.name}-transfer-scrollWidth`] as { viewport: number; scrollWidth: number }
      expect(sw.scrollWidth, 'sin scroll horizontal en /checkout/transfer').toBeLessThanOrEqual(sw.viewport)
      await shot(page, `${vp.name}-d-transferencia`)
      await shot(page, `${vp.name}-d-transferencia-viewport-bottom`, false)

      // Burbujas/elementos fijos que tapan controles (ej. "Nova" en mobile).
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(800)
      await shot(page, `${vp.name}-d-transferencia-fondo`, false)
      findings[`${vp.name}-transfer-overlaps`] = await page.evaluate(() => {
        const fixed = [...document.querySelectorAll<HTMLElement>('body *')].filter((el) => {
          const cs = getComputedStyle(el)
          const r = el.getBoundingClientRect()
          return cs.position === 'fixed' && r.width > 20 && r.height > 20 && r.width < innerWidth * 0.9 && cs.visibility !== 'hidden'
        })
        const ctrls = [...document.querySelectorAll<HTMLElement>('button, a, input, label')].filter((el) => !fixed.some((f) => f.contains(el)))
        const out: string[] = []
        for (const f of fixed) {
          const fr = f.getBoundingClientRect()
          for (const c of ctrls) {
            const cr = c.getBoundingClientRect()
            if (cr.width === 0 || cr.height === 0) continue
            const ix = Math.max(0, Math.min(fr.right, cr.right) - Math.max(fr.left, cr.left))
            const iy = Math.max(0, Math.min(fr.bottom, cr.bottom) - Math.max(fr.top, cr.top))
            if (ix * iy > 100) out.push(`[fixed ${f.tagName}.${(f.className || '').toString().slice(0, 40)} "${(f.innerText || f.getAttribute('aria-label') || '').slice(0, 20)}"] tapa ${c.tagName} "${(c.innerText || c.getAttribute('aria-label') || '').trim().slice(0, 40)}"`)
          }
        }
        return [...new Set(out)]
      })
      expect(cap.leaked, 'POSTs no mockeados').toEqual([])
    })

    test('e: Mercado Pago → payload a /api/checkout y redirección al init_point', async ({ page }) => {
      const cap = await mockPayments(page)
      await seedCart(page, [item({ tenantId: undefined })])
      await page.goto('/checkout')
      await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 60_000 })
      await fillAll(page)
      const totalShown = money(await page.locator('div.flex.justify-between.font-semibold', { hasText: 'Total' }).innerText())
      const btnText = await (await confirmButton(page)).innerText()
      findings[`${vp.name}-mp-boton-vs-total`] = { boton: btnText, totalMostrado: totalShown }
      // El botón tiene que decir lo que va a cobrar MP (con recargo de tarjeta).
      expect(money(btnText)).toBe(totalShown)
      await (await confirmButton(page)).click()
      await page.waitForURL(/mercadopago/, { timeout: 30_000 })
      await expect(page.getByText('MP MOCK')).toBeVisible()
      expect(cap.checkout).toHaveLength(1)
      const p = cap.checkout[0]
      expect(p.customer).toMatchObject(VALID)
      expect(p.subtotal).toBe(35750)
      expect(p.shippingCost).toBeGreaterThan(0)
      expect(p.total).toBe(p.subtotal + p.shippingCost)
      expect(p.items.find((i: any) => i.id === 'shipping')?.unit_price).toBe(p.shippingCost)
      expect(p.cartItems).toHaveLength(1)
      expect(p).toHaveProperty('tenantId')
      expect(cap.leaked).toEqual([])
    })

    test('f: envío bonificado (subtotal ≥ umbral) → Gratis y el total no lo suma', async ({ page }) => {
      const cap = await mockPayments(page)
      await seedCart(page, [item({ price: 80000, quantity: 2 })]) // 160.000 ≥ 150.000
      await page.goto('/checkout')
      await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 60_000 })
      await expect(page.getByText('¡Gratis!')).toBeVisible()
      await expect(page.getByText(/para envío gratuito/)).toHaveCount(0)
      await fillAll(page)
      await page.getByText('Transferencia Bancaria').click()
      await (await confirmButton(page)).click()
      await page.waitForURL('**/checkout/transfer')
      const p = cap.transfer[0]
      expect(p.shippingCost).toBe(0)
      expect(p.total).toBe(160000)
      const envioRow = page.locator('div.flex.justify-between', { has: page.getByText('Envío', { exact: true }) }).last()
      await expect(envioRow).toContainText('Gratis')
      await shot(page, `${vp.name}-f-envio-gratis-transfer`)
    })

    test('g: cupón → descuento en checkout, payload y pantalla de transferencia', async ({ page }) => {
      const cap = await mockPayments(page)
      await seedCart(page, [item()])
      await page.goto('/checkout')
      await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 60_000 })
      const code = page.getByPlaceholder('Tu código')
      await code.fill('NOEXISTE')
      await page.getByRole('button', { name: 'Aplicar' }).click()
      await expect(page.getByText('Código no válido')).toBeVisible()
      await code.fill('QA10')
      await page.getByRole('button', { name: 'Aplicar' }).click()
      await expect(page.getByText('Descuento (QA10)')).toBeVisible()
      await shot(page, `${vp.name}-g-cupon-checkout`, false)
      await fillAll(page)
      await page.getByText('Transferencia Bancaria').click()
      await (await confirmButton(page)).click()
      await page.waitForURL('**/checkout/transfer')
      const p = cap.transfer[0]
      expect(p.discountCode).toBe('QA10')
      const desc = Math.round(35750 * 0.1)
      expect(p.total).toBe(p.subtotal + p.shippingCost - desc)
      // pantalla de transferencia: subtotal + envío − descuento = total
      await expect(page.getByText('Descuento', { exact: true })).toBeVisible()
      const totalTxt = await page.locator('div.flex.justify-between', { has: page.getByText('Total a Transferir') }).innerText()
      expect(money(totalTxt)).toBe(p.total)
      await shot(page, `${vp.name}-g-cupon-transfer`)
    })

    test('h: carrito con varios productos, talles y colores', async ({ page }) => {
      const cap = await mockPayments(page)
      await page.goto(STORE, { waitUntil: 'domcontentloaded' })
      const links = await page.locator(`a[href^="${STORE}/"]`).evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href')))])
      // hasta 2 productos distintos, 2 talles en el primero, y otro color si hay
      for (const [i, href] of links.slice(0, 2).entries()) {
        await page.goto(href!)
        const addBtn = page.getByRole('button', { name: /Agregar al carrito/ })
        await expect(addBtn).toBeVisible({ timeout: 60_000 })
        const sizes = page.locator('button[aria-pressed]:not([aria-label^="Color"])')
        const colors = page.locator('button[aria-label^="Color"]')
        if ((await sizes.count()) > 1) await sizes.nth(0).click()
        await addBtn.click()
        await page.waitForTimeout(400)
        if (i === 0) {
          if ((await sizes.count()) > 2) await sizes.nth(2).click()
          if ((await colors.count()) > 1) await colors.nth(1).click()
          await addBtn.click()
          await page.waitForTimeout(400)
        }
      }
      await page.goto('/checkout')
      await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 60_000 })
      await shot(page, `${vp.name}-h-varios-items`)
      await fillAll(page)
      await page.getByText('Transferencia Bancaria').click()
      await (await confirmButton(page)).click()
      await page.waitForURL('**/checkout/transfer')
      const p = cap.transfer[0]
      findings[`${vp.name}-h-items`] = p.items.map((i: any) => `${i.name} | ${i.color} | ${i.size} | x${i.quantity} | ${i.price} | tenant ${i.tenantId}`)
      expect(p.items.length).toBeGreaterThanOrEqual(2)
      const sum = p.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0)
      expect(p.subtotal).toBe(sum)
      expect(p.total).toBe(p.subtotal + p.shippingCost)
      await shot(page, `${vp.name}-h-varios-transfer`)
    })

    test('j: transferencia creada → carrito vacío, volver atrás no duplica el pedido', async ({ page }) => {
      const cap = await mockPayments(page)
      await seedCart(page, [item()])
      await page.goto('/checkout')
      await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 60_000 })
      await fillAll(page)
      await page.getByText('Transferencia Bancaria').click()
      await (await confirmButton(page)).click()
      await page.waitForURL('**/checkout/transfer')
      expect(cap.transfer).toHaveLength(1)
      // el pedido sigue visible en /checkout/transfer (sale de transferData, no del carrito)
      await expect(page.getByText('Total a Transferir')).toBeVisible()
      const cartItems = await page.evaluate(() => JSON.parse(localStorage.getItem('cart-storage') || '{}')?.state?.items ?? null)
      expect(cartItems, 'carrito vaciado al crear el pedido').toEqual([])
      // volver atrás → /checkout sin productos y sin botón de confirmar
      await page.goBack()
      await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible({ timeout: 30_000 })
      await expect(page.getByRole('button', { name: /Confirmar (y Pagar|Pedido)/ })).toHaveCount(0)
      expect(cap.transfer).toHaveLength(1)
      await shot(page, `${vp.name}-j-carrito-vacio-tras-pedido`, false)
    })

    test('k: la zona de envío sale del CP (cobro, botón, fecha y payload coherentes)', async ({ page }) => {
      const cap = await mockPayments(page)
      await seedCart(page, [item()])
      await page.goto('/checkout')
      await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 60_000 })
      const ba = page.getByRole('button', { name: /Buenos Aires/ })
      const resto = page.getByRole('button', { name: /Resto del país/ })
      const fecha = () => page.getByText(/te llega entre el/).innerText()
      const envioResumen = async () =>
        money(await page.locator('div.flex.justify-between', { has: page.getByText('Envío', { exact: true }) }).last().innerText())
      // sin CP: manda el botón y el envío del resumen se marca como estimado
      await expect(page.getByTestId('envio-estimado')).toBeVisible()
      const fechaBA = await fecha()
      await resto.click()
      await expect(resto).toHaveAttribute('aria-pressed', 'true')
      const fechaResto = await fecha()
      expect(fechaResto).not.toBe(fechaBA)
      // CP de AMBA con "Resto del país" elegido → manda el CP
      await fillAll(page)
      await expect(ba).toHaveAttribute('aria-pressed', 'true')
      await expect(resto).toHaveAttribute('aria-pressed', 'false')
      await expect(resto).toBeDisabled()
      await expect(page.getByTestId('zona-por-cp')).toBeVisible()
      await expect(page.getByTestId('envio-estimado')).toHaveCount(0)
      expect(await fecha()).toBe(fechaBA)
      const envioAmba = await envioResumen()
      expect(money(await ba.innerText())).toBe(envioAmba)
      await page.getByTestId('zona-por-cp').scrollIntoViewIfNeeded()
      await shot(page, `${vp.name}-k-zona-por-cp`, false)
      // CP del interior (Córdoba 5000) → Resto, cobro y fecha del interior
      await page.fill('#postalCode', '5000')
      await expect(resto).toHaveAttribute('aria-pressed', 'true')
      expect(await fecha()).toBe(fechaResto)
      const envioInterior = await envioResumen()
      expect(envioInterior).toBeGreaterThan(envioAmba)
      expect(money(await resto.innerText())).toBe(envioInterior)
      await page.getByText('Transferencia Bancaria').click()
      await (await confirmButton(page)).click()
      await page.waitForURL('**/checkout/transfer')
      expect(cap.transfer[0].shippingZone).toBe('RESTO')
      expect(cap.transfer[0].shippingCost).toBe(envioInterior)
    })

    test('l: precios en es-AR sin decimales y sin burbuja de Nova en checkout', async ({ page }) => {
      await mockPayments(page)
      await seedCart(page, [item()])
      await page.goto('/checkout')
      await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 60_000 })
      const body = await page.locator('main').innerText()
      expect(body).toContain('$35.750')
      expect(body).not.toMatch(/\$\d{1,3}(,\d{3})+\.\d{2}/) // nada de "$35,750.00"
      expect(body).not.toMatch(/Confirmacion|Produccion|Envio a todo|Seras|Veras/)
      await page.waitForTimeout(2500) // Nova aparece con delay en el resto del sitio
      await expect(page.locator('.nova-fab')).toHaveCount(0)
      await expect(page.locator('.whatsapp-float-btn')).toHaveCount(1)
    })

    test('m: /products/[id] tiene compra directa con talle obligatorio', async ({ page }) => {
      const cap = await mockPayments(page)
      await page.goto('/products/aura-tshirt-blanco')
      const box = page.getByTestId('product-buy-box')
      await expect(box).toBeVisible({ timeout: 60_000 })
      await shot(page, `${vp.name}-m-pdp-compra`, false)
      // sin talle → aviso en rojo y no agrega
      await box.getByRole('button', { name: 'Comprar ahora' }).click()
      await expect(page.locator('#talle-error')).toHaveText('Elegí un talle')
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cart-storage') || '{}')?.state?.items?.length ?? 0)).toBe(0)
      await shot(page, `${vp.name}-m-pdp-sin-talle`, false)
      // talle L → Agregar al carrito → queda en el carrito
      await box.getByRole('button', { name: 'L', exact: true }).click()
      await box.getByRole('button', { name: /Agregar al carrito/ }).click()
      await expect(box.getByRole('button', { name: /Agregado/ })).toBeVisible()
      // Comprar ahora → checkout con los dos
      await box.getByRole('button', { name: 'Comprar ahora' }).click()
      await page.waitForURL('**/checkout')
      await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 60_000 })
      await fillAll(page)
      await (await confirmButton(page)).click()
      await page.waitForURL(/mercadopago/, { timeout: 30_000 })
      const p = cap.checkout[0]
      expect(p.cartItems).toHaveLength(2)
      for (const it of p.cartItems) {
        expect(it.size).toBe('L')
        expect(it.color, 'color de la prenda').toBeTruthy()
        expect(it.tenantId).toBeUndefined()
      }
      expect(p.tenantId).toBeNull()
      findings[`${vp.name}-m-items`] = p.cartItems.map((i: any) => `${i.name} | ${i.color} | ${i.size} | ${i.price}`)
    })

    test('i: web propia (no partner) → /products quick-add → checkout', async ({ page }) => {
      const cap = await mockPayments(page)
      // La ficha /products/[id] ahora tiene compra directa (test m); este caso
      // cubre el quick-add del listado /products.
      await page.goto('/products/aura-tshirt-blanco')
      findings[`${vp.name}-i-pdp-tiene-boton-compra`] = (await page.getByRole('button', { name: /Agregar|Comprar/i }).count()) > 0
      await page.goto('/products')
      const quick = page.locator('article').filter({ has: page.locator('a[href="/products/aura-tshirt-blanco"]') }).getByRole('button').last()
      await quick.click() // elige talle
      await quick.click() // agrega
      await page.waitForTimeout(500)
      await page.goto('/checkout')
      await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 60_000 })
      await fillAll(page)
      await (await confirmButton(page)).click()
      await page.waitForURL(/mercadopago/, { timeout: 30_000 })
      const p = cap.checkout[0]
      expect(p.tenantId).toBeNull()
      expect(p.cartItems[0].tenantId).toBeUndefined()
      expect(p.total).toBe(p.subtotal + p.shippingCost)
      findings[`${vp.name}-i-item`] = p.cartItems.map((i: any) => `${i.name} | ${i.color} | ${i.size} | ${i.price}`)
    })
  })
}

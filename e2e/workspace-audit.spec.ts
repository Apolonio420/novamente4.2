/**
 * Auditoría general del WORKSPACE de partner (/workspace/**) — spec de
 * regresión reutilizable. Login real por UI contra /partners/login con las
 * credenciales E2E (ver e2e/fixtures/partner-auth.ts), luego recorre cada
 * página del workspace en desktop (1280x800) y mobile (390x844):
 *   - console errors / pageerror / requests con status >= 400
 *   - textos de error visibles ("undefined", "NaN", "[object Object]", etc.)
 *   - spinners que no desaparecen en 10s
 *   - overflow horizontal en mobile
 *   - screenshot full-page en e2e/screenshots/workspace-audit/
 *   - click de tabs/sub-tabs y de botones "Nuevo/Agregar/Editar" (abre modal,
 *     screenshot, cierra con Escape) SIN enviar ningún formulario
 *   - recolección de <a href> internos para verificar que resuelven (sin 404)
 *
 * También hace un sweep de API (GET autenticado y sin auth) y ejercita el
 * flujo core (catálogo → nuevo producto, pedidos → cargar pedido, finanzas,
 * settings) de forma NO destructiva (sin publicar/guardar).
 *
 * Correr SOLO este archivo (no toda la suite e2e, algunos specs generan
 * contenido real):
 *   npx playwright test e2e/workspace-audit.spec.ts --list
 *   PLAYWRIGHT_BASE_URL=http://localhost:3100 npx playwright test e2e/workspace-audit.spec.ts --reporter=list
 */
import { test, expect, type Page, type Request as PWRequest } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import {
  E2E_PARTNER_EMAIL,
  E2E_PARTNER_PASSWORD,
  hasPartnerAuthCreds,
  getPartnerAccessToken,
} from './fixtures/partner-auth'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100'
const AUTH_DIR = path.join(__dirname, '.auth')
const AUTH_FILE = path.join(AUTH_DIR, 'partner.json')
const SHOT_DIR = path.join(__dirname, 'screenshots', 'workspace-audit')

fs.mkdirSync(AUTH_DIR, { recursive: true })
fs.mkdirSync(SHOT_DIR, { recursive: true })

test.skip(!hasPartnerAuthCreds(), 'Faltan E2E_PARTNER_EMAIL/PASSWORD o Supabase env — ver e2e/fixtures/partner-auth.ts')

// ---------------------------------------------------------------------------
// Páginas del workspace (desde app/workspace/layout.tsx navSections + rutas
// adicionales sin nav propio)
// ---------------------------------------------------------------------------
const PAGES: { path: string; name: string }[] = [
  { path: '/workspace', name: 'home' },
  { path: '/workspace/analytics', name: 'analytics' },
  { path: '/workspace/billing', name: 'billing' },
  { path: '/workspace/branding', name: 'branding' },
  { path: '/workspace/catalog', name: 'catalog' },
  { path: '/workspace/chatbot', name: 'chatbot' },
  { path: '/workspace/design-engine', name: 'design-engine' },
  { path: '/workspace/design-library', name: 'design-library' },
  { path: '/workspace/discounts', name: 'discounts' },
  { path: '/workspace/feeds', name: 'feeds' },
  { path: '/workspace/finanzas', name: 'finanzas' },
  { path: '/workspace/integrations/tiktok', name: 'tiktok' },
  { path: '/workspace/integrations/tiktok/post', name: 'tiktok-post' },
  { path: '/workspace/leads', name: 'leads' },
  { path: '/workspace/meta-ads', name: 'meta-ads' },
  { path: '/workspace/meta-business', name: 'meta-business' },
  { path: '/workspace/onboarding-call', name: 'onboarding-call' },
  { path: '/workspace/orders', name: 'orders' },
  { path: '/workspace/reviews', name: 'reviews' },
  { path: '/workspace/settings', name: 'settings' },
  { path: '/workspace/support', name: 'support' },
]

const VIEWPORTS: Record<string, { width: number; height: number }> = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
}

// Textos que casi siempre delatan un bug de render visible al partner.
const ERROR_TEXT_PATTERNS: RegExp[] = [
  /\bundefined\b/,
  /\bNaN\b/,
  /\$NaN/,
  /\[object Object\]/,
  /Invalid Date/,
  /algo (salió|salio) mal/i,
  /error inesperado/i,
  /error interno/i,
  /unhandled/i,
]

const DANGEROUS_BUTTON_WORDS = /eliminar|borrar|cancelar suscrip|publicar|confirmar pago|enviar|pagar|conectar con meta|conectar con tiktok|desconectar|suscrib/i
const MODAL_TRIGGER_WORDS = /^(\+\s*)?(nuevo|nueva|agregar|crear|editar|cargar pedido|cargar orden|cargar venta)\b/i

// Recolectado a través de todo el run, para el chequeo final de links.
const collectedLinks = new Set<string>()

type Finding = { severity: '🔴' | '🟠' | '🟡'; page: string; detail: string; evidence?: string }
const findings: Finding[] = []

function record(sev: Finding['severity'], page: string, detail: string, evidence?: string) {
  findings.push({ severity: sev, page, detail, evidence })
  // eslint-disable-next-line no-console
  console.log(`${sev} [${page}] ${detail}${evidence ? ' :: ' + evidence : ''}`)
}

// ---------------------------------------------------------------------------
// Setup: login real por UI, guardar storageState para el resto de los tests
// ---------------------------------------------------------------------------
test.describe.serial('setup', () => {
  test('login partner y guardar sesión', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto(`${BASE}/partners/login`, { waitUntil: 'domcontentloaded' })
    // NOTA (finding real, no sólo del test): si se interactúa con el form
    // antes de que React hidrate, el input de email queda vacío y Supabase
    // responde 400 "missing email or phone" sin feedback claro en la UI.
    // Ver app/partners/login/page.tsx — esperamos a que hidrate.
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(1500)
    await page.locator('input[type="email"], input[name="email"]').first().fill(E2E_PARTNER_EMAIL)
    await page.locator('input[type="password"]').first().fill(E2E_PARTNER_PASSWORD)
    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL(/\/workspace/, { timeout: 20_000 })
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    await page.context().storageState({ path: AUTH_FILE })
    expect(page.url()).toContain('/workspace')
  })
})

// ---------------------------------------------------------------------------
// Helper: instrumenta una página (console, pageerror, network >=400) y corre
// los chequeos genéricos de una visita.
// ---------------------------------------------------------------------------
async function instrumentAndVisit(
  page: Page,
  pagePath: string,
  pageName: string,
  viewportName: string,
) {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  const badResponses: string[] = []
  const hydrationWarnings: string[] = []

  page.on('console', (msg) => {
    const text = msg.text()
    if (msg.type() === 'error') {
      consoleErrors.push(text)
    }
    if (/hydrat/i.test(text)) hydrationWarnings.push(text)
  })
  page.on('pageerror', (err) => pageErrors.push(err.message))
  page.on('response', (res) => {
    const status = res.status()
    if (status >= 400) {
      badResponses.push(`${status} ${res.request().method()} ${res.url()}`)
    }
  })

  const resp = await page.goto(`${BASE}${pagePath}`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch((e) => {
    record('🔴', pageName, `goto() lanzó excepción: ${e.message}`)
    return null
  })

  if (resp && resp.status() >= 400) {
    record('🔴', pageName, `Respuesta HTTP ${resp.status()} al navegar`, `${pagePath}`)
  }

  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
  await page.waitForTimeout(800)

  // Redirigido a login inesperadamente (sesión perdida / guard roto)
  if (/\/partners\/login/.test(page.url())) {
    record('🔴', pageName, 'Redirigido a /partners/login — sesión no reconocida o guard roto', page.url())
  }

  // Spinners/skeletons que no resuelven en 10s
  const spinnerSelector = '.animate-spin, [role="status"], [data-loading="true"], [aria-busy="true"]'
  const stillSpinning = await page.locator(spinnerSelector).count()
  if (stillSpinning > 0) {
    await page.waitForTimeout(9_200)
    const persisted = await page.locator(spinnerSelector).count()
    if (persisted > 0) {
      record('🟠', pageName, `Spinner/skeleton sigue visible después de ~10s (${persisted} elementos)`, spinnerSelector)
    }
  }

  // Textos de error visibles
  const bodyText = await page.locator('body').innerText().catch(() => '')
  for (const re of ERROR_TEXT_PATTERNS) {
    const m = bodyText.match(re)
    if (m) {
      record('🟠', pageName, `Texto de error visible: "${m[0]}"`, `viewport=${viewportName}`)
    }
  }

  // Página vacía (sospechoso de fetch roto silencioso)
  const visibleTextLen = bodyText.trim().length
  if (visibleTextLen < 40) {
    record('🟠', pageName, `Página casi vacía (${visibleTextLen} chars de texto visible)`, `viewport=${viewportName}`)
  }

  // Overflow horizontal en mobile
  if (viewportName === 'mobile') {
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    if (overflow.scrollWidth > overflow.clientWidth + 2) {
      record('🟡', pageName, `Overflow horizontal en mobile (scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth})`)
    }
  }

  // Recolectar links internos
  const hrefs = await page.locator('a[href]').evaluateAll((els) =>
    els.map((e) => (e as HTMLAnchorElement).getAttribute('href')).filter(Boolean) as string[],
  )
  for (const href of hrefs) {
    if (!href) continue
    if (href.startsWith('http') && !href.includes('localhost') && !href.includes('novamente')) continue // externo, no auditamos
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) continue
    collectedLinks.add(href)
  }

  // Screenshot full page
  const shotPath = path.join(SHOT_DIR, `${pageName}-${viewportName}.png`)
  await page.screenshot({ path: shotPath, fullPage: true }).catch((e) => {
    record('🟡', pageName, `No se pudo tomar screenshot: ${e.message}`)
  })

  // Reportar consola/network al final de la visita
  for (const e of consoleErrors) record('🟠', pageName, 'console.error', `viewport=${viewportName} :: ${e.slice(0, 300)}`)
  for (const e of pageErrors) record('🔴', pageName, 'pageerror (excepción no capturada)', `viewport=${viewportName} :: ${e.slice(0, 300)}`)
  for (const e of badResponses) record('🟠', pageName, 'response >= 400', `viewport=${viewportName} :: ${e.slice(0, 300)}`)
  for (const e of hydrationWarnings) record('🟡', pageName, 'hydration warning', `viewport=${viewportName} :: ${e.slice(0, 300)}`)

  return { shotPath }
}

// Click genérico de tabs (role=tab) sin salir de la página
async function clickTabs(page: Page, pageName: string, viewportName: string) {
  const tabs = page.locator('[role="tab"]')
  const count = await tabs.count()
  for (let i = 0; i < Math.min(count, 8); i++) {
    try {
      await tabs.nth(i).click({ timeout: 3000 })
      await page.waitForTimeout(400)
      const bodyText = await page.locator('body').innerText().catch(() => '')
      for (const re of ERROR_TEXT_PATTERNS) {
        const m = bodyText.match(re)
        if (m) record('🟠', pageName, `Tab #${i}: texto de error visible "${m[0]}"`, `viewport=${viewportName}`)
      }
    } catch {
      /* tab no clickeable, seguir */
    }
  }
}

// Click genérico de botones "Nuevo/Agregar/Editar/..." que abren modal; se
// verifica que el modal renderiza y se cierra SIN enviar nada.
async function openAndCloseModals(page: Page, pageName: string, viewportName: string) {
  const buttons = page.locator('button, a[role="button"]')
  const count = await buttons.count()
  let opened = 0
  for (let i = 0; i < count && opened < 4; i++) {
    const btn = buttons.nth(i)
    const text = (await btn.innerText().catch(() => '')).trim()
    if (!text || !MODAL_TRIGGER_WORDS.test(text)) continue
    if (DANGEROUS_BUTTON_WORDS.test(text)) continue
    const disabled = await btn.isDisabled().catch(() => true)
    if (disabled) continue
    try {
      await btn.click({ timeout: 3000 })
      await page.waitForTimeout(600)
      const dialog = page.locator('[role="dialog"], .fixed.inset-0, [data-state="open"]')
      const dialogCount = await dialog.count()
      if (dialogCount === 0) {
        // puede ser navegación a otra ruta en vez de modal; no es necesariamente bug
      } else {
        const shotPath = path.join(SHOT_DIR, `${pageName}-${viewportName}-modal-${opened}.png`)
        await page.screenshot({ path: shotPath }).catch(() => {})
        const bodyText = await page.locator('body').innerText().catch(() => '')
        for (const re of ERROR_TEXT_PATTERNS) {
          const m = bodyText.match(re)
          if (m) record('🟠', pageName, `Modal "${text}": texto de error visible "${m[0]}"`, `viewport=${viewportName}`)
        }
      }
      await page.keyboard.press('Escape').catch(() => {})
      await page.waitForTimeout(300)
      opened++
    } catch {
      /* botón no clickeable (overlay, etc), seguir */
    }
  }
}

// ---------------------------------------------------------------------------
// Audit por página x viewport
// ---------------------------------------------------------------------------
for (const { path: pagePath, name: pageName } of PAGES) {
  for (const viewportName of Object.keys(VIEWPORTS)) {
    test(`audit ${pageName} [${viewportName}]`, async ({ browser }) => {
      // design-engine (Studio) es la página más pesada del workspace (2100+
      // líneas, picker de prendas con muchos elementos interactivos): el
      // barrido genérico de tabs/botones puede superar el timeout default.
      if (pageName === 'design-engine') test.slow()
      const context = await browser.newContext({
        storageState: AUTH_FILE,
        viewport: VIEWPORTS[viewportName],
      })
      const page = await context.newPage()
      try {
        await instrumentAndVisit(page, pagePath, pageName, viewportName)
        await clickTabs(page, pageName, viewportName)
        await openAndCloseModals(page, pageName, viewportName)
      } finally {
        await context.close()
      }
    })
  }
}

// ---------------------------------------------------------------------------
// Chequeo final: todos los <a href> internos recolectados deben resolver
// ---------------------------------------------------------------------------
test('todos los links internos recolectados resuelven (no 404)', async ({ browser }) => {
  // En dev (compilación on-demand) ~100 links superan el timeout default de 30s.
  test.setTimeout(240_000)
  const context = await browser.newContext({ storageState: AUTH_FILE })
  const page = await context.newPage()
  const checked = new Set<string>()
  for (const href of collectedLinks) {
    let url: string
    try {
      url = href.startsWith('http') ? href : new URL(href, BASE).toString()
    } catch {
      continue
    }
    if (checked.has(url)) continue
    checked.add(url)
    // Saltar rutas de acciones (logout, oauth, mailto ya filtrado) y archivos binarios pesados
    if (/\/api\/auth\/|signout|logout/i.test(url)) continue
    try {
      const res = await page.request.get(url, { timeout: 10_000, maxRedirects: 5 })
      if (res.status() >= 400) {
        record('🟠', 'link-check', `Link interno rompe: ${href} → ${res.status()}`)
      }
    } catch (e: any) {
      record('🟡', 'link-check', `No se pudo verificar link ${href}: ${e.message}`)
    }
  }
  await context.close()
})

// ---------------------------------------------------------------------------
// API sweep: GET con auth (Bearer) y sin auth, sobre cada route.ts que
// exporta GET en app/api/partners/**
// ---------------------------------------------------------------------------
test.describe('API sweep /api/partners', () => {
  const SIMPLE_GET_ENDPOINTS = [
    '/api/partners/analytics',
    '/api/partners/billing',
    '/api/partners/branding',
    '/api/partners/campaigns',
    '/api/partners/catalog',
    '/api/partners/credits',
    '/api/partners/dashboard',
    '/api/partners/dashboard/attention',
    '/api/partners/dashboard/kpis',
    '/api/partners/discounts',
    '/api/partners/finanzas',
    '/api/partners/me',
    '/api/partners/meta-business',
    '/api/partners/onboarding-call',
    '/api/partners/onboarding-call/ics',
    '/api/partners/orders',
    '/api/partners/promo-status',
    '/api/partners/reviews',
    '/api/partners/settings',
    '/api/partners/support',
    '/api/partners/team',
    '/api/partners/tenants',
    '/api/partners/agent/sessions',
    '/api/partners/design/assets',
    '/api/partners/design/config',
    '/api/partners/design/library',
    '/api/partners/design/sessions',
    '/api/partners/design/usage',
    '/api/partners/leads/list',
    '/api/partners/products/garment-options',
    '/api/partners/integrations/tiktok/status',
    '/api/partners/integrations/tiktok/posts',
  ]

  test('endpoints simples: con Bearer token responden 2xx (o error claro, nunca 500 silencioso)', async ({ request }) => {
    test.setTimeout(120_000) // ~32 endpoints secuenciales contra Supabase real
    const token = await getPartnerAccessToken()
    for (const ep of SIMPLE_GET_ENDPOINTS) {
      const res = await request.get(`${BASE}${ep}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch((e) => {
        record('🔴', 'api', `${ep}: excepción de red: ${e.message}`)
        return null
      })
      if (!res) continue
      const status = res.status()
      if (status >= 500) {
        const body = await res.text().catch(() => '')
        record('🔴', 'api', `${ep} → ${status}`, body.slice(0, 300))
      } else if (status >= 400) {
        const body = await res.text().catch(() => '')
        record('🟡', 'api', `${ep} → ${status} (revisar si es esperado)`, body.slice(0, 200))
      }
    }
  })

  test('endpoints simples: SIN auth devuelven 401/403, nunca 200 con datos ni 500', async ({ request }) => {
    for (const ep of SIMPLE_GET_ENDPOINTS) {
      const res = await request.get(`${BASE}${ep}`).catch((e) => {
        record('🔴', 'api-noauth', `${ep}: excepción de red: ${e.message}`)
        return null
      })
      if (!res) continue
      const status = res.status()
      if (status === 200) {
        record('🔴', 'api-noauth', `${ep} devuelve 200 SIN autenticación — posible fuga de datos`, `status=${status}`)
      } else if (status >= 500) {
        record('🟠', 'api-noauth', `${ep} → ${status} sin auth (debería ser 401/403 prolijo)`)
      } else if (status !== 401 && status !== 403) {
        record('🟡', 'api-noauth', `${ep} → ${status} sin auth (ni 401 ni 403, revisar)`)
      }
    }
  })

  test('endpoints con parámetros (ids reales): sweep best-effort', async ({ request }) => {
    const token = await getPartnerAccessToken()
    const authHeaders = { Authorization: `Bearer ${token}` }

    async function getJson(ep: string) {
      const res = await request.get(`${BASE}${ep}`, { headers: authHeaders }).catch(() => null)
      if (!res || res.status() >= 400) return null
      return res.json().catch(() => null)
    }

    // Resolver ids reales desde los list endpoints
    const [catalog, orders, leadsList, tenants, me] = await Promise.all([
      getJson('/api/partners/catalog'),
      getJson('/api/partners/orders'),
      getJson('/api/partners/leads/list'),
      getJson('/api/partners/tenants'),
      getJson('/api/partners/me'),
    ])

    const productId = catalog?.products?.[0]?.id ?? catalog?.[0]?.id
    const orderId = orders?.orders?.[0]?.id ?? orders?.[0]?.id
    const leadId = leadsList?.leads?.[0]?.id ?? leadsList?.[0]?.id
    const tenantSlug = me?.tenant?.slug

    const paramEndpoints: { ep: string; needs: unknown }[] = [
      { ep: productId ? `/api/partners/catalog/${productId}` : '', needs: productId },
      { ep: productId ? `/api/partners/catalog/${productId}/variants` : '', needs: productId },
      { ep: orderId ? `/api/partners/orders/${orderId}` : '', needs: orderId },
      { ep: leadId ? `/api/partners/leads/${leadId}` : '', needs: leadId },
      { ep: tenantSlug ? `/api/partners/storefront/${tenantSlug}` : '', needs: tenantSlug },
      { ep: tenantSlug ? `/api/partners/feed/google/${tenantSlug}` : '', needs: tenantSlug },
      { ep: tenantSlug ? `/api/partners/feed/meta/${tenantSlug}` : '', needs: tenantSlug },
      { ep: tenantSlug ? `/api/partners/feed/validate/${tenantSlug}` : '', needs: tenantSlug },
    ]

    for (const { ep, needs } of paramEndpoints) {
      if (!needs || !ep) {
        record('🟡', 'api-params', `No se pudo resolver id real para probar ${ep || '(endpoint)'} — sin datos de muestra en el tenant`)
        continue
      }
      const res = await request.get(`${BASE}${ep}`, { headers: authHeaders }).catch((e) => {
        record('🔴', 'api-params', `${ep}: excepción de red: ${e.message}`)
        return null
      })
      if (!res) continue
      const status = res.status()
      if (status >= 500) {
        const body = await res.text().catch(() => '')
        record('🔴', 'api-params', `${ep} → ${status}`, body.slice(0, 300))
      } else if (status >= 400) {
        const body = await res.text().catch(() => '')
        record('🟡', 'api-params', `${ep} → ${status}`, body.slice(0, 200))
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Resumen final: imprime todos los findings ordenados por severidad para que
// quede en el log de la corrida (además de lo que cada test ya logueó).
// ---------------------------------------------------------------------------
test.afterAll(async () => {
  const order = { '🔴': 0, '🟠': 1, '🟡': 2 }
  const sorted = [...findings].sort((a, b) => order[a.severity] - order[b.severity])
  // eslint-disable-next-line no-console
  console.log('\n\n===== WORKSPACE AUDIT — RESUMEN (%d findings) =====', sorted.length)
  for (const f of sorted) {
    // eslint-disable-next-line no-console
    console.log(`${f.severity} [${f.page}] ${f.detail}${f.evidence ? ' :: ' + f.evidence : ''}`)
  }
})

/**
 * Helpers compartidos por los specs de grabación de video tutorial
 * (e2e/record-studio-video.spec.ts, e2e/record-catalog-video.spec.ts).
 *
 * - Cursor falso + ripple de click, para que el video se vea "guiado" (portado
 *   de los antiguos scripts/record-*-video.mjs, ahora sin credenciales
 *   hardcodeadas).
 * - Plantado de sesión de partner via Supabase password grant (mismo patrón
 *   que e2e/partner-load-order-ui.spec.ts) para arrancar la grabación ya
 *   adentro de /workspace, sin tipear ningún email en pantalla.
 * - Aserción anti-leak: ningún checkpoint del video puede mostrar texto de
 *   precio retail / badges internos / emails @novamente.ar.
 */
import type { Page, APIRequestContext, Locator } from '@playwright/test'
import { E2E_PARTNER_EMAIL, E2E_PARTNER_PASSWORD } from './partner-auth'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ── Sesión plantada (sin login en pantalla) ─────────────────────────────────

async function passwordGrant(): Promise<{ access_token: string; refresh_token: string; expires_in: number; user: unknown }> {
  const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON, 'content-type': 'application/json' },
    body: JSON.stringify({ email: E2E_PARTNER_EMAIL, password: E2E_PARTNER_PASSWORD }),
  })
  if (!res.ok) throw new Error(`password grant failed ${res.status}: ${await res.text().catch(() => '')}`)
  return res.json()
}

async function plantSessionOnce(page: Page, request: APIRequestContext, path: string): Promise<void> {
  const sess = await passwordGrant()
  const ref = new URL(SUPABASE_URL).hostname.split('.')[0]
  const storageKey = `sb-${ref}-auth-token`
  const expires_at = Math.floor(Date.now() / 1000) + (sess.expires_in ?? 3600)
  const sessionObj = {
    access_token: sess.access_token,
    refresh_token: sess.refresh_token,
    expires_at,
    expires_in: sess.expires_in,
    token_type: 'bearer',
    user: sess.user,
  }

  await page.addInitScript(
    ([k, v]) => {
      try {
        localStorage.setItem(k, v)
        // Nunca mostrar el tour de onboarding (driver.js) durante la grabación:
        // su overlay intercepta los clicks del cursor falso. Mismo storage key
        // que usa components/workspace/WorkspaceTour.tsx para marcarlo visto.
        localStorage.setItem('nv_workspace_tour_v1', 'done')
      } catch { /* noop */ }
    },
    [storageKey, JSON.stringify(sessionObj)] as [string, string],
  )

  // Cookie server-side (para el chequeo de auth en middleware.ts) — awaiteado
  // y sin tragarse el error: si esto falla, el middleware va a rebotar a
  // /partners/login y preferimos que reviente acá con un mensaje claro en vez
  // de seguir grabando la página equivocada.
  const setSessionRes = await request.post('/api/auth/set-session', {
    data: { access_token: sess.access_token, refresh_token: sess.refresh_token },
  })
  if (!setSessionRes.ok()) {
    throw new Error(`/api/auth/set-session devolvió ${setSessionRes.status()}`)
  }

  await page.goto(path, { waitUntil: 'domcontentloaded' })
}

/**
 * Planta la sesión (localStorage cliente + cookie server-side) y navega a
 * `path`. middleware.ts valida el token contra Supabase en cada request a
 * /workspace/**; si esa validación falla (rate-limit transitorio del lado de
 * Supabase, carrera de cookie) redirige a /partners/login?redirect=<path> —
 * una URL que igual CONTIENE el string "workspace" en el query, así que un
 * `waitForURL('**\/workspace**')` la matchearía por error y grabaríamos la
 * página de login en vez del dashboard. Por eso acá verificamos el pathname
 * real (no un glob) y reintentamos una vez con un password grant fresco.
 */
export async function loginAndGoTo(page: Page, request: APIRequestContext, path: string): Promise<void> {
  await plantSessionOnce(page, request, path)
  let pathname = new URL(page.url()).pathname
  if (pathname.startsWith('/partners/login')) {
    await delay(1000)
    await plantSessionOnce(page, request, path)
    pathname = new URL(page.url()).pathname
  }
  if (pathname.startsWith('/partners/login')) {
    throw new Error(
      `loginAndGoTo: seguimos en ${page.url()} después de 2 intentos — middleware.ts rechazó la sesión plantada (revisar validación de token / rate limit de Supabase).`,
    )
  }
  if (!pathname.startsWith('/workspace')) {
    throw new Error(`loginAndGoTo: navegación a "${path}" terminó en "${page.url()}" (esperaba un pathname /workspace...)`)
  }
}

/**
 * Confirma que, tras clickear un link interno del workspace, terminamos en
 * `expectedPathPrefix` — y si no (middleware.ts rebotó a /partners/login por
 * una validación de token transitoriamente fallida, cosa que ya vimos pasar
 * de forma intermitente), se auto-cura: replanta la sesión con un password
 * grant fresco y navega directo a `expectedPathPrefix` en vez de reintentar
 * el click (evita clickear el link equivocado si la página de fallback
 * comparte texto con el nav público, como pasó con "Studio").
 */
export async function ensureWorkspacePath(
  page: Page,
  request: APIRequestContext,
  expectedPathPrefix: string,
  timeoutMs = 15_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (new URL(page.url()).pathname.startsWith(expectedPathPrefix)) return
    await delay(300)
  }
  if (new URL(page.url()).pathname.startsWith(expectedPathPrefix)) return

  console.log(`[ensureWorkspacePath] esperaba "${expectedPathPrefix}", estamos en "${page.url()}" — replantando sesión y navegando directo`)
  await loginAndGoTo(page, request, expectedPathPrefix)
}

// ── Ocultar elementos con info sensible (margen/costo/identidad de test) ────

// Todo testid que NUNCA debe pintarse en un video público. Cada uno se agregó
// (atributo only, cero cambio de comportamiento) en el elemento fuente:
//   - garment-retail-price / -hint      -> app/workspace/design-engine/page.tsx
//   - garment-margin-upsell             -> app/workspace/design-engine/page.tsx (~1611)
//   - catalog-garment-cost-panel        -> app/workspace/catalog/page.tsx (~745)
//   - workspace-user-handle*/-email*    -> app/workspace/layout.tsx (sidebar + topbar + dropdown)
const HIDDEN_LEAK_TESTIDS = [
  'garment-retail-price',
  'garment-retail-price-hint',
  'garment-margin-upsell',
  'catalog-garment-cost-panel',
  'workspace-user-handle',
  'workspace-user-email',
  'workspace-user-handle-topbar',
  'workspace-user-email-dropdown',
  'navbar-user-handle', // components/Navbar.tsx — Navbar publico queda montado dentro de /workspace/*
  'business-model-banner', // components/workspace/BusinessModelBanner.tsx — explica "PVP - costo Novamente" a partners nuevos
  'garment-margin-hint-box', // app/workspace/design-engine/page.tsx (~1767) — "Precio sugerido de venta" + "Margen estimado"
  'catalog-form-margin-breakdown', // app/workspace/catalog/page.tsx (~1089) — selector de prenda base + <MarginBreakdown>
]

const HIDE_LEAKS_CSS = HIDDEN_LEAK_TESTIDS.map(id => `[data-testid="${id}"]`).join(',') + '{display:none!important}'

/** Inyecta CSS antes del primer paint para que ningún elemento con info sensible sea visible ni un frame. */
export async function hideRetailPrice(page: Page): Promise<void> {
  await page.addInitScript((css) => {
    const inject = () => {
      const style = document.createElement('style')
      style.setAttribute('data-e2e', 'hide-leaky-elements')
      style.textContent = css
      document.head.appendChild(style)
    }
    if (document.head) inject()
    else document.addEventListener('DOMContentLoaded', inject)
  }, HIDE_LEAKS_CSS)
}

/**
 * Saca el indicador de dev de Next.js ("N" abajo a la izquierda, que se
 * expande a un pill rojo "N Issues" si hay warnings) de la grabación. Vive en
 * un custom element <nextjs-portal> que Next monta fuera del árbol de React
 * normal — no alcanza con CSS del lado de la página porque a veces re-monta
 * el elemento. Se registra UNA vez (persiste en cada navegación, como
 * hideRetailPrice) y combina remove-al-toque + MutationObserver + un
 * intervalo de respaldo, sin tocar next.config (no es negociable acá: esto
 * es cosmético para la grabación, no una config real del proyecto).
 */
export async function suppressDevOverlay(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const nuke = () => {
      document.querySelectorAll('nextjs-portal').forEach((el) => el.remove())
    }
    const start = () => {
      nuke()
      const observer = new MutationObserver(nuke)
      observer.observe(document.documentElement, { childList: true, subtree: true })
      // Respaldo por si el MutationObserver se pierde algún remount raro.
      setInterval(nuke, 500)
    }
    if (document.documentElement) start()
    else document.addEventListener('DOMContentLoaded', start)
  })
}

/**
 * Confirma que CADA testid de HIDDEN_LEAK_TESTIDS que esté presente en el DOM
 * ahora mismo está realmente display:none (getComputedStyle, no solo "el CSS
 * está inyectado") — así un cambio de markup futuro que rompa el selector (ej.
 * alguien saca el data-testid, o el CSS no llegó a aplicar a tiempo) hace
 * fallar el spec en vez de colar un leak silencioso. No falla si el testid
 * simplemente no está montado en este checkpoint (ej. el dropdown de usuario
 * cerrado) — eso es esperado.
 */
export async function assertHiddenLeaksAreHidden(page: Page, checkpoint: string): Promise<void> {
  const visible: string[] = await page.evaluate((ids) => {
    const bad: string[] = []
    for (const id of ids) {
      const els = document.querySelectorAll(`[data-testid="${id}"]`)
      els.forEach((el) => {
        const style = window.getComputedStyle(el)
        if (style.display !== 'none') bad.push(id)
      })
    }
    return bad
  }, HIDDEN_LEAK_TESTIDS).catch(() => [])
  if (visible.length > 0) {
    throw new Error(
      `[LEAK DETECTED] checkpoint "${checkpoint}": testid(s) que deberían estar display:none siguen visibles: ${visible.join(', ')} — el CSS de hideRetailPrice no los está tapando.`,
    )
  }
}

// ── Aserción anti-leak ───────────────────────────────────────────────────────

// Ampliado tras un review frame-by-frame que encontró leaks reales que la
// lista anterior no cubría: "de margen", el panel de "Costo base de prendas",
// y la identidad completa del tenant/usuario de test (nombre, handle, email)
// visible casi todo el video. Cualquier dominio-de-email cuenta como leak,
// no solo @novamente.* — un video público no debe mostrar NINGÚN email real.
const LEAK_PATTERNS: RegExp[] = [
  /retail/i,
  /margen/i,
  /costo/i,
  /\bAdmin\b/,
  /Internal/i,
  /E2E/i,
  /e2e-partner/i,
  /@novamente\.(ar|test)/i,
  /@[\w.-]+\.(com|ar|test)\b/i,
]

/**
 * Falla ruidosamente si el texto visible de la página (innerText — excluye
 * lo que hideRetailPrice ya tapó con display:none, que es el punto) contiene
 * cualquier patrón de leak. Además confirma que los testids sensibles que sí
 * están montados están realmente ocultos (ver assertHiddenLeaksAreHidden), no
 * solo que el innerText da negativo por casualidad. Se llama en cada
 * checkpoint del video en vez de confiar ciegamente en el CSS.
 */
export async function assertNoLeaks(page: Page, checkpoint: string): Promise<void> {
  await assertHiddenLeaksAreHidden(page, checkpoint)
  const text = await page.evaluate(() => document.body.innerText).catch(() => '')
  for (const pattern of LEAK_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `[LEAK DETECTED] checkpoint "${checkpoint}": texto visible matchea ${pattern} — ABORTANDO grabación en vez de guardar un video con leak.`,
      )
    }
  }
}

// ── Cursor falso + ripple de click ──────────────────────────────────────────

export async function injectFakeCursor(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const setup = () => {
      const cursor = document.createElement('div')
      cursor.id = 'playwright-cursor'
      cursor.style.width = '24px'
      cursor.style.height = '24px'
      cursor.style.position = 'fixed'
      cursor.style.top = '50%'
      cursor.style.left = '50%'
      cursor.style.pointerEvents = 'none'
      cursor.style.zIndex = '2147483647'
      cursor.style.backgroundImage =
        'url("data:image/svg+xml;utf8,<svg width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M5.5 3L18.5 11L11.5 13L16 20.5L13.5 22L9 14.5L3.5 17.5V3Z\' fill=\'white\' stroke=\'black\' stroke-width=\'1.5\'/></svg>")'
      cursor.style.backgroundSize = 'contain'
      cursor.style.backgroundRepeat = 'no-repeat'
      cursor.style.transition = 'top 0.4s ease-out, left 0.4s ease-out'
      document.body.appendChild(cursor)

      ;(window as any).__moveCursor = (x: number, y: number) => {
        const c = document.getElementById('playwright-cursor')
        if (c) {
          c.style.left = x + 'px'
          c.style.top = y + 'px'
        }
      }

      ;(window as any).__clickRipple = (x: number, y: number) => {
        const ripple = document.createElement('div')
        ripple.style.position = 'fixed'
        ripple.style.left = x - 15 + 'px'
        ripple.style.top = y - 15 + 'px'
        ripple.style.width = '30px'
        ripple.style.height = '30px'
        ripple.style.border = '2px solid rgba(255, 255, 255, 0.8)'
        ripple.style.borderRadius = '50%'
        ripple.style.zIndex = '2147483646'
        ripple.style.pointerEvents = 'none'
        ripple.style.transition = 'all 0.3s ease-out'
        ripple.style.transform = 'scale(0)'
        ripple.style.opacity = '1'
        document.body.appendChild(ripple)
        requestAnimationFrame(() => {
          ripple.style.transform = 'scale(2)'
          ripple.style.opacity = '0'
        })
        setTimeout(() => ripple.parentNode?.removeChild(ripple), 300)
      }
    }
    if (document.body) setup()
    else document.addEventListener('DOMContentLoaded', setup)
  })
}

export async function moveCursorTo(page: Page, locator: Locator): Promise<{ x: number; y: number } | null> {
  const box = await locator.boundingBox().catch(() => null)
  if (!box) return null
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.evaluate(({ x, y }) => (window as any).__moveCursor?.(x, y), { x, y })
  await delay(450)
  return { x, y }
}

export async function clickWithRipple(page: Page, locator: Locator): Promise<void> {
  const pos = await moveCursorTo(page, locator)
  if (pos) {
    await page.evaluate(({ x, y }) => (window as any).__clickRipple?.(x, y), pos)
  }
  await locator.click()
  await delay(400)
}

/**
 * Igual que clickWithRipple (cursor + ripple visual) pero SIN disparar el
 * click real — para links de navegación entre páginas del workspace donde
 * seguimos con un page.goto() duro inmediatamente después. Verificado: un
 * click real de Next <Link> arranca una transición client-side (fetch del
 * RSC payload) que, si un goto() la interrumpe a mitad de camino, puede dejar
 * la página destino con su useEffect de carga inicial colgado para siempre
 * (reproducido en record-studio-video.spec.ts — con click real + goto la
 * pantalla de "Generando..." nunca resolvía; sin el click real, resuelve en
 * ~3s). El ripple visual solo no navega a ningún lado.
 */
export async function ripplePreview(page: Page, locator: Locator): Promise<void> {
  const pos = await moveCursorTo(page, locator)
  if (pos) {
    await page.evaluate(({ x, y }) => (window as any).__clickRipple?.(x, y), pos)
  }
  await delay(300)
}

// ── Audio sync log ───────────────────────────────────────────────────────────

export function makeAudioSync(startTime: number) {
  const events: { n: number; at: number }[] = []
  const cuts: { from: number; to: number }[] = []
  let endMarker: number | null = null

  const elapsed = () => Number(((Date.now() - startTime) / 1000).toFixed(2))

  return {
    events,
    cuts,
    /** Segundos transcurridos desde startTime — para calcular from/to de cut() a mano. */
    now: elapsed,
    mark(n: number) {
      const at = elapsed()
      events.push({ n, at })
      // eslint-disable-next-line no-console
      console.log(`[AUDIO_SYNC] ${n} ${at}`)
      return at
    },
    /**
     * Marca un tramo [from, to] (segundos en el reloj de la grabación, NO ya
     * recortados) para que scripts/mux-marketing-video.mjs lo elimine del
     * video (esperas muertas sin narración — ej. "Generando mockup..." sin
     * audio encima) y corra los offsets de todo lo que venga después.
     */
    cut(from: number, to: number) {
      if (to <= from) return
      cuts.push({ from: Number(from.toFixed(2)), to: Number(to.toFixed(2)) })
      // eslint-disable-next-line no-console
      console.log(`[CUT] ${from.toFixed(2)} ${to.toFixed(2)}`)
    },
    /** Marca dónde debe terminar el video (después del último hold visual, no solo el último audio). */
    end() {
      endMarker = elapsed()
      // eslint-disable-next-line no-console
      console.log(`[END] ${endMarker}`)
      return endMarker
    },
    toJSON() {
      return { events, cuts, end: endMarker }
    },
  }
}

/**
 * Rellena un input y confirma que el valor efectivamente quedó escrito (React
 * a veces pisa el fill si el componente todavía está hidratando). Reintenta
 * una vez en vez de confiar en un delay fijo.
 */
export async function fillAndVerify(page: Page, locator: Locator, value: string): Promise<void> {
  await locator.fill(value)
  await delay(300)
  const current = await locator.inputValue().catch(() => '')
  if (current !== value) {
    await locator.fill(value)
    await delay(500)
    const retry = await locator.inputValue().catch(() => '')
    if (retry !== value) {
      throw new Error(`fillAndVerify: el input no retuvo el valor "${value}" (quedó "${retry}") tras un reintento`)
    }
  }
}

/**
 * Pausa "viva": el recorder de video de Playwright (screencast por frames)
 * pierde los últimos segundos de una pausa completamente estática — el video
 * final termina antes de lo esperado (verificado: pausas de varios segundos
 * antes de page.close() se recortaban del .webm crudo). Sacude el cursor
 * falso 1px cada ~400ms para forzar repaints y que el recorder siga
 * capturando frames durante toda la pausa. Usar en vez de `delay()` para
 * cualquier pausa que preceda de cerca a page.close() o a otro checkpoint
 * importante del video.
 */
export async function hold(page: Page, ms: number): Promise<void> {
  const step = 400
  let remaining = ms
  let nudge = false
  while (remaining > 0) {
    const chunk = Math.min(step, remaining)
    await page.evaluate((jitter) => {
      const c = document.getElementById('playwright-cursor')
      if (c) {
        const top = parseFloat(c.style.top || '0')
        c.style.top = (top + jitter) + 'px'
      }
    }, nudge ? 1 : -1).catch(() => {})
    // Además del jitter puramente CSS, un page.mouse.move() real (input
    // sintético de verdad, no solo una mutación de estilo) — más confiable
    // para que el screencast de Playwright siga capturando frames durante
    // pausas largas y estáticas (viejo bug: el .webm crudo perdía los
    // últimos segundos de un hold sin esto).
    await page.mouse.move(640 + (nudge ? 1 : 0), 360).catch(() => {})
    nudge = !nudge
    await delay(chunk)
    remaining -= chunk
  }
}

/**
 * Espera que `locator` sea visible; si no aparece a tiempo, hace UN reload y
 * reintenta. Next.js dev-mode a veces deja el fetch inicial de una página
 * colgado tras una navegación (reproducido en corridas repetidas incluso con
 * page.goto() "duro" — no es 100% determinístico, un reload lo destraba
 * casi siempre porque relanza el mount/fetch desde cero). Preferible a
 * esperar para siempre o a fallar el spec entero por una race de dev-server.
 */
export async function waitVisibleWithReload(page: Page, locator: Locator, timeoutMs = 20_000): Promise<void> {
  try {
    await locator.waitFor({ state: 'visible', timeout: timeoutMs })
  } catch {
    console.log('[waitVisibleWithReload] no aparecio a tiempo — reload y reintento')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await locator.waitFor({ state: 'visible', timeout: timeoutMs })
  }
}

export { delay }

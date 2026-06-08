/**
 * Screenshots mobile (375px) del design-engine para QA visual de los fixes:
 *  #1 toggle Frente/Espalda visible (controles flex-wrap)
 *  #3 chip de prenda+color + drawer
 *
 * Evita el login UI (flaky con el HMR del dev server): obtiene el token vía
 * Supabase y siembra cookie + localStorage directo.
 *
 * Uso: node scripts/qa-screenshots.mjs [label]   (label: "after" / "before")
 */
import { chromium } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

for (const f of [".env.local", ".env"]) {
  const p = join(process.cwd(), f)
  if (existsSync(p)) for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
  }
}

const LABEL = process.argv[2] || "after"
const BASE = "http://localhost:3000"
const OUT = "/tmp"
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ref = SUPA_URL.match(/\/\/([^.]+)/)[1]
const cookieName = `sb-${ref}-auth-token`

// Credenciales de la cuenta QA desde env (definirlas en .env.local). La cuenta
// se crea/resetea con scripts/qa-setup.mjs.
const QA_EMAIL = process.env.QA_EMAIL
const QA_PASSWORD = process.env.QA_PASSWORD
if (!QA_EMAIL || !QA_PASSWORD) {
  console.error("Falta QA_EMAIL / QA_PASSWORD en el entorno (definilas en .env.local).")
  process.exit(1)
}

const run = async () => {
  // 1. Login server-side → token
  const sb = createClient(SUPA_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data, error } = await sb.auth.signInWithPassword({
    email: QA_EMAIL,
    password: QA_PASSWORD,
  })
  if (error) throw new Error("login supabase falló: " + error.message)
  const session = data.session

  // 2. Browser con sesión sembrada (cookie para middleware + localStorage para authFetch)
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  await context.addCookies([{
    name: cookieName,
    value: JSON.stringify([session.access_token, session.refresh_token]),
    domain: "localhost",
    path: "/",
  }])
  await context.addInitScript(([k, v]) => {
    window.localStorage.setItem(k, v)
  }, [cookieName, JSON.stringify(session)])

  const page = await context.newPage()

  await page.goto(`${BASE}/workspace/design-engine`, { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Frente" }).waitFor({ state: "visible", timeout: 30000 })
  await page.waitForTimeout(1500)

  // El drawer de prendas abre por default en mobile (rightPanelOpen=true) y tapa
  // el canvas/controles. Lo cerramos clickeando el backdrop (franja izq. fuera
  // del panel w-80) — el botón "Cerrar" queda bajo el header sticky.
  await page.mouse.click(20, 400)
  await page.waitForTimeout(700)

  // Screenshot 1: barra de controles — Fix #1 (Frente/Espalda visible sin scroll
  // oculto) + Fix #3 (chip muestra prenda · color). Scrolleamos el toggle a la vista.
  await page.getByRole("button", { name: "Frente" }).scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}/de-mobile-controls-${LABEL}.png` })
  console.log(`✓ ${OUT}/de-mobile-controls-${LABEL}.png`)

  // Screenshot 2: reabrir el drawer desde el chip (Fix #3 — drawer + backdrop)
  const chip = page.getByRole("button", { name: /elegir prenda y color/i })
  let opened = false
  if (await chip.count()) { await chip.first().click(); opened = true }
  else {
    const legacy = page.locator("button.lg\\:hidden").filter({ hasText: /remera|buzo|prenda|hoodie|musculosa/i }).first()
    if (await legacy.count()) { await legacy.click(); opened = true }
  }
  if (opened) {
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${OUT}/de-mobile-drawer-${LABEL}.png` })
    console.log(`✓ ${OUT}/de-mobile-drawer-${LABEL}.png`)
  } else {
    console.log("  (no se encontró el chip para abrir el drawer)")
  }

  await browser.close()
}

run().catch((e) => { console.error("screenshot script falló:", e.message); process.exit(1) })

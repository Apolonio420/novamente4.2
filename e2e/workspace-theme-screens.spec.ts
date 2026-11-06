/**
 * Workspace de partner (/workspace) en tema claro (default) y oscuro, con el
 * partner de E2E (E2E_PARTNER_EMAIL / E2E_PARTNER_PASSWORD de .env.local).
 *
 *   PLAYWRIGHT_BASE_URL=http://localhost:3142 [PW_CHANNEL=chrome] [THEME_SHOTS_DIR=…] \
 *     npx playwright test e2e/workspace-theme-screens.spec.ts
 */
import { test, expect } from "@playwright/test"
import { E2E_PARTNER_EMAIL, E2E_PARTNER_PASSWORD, hasPartnerAuthCreds } from "./fixtures/partner-auth"

if (process.env.PW_CHANNEL) test.use({ channel: process.env.PW_CHANNEL })

const PAGES = [
  { name: "inicio", path: "/workspace" },
  { name: "catalogo", path: "/workspace/catalog" },
  { name: "pedidos", path: "/workspace/orders" },
  { name: "finanzas", path: "/workspace/finanzas" },
  { name: "branding", path: "/workspace/branding" },
  { name: "analytics", path: "/workspace/analytics" },
  { name: "ajustes", path: "/workspace/settings" },
]
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } } as const
const OUT = process.env.THEME_SHOTS_DIR ?? "test-results/theme-screens"

for (const theme of ["light", "dark"] as const) {
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    test(`workspace ${theme} ${vp}`, async ({ page }) => {
      test.skip(!hasPartnerAuthCreds(), "sin credenciales E2E de partner")
      test.setTimeout(300_000)
      await page.setViewportSize(size)
      await page.addInitScript((t) => {
        if (t === "dark") localStorage.setItem("novamente-theme", "dark")
        localStorage.setItem("email-capture-dismissed", "1")
      }, theme)
      await page.goto("/partners/login", { waitUntil: "domcontentloaded" })
      await page.getByPlaceholder("tu@email.com").fill(E2E_PARTNER_EMAIL)
      await page.getByPlaceholder("Tu contraseña").fill(E2E_PARTNER_PASSWORD)
      await page.locator('button[type="submit"]').click()
      await page.waitForURL("**/workspace**", { timeout: 60_000 })
      for (const p of PAGES) {
        await page.goto(p.path, { waitUntil: "domcontentloaded" })
        await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {})
        await page.waitForTimeout(1500)
        expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(theme === "dark")
        await page.screenshot({ path: `${OUT}/workspace-${theme}-${vp}-${p.name}.png` })
      }
    })
  }
}

import { test, expect } from "@playwright/test"

const SCRATCHPAD =
  "/private/tmp/claude-501/-Users-sambujuan-novamente-dev-chatbot/ddf326a2-985c-4856-8de5-ba8b782f45b3/scratchpad"

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]

const PAGES = [
  { path: "/", slug: "home" },
  { path: "/malvinas", slug: "malvinas" },
]

for (const vp of VIEWPORTS) {
  for (const p of PAGES) {
    test(`${p.slug} @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto(p.path, { waitUntil: "networkidle" })
      await page.waitForTimeout(500)
      await page.screenshot({
        path: `${SCRATCHPAD}/${p.slug}-${vp.name}.png`,
        fullPage: true,
      })
      // no assertions beyond a successful screenshot — visual check happens via Read
      expect(true).toBe(true)
    })
  }
}

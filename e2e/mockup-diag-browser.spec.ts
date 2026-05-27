import { test } from "@playwright/test"

test("diag mockup via browser fetch", async ({ browser }) => {
  test.setTimeout(120000)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  // Cargar /crear primero para tener cookies de Vercel
  await page.goto("https://www.novamente.ar/crear", { waitUntil: "networkidle", timeout: 60000 })
  await page.waitForTimeout(2000)

  // Hacer el fetch desde el browser (con cookies validas)
  const cases = [
    { gt: "aldea-classic-tshirt", gc: "black", side: "front" },
    { gt: "buzo-hoodie-unisex", gc: "stone-wash", side: "front" },
    { gt: "remera-crop-mujer", gc: "chocolate", side: "front" },
  ]

  for (const c of cases) {
    const result = await page.evaluate(async (args) => {
      const r = await fetch("/api/generate-mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designImageUrl: "/api/proxy-image?key=v1%2Fraw-designs%2F1779225022296-mpvto.png",
          ...args,
        }),
      })
      const text = await r.text()
      return { status: r.status, body: text.slice(0, 300) }
    }, { garmentType: c.gt, garmentColor: c.gc, side: c.side })

    console.log(`[${c.gt}|${c.gc}] status=${result.status} body=${result.body}`)
  }

  await ctx.close()
})

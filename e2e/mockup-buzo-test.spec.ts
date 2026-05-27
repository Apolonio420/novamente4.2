import { test } from "@playwright/test"
import fs from "fs"
import path from "path"

const OUT = "tests-results/cases"

test("mockup buzo cuello redondo (fix verification)", async ({ browser }) => {
  test.setTimeout(120000)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto("https://www.novamente.ar/crear", { waitUntil: "networkidle", timeout: 60000 })
  await page.waitForTimeout(2000)

  // Diseño existente (dragón ukiyo-e del test anterior)
  const designUrl = "/api/proxy-image?key=v1%2Fraw-designs%2F1779225022296-mpvto.png"

  const cases = [
    { name: "FIX-buzo-cuello-redondo-black", gt: "buzo-cuello-redondo", gc: "black" },
    { name: "FIX-buzo-hoodie-black", gt: "buzo-hoodie-unisex", gc: "black" },
    { name: "FIX-musculosa-bali-gray", gt: "musculosa-bali", gc: "gray" },
    { name: "FIX-crop-yellow", gt: "remera-crop-mujer", gc: "yellow" },
  ]

  for (const c of cases) {
    const result = await page.evaluate(async (args) => {
      const r = await fetch("/api/public/design/mockup-lifestyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designImageUrl: args.designUrl,
          garmentType: args.gt,
          garmentColor: args.gc,
          side: "front",
        }),
      })
      const j = await r.json()
      return { status: r.status, body: j }
    }, { designUrl, gt: c.gt, gc: c.gc })

    const url: string | undefined = result.body?.publicUrl
    console.log(`[${c.name}] status=${result.status} url=${url}`)

    if (url) {
      const full = url.startsWith("http") ? url : `https://www.novamente.ar${url}`
      const res = await fetch(full)
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        fs.writeFileSync(path.join(OUT, `${c.name}.png`), buf)
        console.log(`[${c.name}] saved`)
      }
    }
  }

  await ctx.close()
})

import { test } from "@playwright/test"
import fs from "fs"
import path from "path"

const OUT = "tests-results/cases"

test("mockup lifestyle — generar 3 mockups con diseños ya existentes", async ({ browser }) => {
  test.setTimeout(240000)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto("https://www.novamente.ar/crear", { waitUntil: "networkidle", timeout: 60000 })
  await page.waitForTimeout(2000)

  // Diseños existentes de tests anteriores
  const cases = [
    { name: "L01-calavera-mexicana-aldea-black", designUrl: "/api/proxy-image?key=v1%2Fraw-designs%2F1779237103664-32efl.png", gt: "aldea-classic-tshirt", gc: "black", side: "front" },
    { name: "L02-nunca-mas-aldea-white", designUrl: "/api/proxy-image?key=v1%2Fraw-designs%2F1779237130162-jats3.png", gt: "aldea-classic-tshirt", gc: "white", side: "front" },
    { name: "L03-leon-hoodie-black", designUrl: "/api/proxy-image?key=v1%2Fraw-designs%2F1779237157420-kd9p9.png", gt: "buzo-hoodie-unisex", gc: "black", side: "front" },
  ]

  for (const c of cases) {
    console.log(`[lifestyle] generando ${c.name}...`)
    const result = await page.evaluate(async (args) => {
      const r = await fetch("/api/public/design/mockup-lifestyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designImageUrl: args.designUrl,
          garmentType: args.gt,
          garmentColor: args.gc,
          side: args.side,
        }),
      })
      const j = await r.json()
      return { status: r.status, body: j }
    }, c)

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

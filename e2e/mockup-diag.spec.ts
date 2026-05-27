import { test } from "@playwright/test"

test("diag — mockup endpoint con keys nuevos", async ({ request }) => {
  test.setTimeout(120000)

  const cases = [
    { gt: "aldea-classic-tshirt", gc: "black", side: "front" },
    { gt: "aura-oversize-tshirt", gc: "white", side: "front" },
    { gt: "buzo-hoodie-unisex", gc: "stone-wash", side: "front" },
    { gt: "buzo-cuello-redondo", gc: "black", side: "front" },
    { gt: "remera-crop-mujer", gc: "chocolate", side: "front" },
    { gt: "musculosa-bali", gc: "gray", side: "front" },
  ]

  // Usar un design URL que sabemos existe (de los tests previos)
  const designUrl = "/api/proxy-image?key=v1%2Fraw-designs%2F1779225022296-mpvto.png"

  for (const c of cases) {
    const res = await request.post("https://www.novamente.ar/api/generate-mockup", {
      data: {
        designImageUrl: designUrl,
        garmentType: c.gt,
        garmentColor: c.gc,
        side: c.side,
      },
      timeout: 60000,
    })
    const body = await res.text()
    console.log(`[${c.gt}|${c.gc}|${c.side}] status=${res.status()} body=${body.slice(0, 200)}`)
  }
})

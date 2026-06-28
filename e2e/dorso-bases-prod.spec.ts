import { test, expect } from '@playwright/test'

// Verifica que TODAS las bases de mockup del DORSO (lado "back") sirvan 200 en
// producción. El bug de Lau era 404 en estas bases: la Remera Clásica Mujer
// (PNG untracked → no estaba en git) y el buzo negro (mapping sin entrada →
// fallback "/fallback" → 404). Si alguna da != 200, el dorso de esa prenda/color
// se rompe en el estudio. Corre contra prod (URLs absolutas, ignora baseURL).
const PROD = 'https://www.novamente.ar'

const DORSO_BASES = [
  '/garments/buzo-hoodie-unisex-black-back.jpeg',
  '/garments/buzo-hoodie-unisex-crema-back.jpeg',
  '/garments/buzo-hoodie-unisex-gris-back.jpeg',
  '/garments/buzo-hoodie-unisex-marron-back.jpeg',
  '/garments/buzo-hoodie-unisex-stone-wash-back.jpeg',
  '/garments/buzo-hoodie-unisex-white-back.jpeg',
  '/garments/hoodie-black-back.jpeg',
  '/garments/hoodie-cream-back.png',
  '/garments/hoodie-gray-back.png',
  '/garments/remera-clasica-mujer-black-back.png',
  '/garments/remera-clasica-mujer-white-back.png',
  '/garments/tshirt-black-classic-back.jpeg',
  '/garments/tshirt-black-oversize-back.jpeg',
  '/garments/tshirt-caramel-oversize-back.jpeg',
  '/garments/tshirt-white-classic-back.jpeg',
  '/garments/tshirt-white-oversize-back.jpeg',
]

test.describe('Bases de dorso (back) — 200 en prod', () => {
  for (const path of DORSO_BASES) {
    test(`200 OK · ${path}`, async ({ request }) => {
      const res = await request.get(`${PROD}${path}`)
      expect(res.status(), `${path} debería dar 200 (no 404)`).toBe(200)
      const ct = res.headers()['content-type'] || ''
      expect(ct, `${path} debería ser una imagen`).toContain('image')
    })
  }
})

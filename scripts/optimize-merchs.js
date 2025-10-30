/*
  Optimiza imágenes de merchs a .webp
  - Origen: public/merchs/nm-merch-001.jpg ... nm-merch-008.jpg
  - Salida: public/merchs/nm-merch-001.webp ... nm-merch-008.webp
  Requisitos: paquete 'sharp' instalado (ya presente en dependencies)
*/

const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

const DIR = path.join(process.cwd(), "public/merchs")
const pad3 = (n) => String(n).padStart(3, "0")
const files = Array.from({ length: 8 }, (_, i) => `nm-merch-${pad3(i + 1)}.jpg`)

;(async () => {
  for (const file of files) {
    const src = path.join(DIR, file)
    const base = file.replace(/\.jpg$/i, "")
    const out = path.join(DIR, `${base}.webp`)
    if (!fs.existsSync(src)) {
      console.warn(`- SKIP: no existe ${file}`)
      continue
    }
    try {
      await sharp(src)
        .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(out)
      console.log(`✓ ${path.basename(out)}`)
    } catch (e) {
      console.error(`✗ error optimizando ${file}:`, e?.message || e)
    }
  }
})()



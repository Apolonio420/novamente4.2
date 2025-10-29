/*
  Optimiza imágenes de merchs a .webp
  - Origen: public/merchs/nm-merch-009.jpg ... nm-merch-018.jpg
  - Salida: public/merchs/nm-merch-009.webp ... nm-merch-018.webp
  Requisitos: paquete 'sharp' instalado (ya presente en dependencies)
*/

const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

const DIR = path.join(process.cwd(), "public/merchs")
const files = Array.from({ length: 10 }, (_, i) => {
  const n = 9 + i // 009..018
  return `nm-merch-0${n}.jpg`
})

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



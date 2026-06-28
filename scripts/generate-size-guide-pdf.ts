/**
 * Generates public/guia-de-talles-novamente.pdf
 *
 * Single source of truth: the SIZE_CHARTS object below mirrors the one in
 * app/products/[id]/page.tsx. If you change the size data in one, update both.
 *
 * Run: npx tsx scripts/generate-size-guide-pdf.ts
 */
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

type SizeChart = {
  title: string
  sizes: string[]
  width: string[]
  length: string[]
  // Imagen de la prenda (ruta relativa a /public) — se muestra junto a la tabla.
  image?: string
  note?: string
}

const SIZE_CHARTS: SizeChart[] = [
  {
    title: 'Hoodies (Buzo con capucha — unisex)',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    width: ['64', '66', '68', '70', '72', '74'],
    length: ['67', '69', '71', '73', '75', '77'],
    image: 'garments/hoodie-black-front.jpeg',
  },
  {
    title: 'Buzos cuello redondo (Crewneck — unisex)',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    width: ['65', '67', '69', '71', '73', '75'],
    length: ['66', '68', '70', '72', '74', '76'],
    image: 'garments/buzo-cuello-redondo-black-front.png',
  },
  {
    title: 'Remera Aura T-Shirt (oversize unisex)',
    sizes: ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL'],
    width: ['55', '57', '59', '61', '63', '66', '69'],
    length: ['69', '71', '73', '75', '77', '79', '81'],
    image: 'garments/tshirt-black-oversize-front.jpeg',
  },
  {
    title: 'Remera Aldea T-Shirt (clásica unisex)',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    width: ['48', '52', '56', '58', '60'],
    length: ['63', '68', '72', '75', '77'],
    image: 'garments/tshirt-black-classic-front.jpeg',
  },
  {
    title: 'Remera Crop (mujer)',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    width: ['46', '48', '50', '52', '53'],
    length: ['40', '42', '44', '46', '48'],
    image: 'garments/remera-crop-mujer-black-front.png',
  },
  {
    title: 'Musculosa Bali (mujer)',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    width: ['28', '30', '32', '34', '36'],
    length: ['44', '46', '48', '50', '52'],
    image: 'garments/musculosa-bali-black-front.png',
  },
  {
    title: 'Remera clásica (mujer)',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    width: ['47', '49', '51', '53', '55'],
    length: ['61', '63', '65', '67', '69'],
    image: 'garments/remera-clasica-mujer-black-front.png',
  },
  {
    title: 'Remera Bambino (infantil unisex)',
    sizes: ['4', '6', '8', '10', '12', '14', '16'],
    width: ['38', '40', '42', '44', '46', '48', '50'],
    length: ['53', '55', '57', '59', '61', '63', '66'],
    image: 'products/remera-infantil-negro/front.jpg',
    note: 'Medidas aproximadas, pueden variar hasta un 5%.',
  },
]

const VIOLET = '#7c3aed'
const VIOLET_SOFT = '#ede9fe'
const ZINC_900 = '#18181b'
const ZINC_700 = '#3f3f46'
const ZINC_500 = '#71717a'
const ZINC_200 = '#e4e4e7'

function drawHeader(doc: PDFKit.PDFDocument) {
  const pageWidth = doc.page.width
  doc.rect(0, 0, pageWidth, 90).fill(VIOLET)
  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(26)
    .text('Guía de Talles', 50, 30)
  doc
    .font('Helvetica')
    .fontSize(11)
    .text('Novamente — Medidas de todas nuestras prendas', 50, 62)
  doc.fillColor(ZINC_900)
}

function drawFooter(doc: PDFKit.PDFDocument) {
  const pageHeight = doc.page.height
  const pageWidth = doc.page.width
  doc
    .fillColor(ZINC_500)
    .font('Helvetica')
    .fontSize(9)
    .text(
      'novamente.ar — Las medidas pueden variar ± 1 cm. Si estás entre dos talles, te recomendamos elegir el más grande.',
      50,
      pageHeight - 50,
      { width: pageWidth - 100, align: 'center' },
    )
  doc.fillColor(ZINC_900)
}

function drawSizeTable(
  doc: PDFKit.PDFDocument,
  chart: SizeChart,
  y: number,
  img?: { buf: Buffer; ar: number },
): number {
  const x = 50
  const pageWidth = doc.page.width
  const fullWidth = pageWidth - 100
  const imgW = img ? 140 : 0
  const gap = img ? 24 : 0
  const tableWidth = fullWidth - imgW - gap
  const colWidth = tableWidth / 3
  const rowHeight = 24
  const startY = y

  // Title
  doc
    .fillColor(VIOLET)
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(chart.title, x, y, { width: fullWidth })
  y += 22

  // Header row
  doc.rect(x, y, tableWidth, rowHeight).fill(VIOLET_SOFT)
  doc
    .fillColor(ZINC_900)
    .font('Helvetica-Bold')
    .fontSize(11)
  doc.text('Talle', x, y + 7, { width: colWidth, align: 'center' })
  doc.text('Ancho (cm)', x + colWidth, y + 7, { width: colWidth, align: 'center' })
  doc.text('Largo (cm)', x + colWidth * 2, y + 7, { width: colWidth, align: 'center' })
  y += rowHeight

  // Rows
  doc.font('Helvetica').fontSize(11).fillColor(ZINC_700)
  chart.sizes.forEach((size, i) => {
    if (i % 2 === 0) {
      doc.rect(x, y, tableWidth, rowHeight).fill('#fafafa')
    }
    doc.fillColor(VIOLET).font('Helvetica-Bold')
    doc.text(size, x, y + 7, { width: colWidth, align: 'center' })
    doc.fillColor(ZINC_700).font('Helvetica')
    doc.text(chart.width[i], x + colWidth, y + 7, { width: colWidth, align: 'center' })
    doc.text(chart.length[i], x + colWidth * 2, y + 7, { width: colWidth, align: 'center' })
    y += rowHeight
  })

  // Border tabla
  const tableHeight = rowHeight * (chart.sizes.length + 1)
  doc
    .lineWidth(0.5)
    .strokeColor(ZINC_200)
    .rect(x, y - tableHeight, tableWidth, tableHeight)
    .stroke()
  const tableBottom = y

  // Imagen de la prenda a la derecha, alineada al tope de la tabla
  let imgBottom = startY
  if (img) {
    const imgTop = startY + 22
    const imgX = x + tableWidth + gap
    const imgH = imgW * img.ar
    doc.image(img.buf, imgX, imgTop, { width: imgW })
    doc.lineWidth(0.5).strokeColor(ZINC_200).rect(imgX, imgTop, imgW, imgH).stroke()
    imgBottom = imgTop + imgH
  }

  return Math.max(tableBottom, imgBottom) + 24
}

async function main() {
  const outPath = path.join(process.cwd(), 'public', 'guia-de-talles-novamente.pdf')
  const doc = new PDFDocument({ size: 'A4', margin: 0, info: {
    Title: 'Guía de talles — Novamente',
    Author: 'Novamente',
    Subject: 'Medidas de todas las prendas Novamente',
  } })

  const stream = fs.createWriteStream(outPath)
  doc.pipe(stream)

  drawHeader(doc)
  let y = 120

  // Intro
  doc
    .fillColor(ZINC_700)
    .font('Helvetica')
    .fontSize(10)
    .text(
      'Todas las medidas están tomadas con la prenda apoyada en una superficie plana. El ancho corresponde a la medida de axila a axila y el largo se mide desde el hombro hasta el ruedo inferior.',
      50,
      y,
      { width: doc.page.width - 100, align: 'left' },
    )
  y += 50

  // Precargar imágenes de prenda (thumb 360px, fondo blanco para PNGs transparentes).
  const PUBLIC = path.join(process.cwd(), 'public')
  const imgMap = new Map<string, { buf: Buffer; ar: number }>()
  for (const chart of SIZE_CHARTS) {
    if (!chart.image) continue
    const p = path.join(PUBLIC, chart.image)
    if (!fs.existsSync(p)) {
      console.warn('  ⚠ imagen no encontrada:', chart.image)
      continue
    }
    const { data, info } = await sharp(p)
      .resize({ width: 360, withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 82 })
      .toBuffer({ resolveWithObject: true })
    imgMap.set(chart.title, { buf: data, ar: info.height / info.width })
  }

  for (const chart of SIZE_CHARTS) {
    const img = imgMap.get(chart.title)
    if (y > doc.page.height - 260) {
      drawFooter(doc)
      doc.addPage()
      drawHeader(doc)
      y = 120
    }
    y = drawSizeTable(doc, chart, y, img)
  }

  drawFooter(doc)
  doc.end()

  await new Promise<void>((resolve) => stream.on('finish', () => resolve()))
  console.log(`✓ Generado: ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

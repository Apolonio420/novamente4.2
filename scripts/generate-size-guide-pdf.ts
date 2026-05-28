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

type SizeChart = {
  title: string
  sizes: string[]
  width: string[]
  length: string[]
  note?: string
}

const SIZE_CHARTS: SizeChart[] = [
  {
    title: 'Hoodies (Buzo con capucha — unisex)',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    width: ['64', '66', '68', '70', '72', '74'],
    length: ['67', '69', '71', '73', '75', '77'],
  },
  {
    title: 'Buzos cuello redondo (Crewneck — unisex)',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    width: ['65', '67', '69', '71', '73', '75'],
    length: ['66', '68', '70', '72', '74', '76'],
  },
  {
    title: 'Remera Aura T-Shirt (oversize unisex)',
    sizes: ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL'],
    width: ['55', '57', '59', '61', '63', '66', '69'],
    length: ['69', '71', '73', '75', '77', '79', '81'],
  },
  {
    title: 'Remera Aldea T-Shirt (clásica unisex)',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    width: ['48', '52', '56', '58', '60'],
    length: ['63', '68', '72', '75', '77'],
  },
  {
    title: 'Remera Crop (mujer)',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    width: ['46', '48', '50', '52', '53'],
    length: ['40', '42', '44', '46', '48'],
  },
  {
    title: 'Musculosa Bali (mujer)',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    width: ['28', '30', '32', '34', '36'],
    length: ['44', '46', '48', '50', '52'],
  },
  {
    title: 'Remera clásica (mujer)',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    width: ['47', '49', '51', '53', '55'],
    length: ['61', '63', '65', '67', '69'],
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

function drawSizeTable(doc: PDFKit.PDFDocument, chart: SizeChart, y: number): number {
  const x = 50
  const pageWidth = doc.page.width
  const tableWidth = pageWidth - 100
  const colCount = 3
  const colWidth = tableWidth / colCount
  const rowHeight = 24

  // Title
  doc
    .fillColor(VIOLET)
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(chart.title, x, y)
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

  // Border
  const tableHeight = rowHeight * (chart.sizes.length + 1)
  doc
    .lineWidth(0.5)
    .strokeColor(ZINC_200)
    .rect(x, y - tableHeight, tableWidth, tableHeight)
    .stroke()

  return y + 24
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

  for (const chart of SIZE_CHARTS) {
    if (y > doc.page.height - 220) {
      drawFooter(doc)
      doc.addPage()
      drawHeader(doc)
      y = 120
    }
    y = drawSizeTable(doc, chart, y)
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

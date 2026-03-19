export interface CsvProduct {
  name: string
  price?: number
  category?: string
  description?: string
  tags?: string[]
}

export interface CsvParseResult {
  products: CsvProduct[]
  errors: string[]
}

export function parseCsvProducts(csvText: string): CsvParseResult {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) {
    return { products: [], errors: ['El archivo esta vacío o no tiene datos'] }
  }

  const header = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/^"(.*)"$/, '$1'))
  const nameIdx = header.findIndex((h) => ['name', 'nombre', 'producto'].includes(h))
  const priceIdx = header.findIndex((h) => ['price', 'precio'].includes(h))
  const categoryIdx = header.findIndex((h) => ['category', 'categoria', 'categoría'].includes(h))
  const descIdx = header.findIndex((h) => ['description', 'descripcion', 'descripción'].includes(h))
  const tagsIdx = header.findIndex((h) => ['tags', 'etiquetas'].includes(h))

  if (nameIdx === -1) {
    return { products: [], errors: ['No se encontro la columna "name" o "nombre" en el CSV'] }
  }

  const products: CsvProduct[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols = parseCsvLine(line)
    const name = cols[nameIdx]?.trim()

    if (!name) {
      errors.push(`Fila ${i + 1}: nombre vacío, se omitió`)
      continue
    }

    const product: CsvProduct = { name }

    if (priceIdx !== -1 && cols[priceIdx]) {
      const price = parseFloat(cols[priceIdx].replace(/[^0-9.,]/g, '').replace(',', '.'))
      if (!isNaN(price)) product.price = price
    }

    if (categoryIdx !== -1 && cols[categoryIdx]) {
      product.category = cols[categoryIdx].trim()
    }

    if (descIdx !== -1 && cols[descIdx]) {
      product.description = cols[descIdx].trim()
    }

    if (tagsIdx !== -1 && cols[tagsIdx]) {
      product.tags = cols[tagsIdx].split(';').map((t) => t.trim()).filter(Boolean)
    }

    products.push(product)
  }

  return { products, errors }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

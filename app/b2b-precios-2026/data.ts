export type Tier = {
  key: "partner" | "starter" | "pro" | "drop" | "bulk"
  label: string
  range: string
  blurb: string
}

export const TIERS: Tier[] = [
  { key: "partner", label: "Modelo Partner", range: "1 unidad", blurb: "Punto de entrada para compras on-demand, regalos o validacion de producto (muestras)." },
  { key: "starter", label: "Starter", range: "5–9 unidades", blurb: "Ideal para lanzamientos pequenos o pedidos iniciales de stock limitado." },
  { key: "pro", label: "Pro", range: "10–20 unidades", blurb: "Disenado para marcas en crecimiento que requieren reposicion constante." },
  { key: "drop", label: "Drop", range: "30–99 unidades", blurb: "Optimizado para colecciones planificadas y lanzamientos de temporada." },
  { key: "bulk", label: "Bulk", range: "100+ unidades", blurb: "La tarifa mas competitiva para operaciones mayoristas de alto volumen." },
]

export type ColorVariant = {
  name: string
  swatch: string
  images: string[]
}

export type B2BModel = {
  id: string
  name: string
  subtitle: string
  category: string
  fabric: string
  sizes: string[]
  measurementsChart: string
  prices: { partner: number; starter: number; pro: number; drop: number; bulk: number }
  colors: ColorVariant[]
}

// Mapeo model.id (este catalogo) -> key del catalogo partner (garment-pricing.ts).
// Permite derivar el precio Growth en el server sin duplicar datos ni filtrar el costo al cliente.
export const MODEL_TO_GARMENT_KEY: Record<string, string> = {
  berlin: "buzo-cuello-redondo",
  boston: "buzo-hoodie-unisex",
  aura: "aura-oversize-tshirt",
  aldea: "aldea-classic-tshirt",
  "buenos-aires": "remera-clasica-mujer",
  bahamas: "remera-crop-mujer",
  bali: "musculosa-bali",
}

export const MODELS: B2BModel[] = [
  {
    id: "berlin",
    name: "Berlin",
    subtitle: "Buzo Cuello Redondo (Crewneck)",
    category: "Buzos",
    fabric: "Algodon frizado premium 100%",
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    measurementsChart: "/products/size-charts/crewneck.png",
    prices: { partner: 32200, starter: 31200, pro: 30200, drop: 29200, bulk: 28200 },
    colors: [
      {
        name: "Negro",
        swatch: "#111111",
        images: [
          "/products/buzo-cuello-redondo-unisex-negro-estilo-oversize/mockups nuevos productos-8.png",
          "/products/buzo-cuello-redondo-unisex-negro-estilo-oversize/back.jpeg",
          "/products/buzo-cuello-redondo-unisex-negro-estilo-oversize/Buzo_Cuello_Redondo_Negro_Mujer_Lifestyle.png",
        ],
      },
      {
        name: "Blanco",
        swatch: "#f5f5f0",
        images: [
          "/products/buzo-cuello-redondo-unisex-blanco-estilo-oversize/mockups nuevos productos-9.png",
          "/products/buzo-cuello-redondo-unisex-blanco-estilo-oversize/Buzo_Cuello_Redondo_Blanco_Mujer_Lifestyle.png",
        ],
      },
      {
        name: "Stone Wash",
        swatch: "#9b9588",
        images: [
          "/products/buzo-cuello-redondo-unisex-stone-wash-friza-premium-estilo-oversize/mockups nuevos productos-10.png",
          "/products/buzo-cuello-redondo-unisex-stone-wash-friza-premium-estilo-oversize/back.jpeg",
          "/products/buzo-cuello-redondo-unisex-stone-wash-friza-premium-estilo-oversize/Buzo_Cuello_Redondo_Blanco_Mujer_Lifestyle.png",
        ],
      },
    ],
  },
  {
    id: "boston",
    name: "Boston",
    subtitle: "Buzo Hoodie Unisex Oversize",
    category: "Hoodies",
    fabric: "Algodon frizado premium 100%, capucha y bolsillo canguro",
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    measurementsChart: "/products/size-charts/hoodie.png",
    prices: { partner: 38700, starter: 36600, pro: 34500, drop: 32400, bulk: 30300 },
    colors: [
      {
        name: "Negro",
        swatch: "#111111",
        images: [
          "/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png",
          "/products/buzo-hoddie-unisex-negro/back.jpeg",
          "/products/buzo-hoddie-unisex-negro/Buzo_Unisex_Studio.png",
          "/products/buzo-hoddie-unisex-negro/Buzo_Hoodie_Negro_Hombre_Lifestyle.png",
        ],
      },
      {
        name: "Blanco",
        swatch: "#f5f5f0",
        images: [
          "/products/buzo-hoddie-unisex-blanco/mockups nuevos productos-11.png",
          "/products/buzo-hoddie-unisex-blanco/Buzo_Unisex_Studio.png",
        ],
      },
      {
        name: "Stone Wash",
        swatch: "#9b9588",
        images: [
          "/products/buzo-hoddie-unisex-stone-wash/mockups nuevos productos-13.png",
          "/products/buzo-hoddie-unisex-stone-wash/back.jpeg",
          "/products/buzo-hoddie-unisex-stone-wash/Buzo_Unisex_Studio.png",
          "/products/buzo-hoddie-unisex-stone-wash/Buzo_Hoodie_Negro_Hombre_Lifestyle.png",
        ],
      },
    ],
  },
  {
    id: "aura",
    name: "Aura",
    subtitle: "Oversize T-Shirt Unisex",
    category: "T-Shirts",
    fabric: "Algodon peinado 100% premium, fibra larga",
    sizes: ["2XS", "XS", "S", "M", "L", "XL", "2XL"],
    measurementsChart: "/products/size-charts/over.png",
    prices: { partner: 25400, starter: 24700, pro: 24000, drop: 24400, bulk: 24400 },
    colors: [
      {
        name: "Blanco",
        swatch: "#f5f5f0",
        images: [
          "/products/aura-tshirt-blanco-front.jpeg",
          "/products/tshirt-blanca-lifestyle-1.jpeg",
          "/products/tshirt-blanca-lifestyle-2.jpeg",
        ],
      },
      {
        name: "Negro",
        swatch: "#111111",
        images: [
          "/products/aura-tshirt-negro-front.jpeg",
          "/products/tshirt-negra-lifestyle-1.jpeg",
          "/products/tshirt-negra-lifestyle-2.jpeg",
        ],
      },
      {
        name: "Stone Wash",
        swatch: "#9b9588",
        images: [
          "/products/aura-oversize-tshirt-stone-wash/main.png",
          "/products/aura-oversize-tshirt-stone-wash/back.jpeg",
          "/products/aura-oversize-tshirt-stone-wash/lifestyle1.jpg",
          "/products/aura-oversize-tshirt-stone-wash/lifestyle2.jpg",
        ],
      },
    ],
  },
  {
    id: "aldea",
    name: "Aldea",
    subtitle: "Classic Fit T-Shirt",
    category: "T-Shirts",
    fabric: "Algodon 100% de alta densidad, calce regular",
    sizes: ["S", "M", "L", "XL", "XXL"],
    measurementsChart: "/products/tshirt-aldea-negro-medidas.png",
    prices: { partner: 25700, starter: 24700, pro: 23700, drop: 22700, bulk: 23600 },
    colors: [
      {
        name: "Negro",
        swatch: "#111111",
        images: [
          "/products/tshirt-aldea-negro-front.jpeg",
          "/products/tshirt-aldea-negro-lifestyle-1.jpeg",
          "/products/tshirt-aldea-negro-lifestyle-2.jpeg",
        ],
      },
      {
        name: "Blanco",
        swatch: "#f5f5f0",
        images: [
          "/products/tshirt-aldea-blanco-front.jpeg",
          "/products/tshirt-aldea-blanco-lifestyle-1.jpeg",
          "/products/tshirt-aldea-blanco-lifestyle-2.jpeg",
        ],
      },
    ],
  },
  {
    id: "buenos-aires",
    name: "Buenos Aires",
    subtitle: "Remera Clasica Mujer",
    category: "Remeras Mujer",
    fabric: "Algodon suave premium, corte femenino",
    sizes: ["S", "M", "L", "XL", "2XL"],
    measurementsChart: "/products/remera-clasica-woman-blanca/Medidas2.png",
    prices: { partner: 25700, starter: 24700, pro: 23700, drop: 22700, bulk: 23600 },
    colors: [
      {
        name: "Blanca",
        swatch: "#f5f5f0",
        images: [
          "/products/remera-clasica-woman-blanca/mockups nuevos productos-2.png",
          "/products/remera-clasica-woman-blanca/back.jpeg",
          "/products/remera-clasica-woman-blanca/Remera_Woman_Urban.jpeg",
        ],
      },
      {
        name: "Negra",
        swatch: "#111111",
        images: [
          "/products/remera-clasica-woman-negra/mockups nuevos productos-3.png",
          "/products/remera-clasica-woman-negra/back.jpeg",
          "/products/remera-clasica-woman-negra/Remera_Woman_Urban.jpeg",
        ],
      },
    ],
  },
  {
    id: "bahamas",
    name: "Bahamas",
    subtitle: "Remera Crop Mujer",
    category: "Remeras Crop",
    fabric: "Algodon suave, calce relajado y moderno",
    sizes: ["S", "M", "L", "XL", "2XL"],
    measurementsChart: "/products/remera-crop-de-mujer-negra/Medidas1.png",
    prices: { partner: 19300, starter: 18800, pro: 18200, drop: 18800, bulk: 18800 },
    colors: [
      {
        name: "Negra",
        swatch: "#111111",
        images: [
          "/products/remera-crop-de-mujer-negra/mockups nuevos productos-4.png",
          "/products/remera-crop-de-mujer-negra/back.jpeg",
          "/products/remera-crop-de-mujer-negra/crop-lifestyle.png",
          "/products/remera-crop-de-mujer-negra/crop-urban.png",
        ],
      },
      {
        name: "Chocolate",
        swatch: "#5a3a2a",
        images: [
          "/products/remera-crop-de-mujer-chocolate/mockups nuevos productos-5.png",
          "/products/remera-crop-de-mujer-chocolate/back.jpeg",
          "/products/remera-crop-de-mujer-chocolate/crop-lifestyle.png",
          "/products/remera-crop-de-mujer-chocolate/crop-urban.png",
        ],
      },
      {
        name: "Gris Melange",
        swatch: "#9a9a9a",
        images: [
          "/products/remera-crop-de-mujer-gris/mockups nuevos productos-6.png",
          "/products/remera-crop-de-mujer-gris/back.jpeg",
          "/products/remera-crop-de-mujer-gris/crop-lifestyle.png",
          "/products/remera-crop-de-mujer-gris/crop-urban.png",
        ],
      },
      {
        name: "Amarillo",
        swatch: "#f3d34a",
        images: [
          "/products/remera-crop-de-mujer-amarillo/mockups nuevos productos-7.png",
          "/products/remera-crop-de-mujer-amarillo/back.jpeg",
          "/products/remera-crop-de-mujer-amarillo/crop-lifestyle.png",
          "/products/remera-crop-de-mujer-amarillo/crop-urban.png",
        ],
      },
    ],
  },
  {
    id: "bali",
    name: "Bali",
    subtitle: "Musculosa",
    category: "Musculosas",
    fabric: "Morley premium elastico, ideal para verano",
    sizes: ["S", "M", "L", "XL", "2XL"],
    measurementsChart: "/products/musculosa-bali-blanca/Medidas3.png",
    prices: { partner: 19500, starter: 19400, pro: 19200, drop: 19000, bulk: 18800 },
    colors: [
      {
        name: "Blanca",
        swatch: "#f5f5f0",
        images: [
          "/products/musculosa-bali-blanca/Musculosa_Rib_Blanca.png",
          "/products/musculosa-bali-blanca/Musculosa_Rib_Blanca_Lifestyle.png",
          "/products/musculosa-bali-blanca/Musculosa_Urban.png",
        ],
      },
      {
        name: "Negra",
        swatch: "#111111",
        images: [
          "/products/musculosa-bali-negra/Musculosa_Rib_Negra.png",
          "/products/musculosa-bali-negra/Musculosa_Rib_Blanca_Lifestyle.png",
          "/products/musculosa-bali-negra/Musculosa_Urban.png",
        ],
      },
      {
        name: "Gris",
        swatch: "#9a9a9a",
        images: [
          "/products/musculosa-bali-gris/Musculosa_Rib_Gris.png",
          "/products/musculosa-bali-gris/Musculosa_Rib_Blanca_Lifestyle.png",
          "/products/musculosa-bali-gris/Musculosa_Urban.png",
        ],
      },
    ],
  },
]

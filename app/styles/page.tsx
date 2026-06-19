export const revalidate = 3600 // ISR: revalidate every hour

import type { Metadata } from "next"
import { StyleGallery } from "@/components/StyleGallery"

export const metadata: Metadata = {
  title: "37 Estilos Artísticos para diseño con IA — Galería de Estilos",
  description:
    "Explorá los 37 estilos artísticos de Novamente para diseñar tu ropa con IA: Watercolor, Pixel Art, Anime, Street Art, Pop Art, Minimalista, Cyberpunk, Art Deco y más. Cada estilo optimizado para estampado DTG textil.",
  openGraph: {
    title: "37 Estilos Artísticos — Novamente Design Engine",
    description: "Galería completa de estilos artísticos para diseño de indumentaria con inteligencia artificial.",
    url: "https://www.novamente.ar/styles",
  },
  twitter: {
    card: "summary_large_image",
    title: "37 Estilos Artísticos — Novamente Design Engine",
    description: "Galería completa de estilos artísticos para diseño de indumentaria con IA.",
  },
  alternates: { canonical: "https://www.novamente.ar/styles" },
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.novamente.ar/" },
    { "@type": "ListItem", position: 2, name: "Estilos", item: "https://www.novamente.ar/styles" },
  ],
}

const STYLE_NAMES = [
  "Watercolor", "Pixel Art", "Anime", "Street Art", "Pop Art", "Minimalista",
  "Cyberpunk", "Art Deco", "Neon", "Sketch", "Comic", "Graffiti",
  "Retro", "Gothic", "Tribal", "Surreal", "Abstract", "Geometric",
  "Vintage", "Psychedelic", "Steampunk", "Vaporwave", "Kawaii", "Fantasy",
  "Sci-Fi", "Nature", "Mandala", "Glitch", "Collage", "Calligraphy",
  "Oil Painting", "Stained Glass", "Woodcut", "Tattoo", "Cartoon", "Ukiyo-e",
  "Bauhaus",
]

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "37 Estilos Artísticos — Novamente Design Engine",
  description: "Galería completa de 37 estilos artísticos generados con IA para diseño de indumentaria personalizada.",
  url: "https://www.novamente.ar/styles",
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: 37,
    itemListElement: STYLE_NAMES.map((name, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      url: `https://www.novamente.ar/crear?style=${encodeURIComponent(name.toLowerCase())}`,
    })),
  },
}

export default function StylesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <div className="text-center mb-12">
        <h1 className="novamente-heading text-4xl md:text-5xl mb-4">GALERÍA DE ESTILOS</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
          Explorá nuestra colección completa de 37 estilos artísticos generados con inteligencia artificial.
          Cada estilo está optimizado para estampado DTG textil e inspira creaciones únicas para tu ropa personalizada.
        </p>
      </div>

      <StyleGallery directToCustomization={true} />
    </div>
  )
}

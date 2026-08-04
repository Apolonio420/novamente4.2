import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { getWhatsAppLink, INTERNAL_LINKS } from "@/lib/config/links"

export const metadata: Metadata = {
  title: "Serie Malvinas — Las Malvinas son argentinas | Novamente",
  description:
    "Serie Malvinas de Novamente: remeras, buzos y hoodies diseñados y estampados en Argentina. Las Malvinas son argentinas. Pedí el tuyo por WhatsApp.",
  openGraph: {
    title: "Serie Malvinas — Las Malvinas son argentinas | Novamente",
    description:
      "Remeras, buzos y hoodies de la Serie Malvinas. Diseñada y estampada en Argentina. Las Malvinas son argentinas.",
    url: "https://www.novamente.ar/malvinas",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/marketing/malvinas/trapo-negra-lifestyle.jpg",
        width: 896,
        height: 1200,
        alt: "Las Malvinas son argentinas — Serie Malvinas Novamente, remera negra con bandera estampada",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Serie Malvinas — Las Malvinas son argentinas | Novamente",
    description:
      "Remeras, buzos y hoodies de la Serie Malvinas. Diseñada y estampada en Argentina.",
    images: ["https://www.novamente.ar/marketing/malvinas/trapo-negra-lifestyle.jpg"],
  },
  alternates: { canonical: "https://www.novamente.ar/malvinas" },
}

interface MalvinasDesign {
  slug: string
  /** slug del producto comprable en /malvinas/[slug] — lib/malvinas-products.ts */
  productSlug: string
  name: string
  garment: string
  blurb: string
  packshot: string
  lifestyle: string
  waText: string
  /** Labels de color disponibles — reflejan MALVINAS_PRODUCTS[].colors en lib/malvinas-products.ts */
  colors: string[]
}

const DESIGNS: MalvinasDesign[] = [
  {
    slug: "trapo-negra",
    productSlug: "trapo-negra",
    name: "El trapo",
    garment: "Remera negra",
    blurb: "La bandera que se vio en la cancha, estampada al frente.",
    packshot: "/marketing/malvinas/trapo-negra-packshot.jpg",
    lifestyle: "/marketing/malvinas/trapo-negra-lifestyle.jpg",
    waText:
      "Hola Novamente! Quiero la remera de la Serie Malvinas (trapo sobre negra). Me pasan info? (ref · NV-MALVINAS)",
    colors: ["Negra", "Stone wash"],
  },
  {
    slug: "tipografica-negra",
    productSlug: "tipografica-negra",
    name: "Tipográfica",
    garment: "Remera negra",
    blurb: "La frase, directa y sin vueltas.",
    packshot: "/marketing/malvinas/tipografica-negra-packshot.jpg",
    lifestyle: "/marketing/malvinas/tipografica-negra-lifestyle.jpg",
    waText:
      "Hola Novamente! Quiero la remera de la Serie Malvinas (tipográfica sobre negra). Me pasan info? (ref · NV-MALVINAS)",
    colors: ["Negra", "Blanca", "Stone wash"],
  },
  {
    slug: "badge-beige",
    productSlug: "badge-beige",
    name: "Escudo",
    garment: "Remera beige",
    blurb: "Sello circular con el mapa de las islas.",
    packshot: "/marketing/malvinas/badge-beige-packshot.jpg",
    lifestyle: "/marketing/malvinas/badge-beige-lifestyle.jpg",
    waText:
      "Hola Novamente! Quiero la remera de la Serie Malvinas (escudo sobre beige). Me pasan info? (ref · NV-MALVINAS)",
    colors: ["Beige", "Blanca", "Negra"],
  },
  {
    slug: "pincel-blanca",
    productSlug: "pincel-blanca",
    name: "Pincelada",
    garment: "Remera blanca",
    blurb: "Trazo suelto, en blanco y negro.",
    packshot: "/marketing/malvinas/pincel-blanca-packshot.jpg",
    lifestyle: "/marketing/malvinas/pincel-blanca-lifestyle.jpg",
    waText:
      "Hola Novamente! Quiero la remera de la Serie Malvinas (pincelada sobre blanca). Me pasan info? (ref · NV-MALVINAS)",
    colors: ["Blanca", "Negra", "Beige"],
  },
  {
    slug: "islas-minimal-blanca",
    productSlug: "islas-minimal-blanca",
    name: "Islas",
    garment: "Remera blanca",
    blurb: "Silueta minimalista de las islas.",
    packshot: "/marketing/malvinas/islas-minimal-blanca-packshot.jpg",
    lifestyle: "/marketing/malvinas/islas-minimal-blanca-lifestyle.jpg",
    waText:
      "Hola Novamente! Quiero la remera de la Serie Malvinas (islas minimalista sobre blanca). Me pasan info? (ref · NV-MALVINAS)",
    colors: ["Blanca", "Negra", "Beige"],
  },
  {
    slug: "bandera-hoodie",
    productSlug: "bandera-hoodie",
    name: "Bandera",
    garment: "Hoodie negro",
    blurb: "Celeste y blanca, al frente del hoodie.",
    packshot: "/marketing/malvinas/bandera-hoodie-packshot.jpg",
    lifestyle: "/marketing/malvinas/bandera-hoodie-lifestyle.jpg",
    waText:
      "Hola Novamente! Quiero el hoodie de la Serie Malvinas (bandera). Me pasan info? (ref · NV-MALVINAS)",
    colors: ["Negro", "Blanco", "Stone wash"],
  },
  {
    slug: "carta-nautica-buzo",
    productSlug: "carta-nautica-buzo",
    name: "Carta náutica",
    garment: "Buzo",
    blurb: "Mapa técnico de las islas, estilo carta de navegación.",
    packshot: "/marketing/malvinas/carta-nautica-buzo-packshot.jpg",
    lifestyle: "/marketing/malvinas/carta-nautica-buzo-lifestyle.jpg",
    waText:
      "Hola Novamente! Quiero el buzo de la Serie Malvinas (carta náutica). Me pasan info? (ref · NV-MALVINAS)",
    colors: ["Stone wash", "Negro", "Blanco"],
  },
]

interface MinimalVariant {
  label: string
  image: string
  /** slug del producto comprable en /malvinas/[slug] para ESTA variante puntual */
  productSlug: string
}

interface MinimalDesign {
  slug: string
  /** slug del producto "principal" (el que abre el botón Comprar) */
  productSlug: string
  name: string
  garment: string
  blurb: string
  hero: string
  heroAlt: string
  variants: MinimalVariant[]
  waText: string
}

const MINIMAL_DESIGNS: MinimalDesign[] = [
  {
    slug: "tres-estrellas",
    productSlug: "tres-estrellas",
    name: "Tres estrellas",
    garment: "Remera oversize",
    blurb: "Las islas y tres estrellas celestes, al frente. Minimalista y directo.",
    hero: "/marketing/malvinas/tresestrellas-lifestyle.jpg",
    heroAlt: "Tres Estrellas — remera oversize negra Serie Malvinas Novamente, foto lifestyle",
    variants: [
      { label: "Negra oversize", image: "/marketing/malvinas/tresestrellas-negra-packshot.jpg", productSlug: "tres-estrellas" },
      { label: "Blanca oversize", image: "/marketing/malvinas/tresestrellas-blanca-packshot.jpg", productSlug: "tres-estrellas" },
      { label: "Stone wash", image: "/marketing/malvinas/tresestrellas-stonewash-packshot.jpg", productSlug: "tres-estrellas" },
    ],
    waText:
      "Hola Novamente! Quiero la remera de la Colección Minimal (Tres Estrellas, negra oversize — también hay blanca y stone wash). Me pasan info? (ref · NV-MALVINAS-MINIMAL)",
  },
  {
    slug: "monograma",
    productSlug: "monograma",
    name: "Monograma 51°S 59°O",
    garment: "Remera clásica",
    blurb: "Islas chicas, una estrella y las coordenadas exactas de las Malvinas.",
    hero: "/marketing/malvinas/monograma-beige-packshot.jpg",
    heroAlt: "Monograma 51°S 59°O — remera beige Serie Malvinas Novamente, packshot",
    variants: [
      { label: "Beige", image: "/marketing/malvinas/monograma-beige-packshot.jpg", productSlug: "monograma" },
      { label: "Blanca clásica", image: "/marketing/malvinas/monograma-blanca-packshot.jpg", productSlug: "monograma" },
      { label: "Negra clásica", image: "/marketing/malvinas/monograma-negra-packshot.jpg", productSlug: "monograma" },
    ],
    waText:
      "Hola Novamente! Quiero la remera de la Colección Minimal (Monograma 51°S 59°O, beige — también hay blanca y negra). Me pasan info? (ref · NV-MALVINAS-MINIMAL)",
  },
  {
    slug: "horizonte",
    productSlug: "horizonte-buzo",
    name: "Horizonte",
    garment: "Buzo stone wash",
    blurb: "Las islas y el sol saliendo sobre la línea de horizonte.",
    hero: "/marketing/malvinas/horizonte-lifestyle.jpg",
    heroAlt: "Horizonte — buzo stone wash Serie Malvinas Novamente, foto lifestyle",
    variants: [
      { label: "Buzo stone wash", image: "/marketing/malvinas/horizonte-buzo-packshot.jpg", productSlug: "horizonte-buzo" },
      { label: "Hoodie negro", image: "/marketing/malvinas/horizonte-hoodie-packshot.jpg", productSlug: "horizonte-hoodie" },
    ],
    waText:
      "Hola Novamente! Quiero el buzo de la Colección Minimal (Horizonte, stone wash — también hay hoodie negro). Me pasan info? (ref · NV-MALVINAS-MINIMAL)",
  },
]

export default function MalvinasPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.novamente.ar" },
      { "@type": "ListItem", position: 2, name: "Serie Malvinas", item: "https://www.novamente.ar/malvinas" },
    ],
  }

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#08080b] px-4 py-16 md:py-20">
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
        <div className="container relative z-10 mx-auto grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-sky-200">
              Serie Malvinas
            </p>
            <h1 className="mb-6 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
              Las Malvinas son argentinas
            </h1>
            <p className="mb-4 text-lg md:text-xl text-white/70 max-w-xl">
              Serie Malvinas — diseñada y estampada en Argentina.
            </p>
            <p className="mb-10 text-base text-white/50 max-w-xl">
              La bandera que se vio en la cancha, ahora en remeras, buzos y hoodies. Diez diseños propios,
              producidos bajo demanda.
            </p>

            <div className="mb-8 flex flex-wrap gap-4">
              <a
                href="#disenos"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-zinc-950 transition hover:bg-zinc-100"
              >
                Ver los diseños
              </a>
              <Link
                href={INTERNAL_LINKS.generator}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-4 text-base font-medium text-white/80 transition hover:border-white/50 hover:text-white"
              >
                ¿Querés tu propia versión? Diseñala en el Studio
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] border border-white/10 bg-white/[0.03]" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
              <div className="relative aspect-[4/5] sm:aspect-[3/4]">
                <Image
                  src="/marketing/malvinas/trapo-negra-lifestyle.jpg"
                  alt="Las Malvinas son argentinas — remera negra Serie Malvinas, diseño trapo, foto lifestyle en Argentina"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de diseños */}
      <section id="disenos" className="scroll-mt-20 bg-[#08080b] px-4 py-16 md:py-20 border-t border-white/10">
        <div className="container mx-auto">
          <div className="mb-12 max-w-2xl">
            <h2 className="novamente-heading text-2xl md:text-3xl text-white mb-4">La serie</h2>
            <p className="text-white/60 text-base md:text-lg">
              Siete diseños propios de la Serie Malvinas. Cada uno estampado con DTG premium sobre algodón,
              bajo demanda.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DESIGNS.map((d) => (
              <div
                key={d.slug}
                className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"
              >
                <Link href={`/malvinas/${d.productSlug}`} className="grid grid-cols-2 gap-px bg-white/10">
                  <div className="relative aspect-[4/5] bg-zinc-950">
                    <Image
                      src={d.packshot}
                      alt={`${d.name} — ${d.garment} Serie Malvinas Novamente, packshot`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    />
                  </div>
                  <div className="relative aspect-[4/5] bg-zinc-950">
                    <Image
                      src={d.lifestyle}
                      alt={`${d.name} — ${d.garment} Serie Malvinas Novamente, foto lifestyle`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    />
                  </div>
                </Link>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-white">{d.name}</h3>
                  <p className="text-xs uppercase tracking-widest text-white/40 mt-1 mb-1">{d.garment}</p>
                  <p className="text-xs text-white/40 mb-3">{d.colors.join(" · ")}</p>
                  <p className="text-sm text-white/60 mb-4">{d.blurb}</p>
                  <Link
                    href={`/malvinas/${d.productSlug}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
                  >
                    Comprar
                  </Link>
                  <a
                    href={getWhatsAppLink(d.waText)}
                    target="_blank"
                    rel="noopener"
                    className="mt-2 inline-flex w-full items-center justify-center gap-1.5 text-xs text-white/40 transition hover:text-white/70"
                  >
                    ¿Dudas? Escribinos
                  </a>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-sm text-white/40 max-w-2xl">
            Remeras desde $28.600 · Buzos desde $43.000 · Hoodies desde $55.000. Elegí color y talle en cada
            producto y pagá online — o consultanos por WhatsApp si tenés dudas.
          </p>
        </div>
      </section>

      {/* Para tu pared — lienzo, mismo arte que "Carta náutica" */}
      <section className="bg-[#0c0c10] px-4 py-16 md:py-20 border-t border-white/10">
        <div className="container mx-auto">
          <div className="mb-10 max-w-2xl">
            <h2 className="novamente-heading text-2xl md:text-3xl text-white mb-4">Para tu pared</h2>
            <p className="text-white/60 text-base md:text-lg">
              El mismo mapa técnico de las islas del diseño &quot;Carta náutica&quot;, ahora en lienzo
              decorativo. Formato enrollado, listo para enmarcar o tensar.
            </p>
          </div>

          <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 sm:max-w-none">
            <Link href="/malvinas/lienzo-carta-nautica" className="grid grid-cols-2 gap-px bg-white/10">
              <div className="relative aspect-[4/5] bg-zinc-950">
                <Image
                  src="/marketing/malvinas/lienzo-carta-nautica-packshot.jpg"
                  alt="Carta Náutica — Lienzo, Serie Malvinas Novamente, foto de producto"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                />
              </div>
              <div className="relative aspect-[4/5] bg-zinc-950">
                <Image
                  src="/marketing/malvinas/lienzo-carta-nautica-lifestyle.jpg"
                  alt="Carta Náutica — Lienzo, Serie Malvinas Novamente, foto lifestyle en living"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                />
              </div>
            </Link>
            <div className="p-5">
              <h3 className="text-lg font-semibold text-white">Carta Náutica — Lienzo</h3>
              <p className="text-xs uppercase tracking-widest text-white/40 mt-1 mb-1">Lienzo decorativo</p>
              <p className="text-xs text-white/40 mb-3">20×30 cm · 35×40 cm · 40×50 cm — desde $34.000</p>
              <p className="text-sm text-white/60 mb-4">
                Mapa técnico de las islas, estilo carta de navegación — mismo diseño que el buzo, pensado para
                colgar en tu pared.
              </p>
              <Link
                href="/malvinas/lienzo-carta-nautica"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
              >
                Comprar
              </Link>
              <a
                href={getWhatsAppLink(
                  "Hola Novamente! Quiero el lienzo de la Serie Malvinas (carta náutica). Me pasan info? (ref · NV-MALVINAS-LIENZO)"
                )}
                target="_blank"
                rel="noopener"
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 text-xs text-white/40 transition hover:text-white/70"
              >
                ¿Dudas? Escribinos
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Colección Minimal */}
      <section className="bg-[#0c0c10] px-4 py-16 md:py-20 border-t border-white/10">
        <div className="container mx-auto">
          <div className="mb-12 max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-sky-200">
              Nueva
            </p>
            <h2 className="novamente-heading text-2xl md:text-3xl text-white mb-4">Colección Minimal</h2>
            <p className="text-white/60 text-base md:text-lg">
              Tres diseños nuevos, más chicos y más limpios. Misma bandera, otra actitud: estampado sutil,
              en varios colores por diseño.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MINIMAL_DESIGNS.map((d) => (
              <div
                key={d.slug}
                className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"
              >
                <Link href={`/malvinas/${d.productSlug}`} className="relative block aspect-[4/5] bg-zinc-950">
                  <Image
                    src={d.hero}
                    alt={d.heroAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </Link>

                <div
                  className={`grid gap-px bg-white/10 ${
                    d.variants.length === 2 ? "grid-cols-2" : "grid-cols-3"
                  }`}
                >
                  {d.variants.map((v) => (
                    <Link
                      key={v.label}
                      href={`/malvinas/${v.productSlug}`}
                      className="relative block aspect-square bg-zinc-950"
                      title={`Comprar — ${v.label}`}
                    >
                      <Image
                        src={v.image}
                        alt={`${d.name} — ${v.label}, Colección Minimal Novamente`}
                        fill
                        className="object-cover transition hover:opacity-80"
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 16vw, 11vw"
                      />
                    </Link>
                  ))}
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-semibold text-white">{d.name}</h3>
                  <p className="text-xs uppercase tracking-widest text-white/40 mt-1 mb-1">{d.garment}</p>
                  <p className="text-xs text-white/40 mb-3">
                    {d.variants.map((v) => v.label).join(" · ")}
                  </p>
                  <p className="text-sm text-white/60 mb-4">{d.blurb}</p>
                  <Link
                    href={`/malvinas/${d.productSlug}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
                  >
                    Comprar
                  </Link>
                  <a
                    href={getWhatsAppLink(d.waText)}
                    target="_blank"
                    rel="noopener"
                    className="mt-2 inline-flex w-full items-center justify-center gap-1.5 text-xs text-white/40 transition hover:text-white/70"
                  >
                    ¿Dudas? Escribinos
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section className="bg-[#0c0c10] px-4 py-16 md:py-20 border-t border-white/10">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="novamente-heading text-2xl md:text-3xl text-white mb-4">
            Las Malvinas son argentinas
          </h2>
          <p className="text-white/60 mb-8">
            Serie Malvinas — diseñada y estampada en Argentina. Elegí tu diseño, color y talle, y comprá
            directo desde la web.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#disenos"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-zinc-950 transition hover:bg-zinc-100"
            >
              Ver los diseños y comprar
            </a>
            <Link
              href={INTERNAL_LINKS.generator}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-4 text-base font-medium text-white/80 transition hover:border-white/50 hover:text-white"
            >
              Diseñá tu propia versión en el Studio
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

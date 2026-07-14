import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Merch para Empresas y Equipos | Novamente",
  description:
    "Prendas premium estampadas para equipos, eventos, onboarding y regalos corporativos. Producción propia en Vicente López, DTG full color, sin mínimos y propuesta en el día.",
  keywords: [
    "merch para empresas",
    "merchandising corporativo",
    "remeras para empresas",
    "regalos corporativos",
    "onboarding empresas",
    "uniformes personalizados",
  ],
  alternates: { canonical: "https://www.novamente.ar/empresas" },
  openGraph: {
    title: "Merch que tu equipo quiere usar | Novamente Empresas",
    description:
      "Prendas premium estampadas para equipos, eventos, onboarding y regalos corporativos. Propuesta con mockups en el día.",
    url: "https://www.novamente.ar/empresas",
    type: "website",
    images: [
      {
        url: "https://www.novamente.ar/marketing/lifestyle/hero-subte-cinematic.webp",
        width: 1600,
        height: 900,
        alt: "Merch premium para empresas de Novamente",
      },
    ],
  },
}

const whatsappHref =
  "https://wa.me/5492235169720?text=Hola%20Novamente%2C%20quiero%20una%20propuesta%20de%20merch%20para%20mi%20empresa."

const benefits = [
  ["Producción propia", "Algodón peinado y prendas premium hechas en Vicente López."],
  ["DTG full color", "Tu logo, ilustraciones y gradientes con estampa incluida."],
  ["Sin mínimos", "Desde una muestra hasta campañas y equipos completos."],
  ["Propuesta en el día", "Mockups fotorrealistas antes de producir."],
  ["Factura A o B", "Condiciones claras y facturación para empresas."],
  ["Envíos a todo el país", "A una oficina o directo a cada persona del equipo."],
]

const useCases = [
  ["Sorteos y giveaways", "Algo que se usa, no algo que termina guardado."],
  ["Eventos y activaciones", "Staff identificado y asistentes que se llevan la marca puesta."],
  ["Onboarding kits", "El primer día del equipo, con una prenda que da ganas de usar."],
  ["Fin de año y regalos", "Un regalo corporativo con calidad que se nota al tacto."],
  ["Family day", "Modelos y talles para incluir a toda la familia."],
  ["Uniformes y reposición", "Pedí sólo lo que necesitás, cuando lo necesitás."],
]

const products = [
  {
    name: "Boston",
    detail: "Hoodie unisex · 300 g/m²",
    image: "/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png",
  },
  {
    name: "Berlin",
    detail: "Buzo cuello redondo · 300 g/m²",
    image: "/products/buzo-cuello-redondo-unisex-negro-estilo-oversize/mockups nuevos productos-8.png",
  },
  {
    name: "Aura",
    detail: "Remera oversize unisex · 250 g/m²",
    image: "/products/aura-tshirt-negro-front.jpeg",
  },
  {
    name: "Aldea Classic Fit",
    detail: "Remera regular unisex · 250 g/m²",
    image: "/products/tshirt-aldea-negro-front.jpeg",
  },
  {
    name: "Buenos Aires",
    detail: "Remera clásica de mujer · 250 g/m²",
    image: "/products/remera-clasica-woman-blanca/mockups nuevos productos-2.png",
  },
  {
    name: "Bahamas",
    detail: "Remera crop de mujer · 150 g/m²",
    image: "/products/remera-crop-de-mujer-amarillo/mockups nuevos productos-7.png",
  },
  {
    name: "Bali",
    detail: "Musculosa de mujer · 150 g/m²",
    image: "/products/musculosa-bali-negra/Musculosa_Rib_Negra.png",
  },
  {
    name: "Bambino",
    detail: "Remera infantil unisex · talles 4 al 16",
    image: "/products/remera-infantil-negro/front.jpg",
  },
  {
    name: "Bahía",
    detail: "Totebag de algodón",
    image: "/products/totebag-crudo/front.jpg",
  },
]

const process = [
  ["01", "Contanos qué necesitás", "El uso, la cantidad estimada y la fecha."],
  ["02", "Te mostramos cómo queda", "Armamos mockups de tu logo antes de producir."],
  ["03", "Aprobás con seguridad", "Podés pedir una muestra física antes de escalar."],
  ["04", "Producimos y enviamos", "24-48 h hábiles en pedidos simples; coordinamos tandas grandes."],
]

export default function EmpresasPage() {
  return (
    <main className="bg-[#f5f0e6] text-[#211e1a]">
      <section className="overflow-hidden border-b border-[#ded3c2] bg-[#211e1a] text-[#f9f5eb]">
        <div className="container grid min-h-[650px] items-center gap-10 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-[#d0a34d]">Novamente Empresas</p>
            <h1 className="novamente-heading max-w-xl text-5xl leading-[0.96] sm:text-6xl lg:text-7xl">
              Merch que tu equipo quiere usar.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#d8d0c3] sm:text-xl">
              Prendas premium estampadas para eventos, onboarding, regalos corporativos y equipos que quieren verse bien.
            </p>
            <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-[#f5f0e6]">
              {["Producción propia", "DTG full color", "Sin mínimos"].map((item) => (
                <span key={item} className="rounded-full border border-[#786743] px-3 py-2">{item}</span>
              ))}
            </div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="rounded-full bg-[#d0a34d] px-6 py-3 text-center text-sm font-bold text-[#211e1a] transition hover:bg-[#e0b761]">
                Pedir propuesta por WhatsApp
              </a>
              <a href="#catalogo" className="rounded-full border border-[#766c5d] px-6 py-3 text-center text-sm font-semibold text-[#f9f5eb] transition hover:border-[#f9f5eb]">
                Ver prendas
              </a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute inset-8 rounded-full bg-[#c99d4c]/20 blur-3xl" />
            <div className="relative grid grid-cols-2 gap-4">
              <div className="mt-16 overflow-hidden rounded-[2rem] bg-[#e9e4db] p-4 shadow-2xl shadow-black/30">
                <Image src="/products/aura-tshirt-negro-front.jpeg" alt="Remera Aura negra personalizada" width={640} height={640} className="aspect-square w-full object-cover" priority />
              </div>
              <div className="overflow-hidden rounded-[2rem] bg-[#e9e4db] p-4 shadow-2xl shadow-black/30">
                <Image src="/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png" alt="Hoodie Boston negro personalizado" width={640} height={640} className="aspect-square w-full object-cover" priority />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a97d31]">Por qué Novamente</p>
          <h2 className="novamente-heading mt-3 text-4xl leading-tight sm:text-5xl">Calidad que se nota antes de que la usen.</h2>
        </div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[#dfd4c2] bg-[#dfd4c2] sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(([title, description]) => (
            <div key={title} className="bg-[#fbf8f1] p-6 sm:p-7">
              <span className="mb-5 block h-3 w-3 bg-[#b5893e]" />
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6e665b]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[#ded3c2] bg-[#ede5d7] py-16 md:py-24">
        <div className="container">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a97d31]">Para cada momento</p>
              <h2 className="novamente-heading mt-3 text-4xl leading-tight sm:text-5xl">Una prenda bien hecha trabaja para tu marca todo el año.</h2>
            </div>
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#6e4e16] underline underline-offset-4">Contanos qué estás planeando</a>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {useCases.map(([title, description], index) => (
              <article key={title} className="rounded-2xl border border-[#d9cdbb] bg-[#fbf8f1] p-6">
                <p className="text-xs font-bold tracking-[0.2em] text-[#b5893e]">0{index + 1}</p>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6e665b]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="catalogo" className="container scroll-mt-24 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a97d31]">Catálogo visual</p>
          <h2 className="novamente-heading mt-3 text-4xl leading-tight sm:text-5xl">Nueve modelos. Un estándar de calidad.</h2>
          <p className="mt-4 text-base leading-relaxed text-[#6e665b]">Elegí una base o combiná modelos. Te recomendamos el mix según el objetivo y el presupuesto del pedido.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.name} className="group overflow-hidden rounded-2xl border border-[#ded3c2] bg-[#fbf8f1]">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#e8e4dc]">
                <Image src={product.image} alt={`${product.name} — ${product.detail}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <h3 className="novamente-heading text-2xl">{product.name}</h3>
                <p className="mt-1 text-sm text-[#6e665b]">{product.detail}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-[#6e665b]">La tarifa depende del volumen y del mix de prendas. Pedinos una propuesta clara, con mockups y tiempos, antes de confirmar.</p>
      </section>

      <section className="border-y border-[#ded3c2] bg-[#fbf8f1] py-16 md:py-24">
        <div className="container grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a97d31]">Cómo trabajamos</p>
            <h2 className="novamente-heading mt-3 text-4xl leading-tight sm:text-5xl">De la idea a la prenda puesta.</h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[#6e665b]">Sin planillas eternas ni sorpresas al abrir la caja. Primero ves el resultado; después lo producimos.</p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {process.map(([number, title, detail]) => (
              <li key={number} className="rounded-2xl border border-[#dfd4c2] p-6">
                <p className="text-sm font-bold tracking-[0.16em] text-[#b5893e]">{number}</p>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6e665b]">{detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#211e1a] py-16 text-[#f9f5eb] md:py-24">
        <div className="container text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#d0a34d]">Novamente Empresas</p>
          <h2 className="novamente-heading mx-auto mt-4 max-w-3xl text-4xl leading-tight sm:text-5xl">¿Armamos el primero?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#d8d0c3]">Escribinos y te mandamos una propuesta con mockups de tu logo, tiempos y alternativas de prendas.</p>
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="mt-8 inline-flex rounded-full bg-[#d0a34d] px-7 py-3 text-sm font-bold text-[#211e1a] transition hover:bg-[#e0b761]">Hablar con Novamente</a>
          <p className="mt-5 text-sm text-[#c7bcaa]">+54 9 2235 16-9720 · Vicente López, Buenos Aires</p>
          <Link href="/regalos-empresariales" className="mt-6 inline-block text-sm font-semibold text-[#d0a34d] underline underline-offset-4">También buscás regalos empresariales puntuales →</Link>
        </div>
      </section>
    </main>
  )
}

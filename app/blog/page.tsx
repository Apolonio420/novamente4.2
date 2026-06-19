import type { Metadata } from "next"
import Link from "next/link"
import { BLOG_POSTS } from "@/lib/blog/posts"

export const metadata: Metadata = {
  title: "Blog Novamente — Guías de DTG, merch y ropa personalizada con IA",
  description:
    "Aprendé sobre estampado DTG premium, lanzamiento de tu propia marca de ropa, comparación de técnicas de impresión y todo lo que tenés que saber para producir merch personalizado en Argentina.",
  alternates: { canonical: "https://www.novamente.ar/blog" },
  openGraph: {
    title: "Blog Novamente — Guías de DTG y merch personalizado en Argentina",
    description:
      "Guías técnicas y de negocio para emprendedores, marcas y creadores que producen indumentaria personalizada con IA.",
    url: "https://www.novamente.ar/blog",
    siteName: "Novamente",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog Novamente — Guías de DTG y merch personalizado",
    description:
      "Recursos prácticos para producir y vender ropa personalizada en Argentina.",
  },
}

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "@id": "https://www.novamente.ar/blog#blog",
  name: "Blog Novamente",
  description:
    "Guías de DTG, lanzamiento de marcas, merch personalizado y producción bajo demanda en Argentina.",
  url: "https://www.novamente.ar/blog",
  publisher: {
    "@type": "Organization",
    "@id": "https://www.novamente.ar/#organization",
    name: "Novamente",
    url: "https://www.novamente.ar",
  },
  blogPost: BLOG_POSTS.map((p) => ({
    "@type": "BlogPosting",
    headline: p.title,
    description: p.description,
    url: `https://www.novamente.ar/blog/${p.slug}`,
    datePublished: p.date,
    author: { "@type": "Organization", name: "Novamente" },
  })),
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.novamente.ar/" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.novamente.ar/blog" },
  ],
}

export default function BlogIndex() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className="nv-page">
        <div className="nv-container">
          <header className="mb-12">
            <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500">Recursos · Novamente</p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Cómo se hace el merch que querés vender
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-zinc-300">
              Guías técnicas y de negocio para producir y vender indumentaria personalizada en Argentina.
              DTG, IA, branding y operaciones — todo lo que aprendimos haciendo prendas para emprendedores y marcas.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            {BLOG_POSTS.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="nv-card nv-card-hover group p-6"
              >
                <div className="mb-3 flex items-center gap-3 text-xs">
                  <span className="rounded-full bg-zinc-800 px-3 py-1 font-semibold uppercase tracking-wider text-zinc-300">
                    {p.category}
                  </span>
                  <span className="text-zinc-500">{p.readingTime} de lectura</span>
                </div>
                <h2 className="text-xl font-bold leading-snug text-zinc-100 group-hover:text-white md:text-2xl">
                  {p.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{p.description}</p>
                <p className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-zinc-200">
                  Leer la guía →
                </p>
              </Link>
            ))}
          </div>

          <section className="nv-card mt-20 p-8 md:p-12">
            <p className="text-xs uppercase tracking-widest text-zinc-500">¿Listo?</p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">Pasá de la guía a la prenda</h2>
            <p className="mt-3 max-w-2xl text-zinc-300">
              Diseñá la tuya con IA en minutos o cotizá una producción para tu marca. Producimos en Argentina,
              sin stock muerto.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/crear"
                className="nv-cta-primary"
              >
                Diseñá la tuya con IA →
              </Link>
              <Link
                href="/cotizador"
                className="nv-cta-secondary"
              >
                Cotizá producción
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

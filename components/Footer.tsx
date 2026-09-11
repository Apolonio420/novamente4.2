import Link from "next/link"
import { Instagram, Twitter, Facebook } from "lucide-react"

const SOLUTIONS = {
  "Diseño & catálogo": [
    { href: "/crear", label: "Diseñá tu remera con IA" },
    { href: "/cotizador", label: "Cotizar producción" },
    { href: "/products", label: "Productos" },
    { href: "/styles", label: "37 estilos artísticos" },
    { href: "/comparar", label: "Comparar prendas" },
  ],
  "Para tu marca (B2B)": [
    { href: "/partners", label: "Novamente Studio" },
    { href: "/merch", label: "Marcas en Novamente" },
    { href: "/lanza-tu-marca", label: "Lanzá tu marca sin stock" },
    { href: "/uniformes-personalizados", label: "Uniformes personalizados" },
    { href: "/regalos-empresariales", label: "Regalos empresariales" },
    { href: "/empresas", label: "Empresas y equipos" },
    { href: "/remeras-por-mayor", label: "Remeras por mayor" },
  ],
  "Eventos & regalos": [
    { href: "/buzos-egresados", label: "Buzos de egresados" },
    { href: "/despedidas-personalizadas", label: "Despedidas personalizadas" },
    { href: "/remeras-cumpleanos", label: "Remeras de cumpleaños" },
    { href: "/remeras-para-eventos", label: "Remeras para eventos" },
    { href: "/regalos-personalizados", label: "Regalos personalizados" },
    { href: "/regalos-dia-del-padre", label: "Regalos día del padre" },
  ],
  "Productos & nichos": [
    { href: "/remeras-personalizadas", label: "Remeras personalizadas" },
    { href: "/buzos-personalizados", label: "Buzos personalizados" },
    { href: "/hoodie-personalizado", label: "Hoodies personalizados" },
    { href: "/indumentaria-deportiva", label: "Indumentaria deportiva" },
    { href: "/merchs", label: "Merch para vender" },
    { href: "/merch-para-bandas", label: "Merch para bandas y artistas" },
    { href: "/merch-para-creadores", label: "Merch para creadores" },
  ],
  "Recursos & técnica": [
    { href: "/blog", label: "Blog" },
    { href: "/faq", label: "Preguntas frecuentes" },
    { href: "/ayuda", label: "Mesa de Ayuda" },
    { href: "/dtg-vs-serigrafia", label: "DTG vs serigrafía" },
    { href: "/estampar-remeras", label: "Cómo estampamos" },
    { href: "/guia-estampado", label: "Guía de estampado" },
    { href: "/envios", label: "Envíos y devoluciones" },
    { href: "https://whatsapp.com/channel/0029VbDvBF95PO0sira0YT2R", label: "Canal de WhatsApp 🧵" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-novamente-black">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5 md:gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="novamente-gradient-text font-bold text-xl tracking-[0.2em]">
              Novamente
            </Link>
            <p className="mt-4 max-w-md text-sm text-white/60">
              Indumentaria personalizada con inteligencia artificial.
              Diseñá tu prenda en minutos, producimos bajo demanda en Argentina.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/crear"
                className="inline-flex items-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
              >
                Diseñá la tuya →
              </Link>
              <Link
                href="/studio"
                className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
              >
                Para marcas
              </Link>
            </div>

            <div className="mt-6 flex space-x-4">
              <Link
                href="https://www.instagram.com/novamente.ar/"
                target="_blank"
                aria-label="Instagram"
                className="text-white/60 hover:text-white"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://x.com/Novamentear"
                target="_blank"
                aria-label="X / Twitter"
                className="text-white/60 hover:text-white"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.facebook.com/share/1CevJ8w7hK/?mibextid=wwXIfr"
                target="_blank"
                aria-label="Facebook"
                className="text-white/60 hover:text-white"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://whatsapp.com/channel/0029VbDvBF95PO0sira0YT2R"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Canal de WhatsApp"
                title="Canal oficial de WhatsApp"
                className="text-white/60 hover:text-white"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </Link>
            </div>
            <p className="mt-4 text-sm text-white/60">
              Email:{" "}
              <a href="mailto:contact@novamente.ar" className="hover:text-white underline">
                contact@novamente.ar
              </a>
            </p>
          </div>

          <div className="md:col-span-3 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/80">
                Empezar
              </h3>
              <ul className="space-y-2.5 text-sm">
                {SOLUTIONS["Diseño & catálogo"].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/60 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/80">
                Para tu marca
              </h3>
              <ul className="space-y-2.5 text-sm">
                {SOLUTIONS["Para tu marca (B2B)"].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/60 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/80">
                Eventos & regalos
              </h3>
              <ul className="space-y-2.5 text-sm">
                {SOLUTIONS["Eventos & regalos"].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/60 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/80">
                Productos
              </h3>
              <ul className="space-y-2.5 text-sm">
                {SOLUTIONS["Productos & nichos"].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/60 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/80">
                Recursos
              </h3>
              <ul className="space-y-2.5 text-sm">
                {SOLUTIONS["Recursos & técnica"].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/60 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/80">
                Legal
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/terminos" className="text-white/60 hover:text-white">
                    Términos y condiciones
                  </Link>
                </li>
                <li>
                  <Link href="/privacidad" className="text-white/60 hover:text-white">
                    Política de privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/nosotros" className="text-white/60 hover:text-white">
                    Nosotros
                  </Link>
                </li>
                <li>
                  <Link
                    href="/arrepentimiento"
                    className="font-medium text-amber-400 hover:text-amber-300"
                  >
                    Botón de arrepentimiento
                  </Link>
                </li>
                <li>
                  <a
                    href="https://autogestion.produccion.gob.ar/consumidores"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white"
                  >
                    Defensa del consumidor
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-white/40">
          <p>
            © {new Date().getFullYear()} Novamente — CUIT 20-40207637-3 · Villa Martelli, Buenos Aires.
            Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

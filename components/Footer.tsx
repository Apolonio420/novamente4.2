import Link from "next/link"
import { Instagram, Twitter, Facebook } from "lucide-react"

const SOLUTIONS = {
  "Diseño & catálogo": [
    { href: "/design", label: "Diseñá tu remera con IA" },
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
    { href: "/dtg-vs-serigrafia", label: "DTG vs serigrafía" },
    { href: "/estampar-remeras", label: "Cómo estampamos" },
    { href: "/guia-estampado", label: "Guía de estampado" },
    { href: "/envios", label: "Envíos y devoluciones" },
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
                href="/design"
                className="inline-flex items-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
              >
                Diseñá la tuya →
              </Link>
              <Link
                href="/partners"
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

import Link from "next/link"
import { Instagram, Twitter, Facebook } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-novamente-black">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="font-bold text-xl tracking-[0.2em] novamente-gradient-text">
              NOVAMENTE
            </Link>
            <p className="mt-4 text-sm text-white/60 max-w-md">
              Novamente combina diseño impulsado por IA con prendas de alta calidad para ayudarte a crear ropa única y
              personalizada que expresa tu imaginación.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 uppercase tracking-wider text-white/80">Enlaces</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="text-white/60 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/styles" className="text-white/60 hover:text-white">
                  Estilos
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-white/60 hover:text-white">
                  Productos
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-white/60 hover:text-white">
                  Carrito
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 uppercase tracking-wider text-white/80">Contacto</h3>
            <div className="flex space-x-4 mb-4">
              <Link
                href="https://www.instagram.com/novamente.ar/"
                target="_blank"
                className="text-white/60 hover:text-white"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="https://x.com/Novamentear" target="_blank" className="text-white/60 hover:text-white">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.facebook.com/share/1CevJ8w7hK/?mibextid=wwXIfr"
                target="_blank"
                className="text-white/60 hover:text-white"
              >
                <Facebook className="h-5 w-5" />
              </Link>
            </div>
            <p className="text-sm text-white/60">
              Email:{" "}
              <a href="mailto:contact@novamente.ar" className="hover:text-white underline">
                contact@novamente.ar
              </a>
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 text-center text-sm text-white/40">
          <p>© {new Date().getFullYear()} Novamente. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

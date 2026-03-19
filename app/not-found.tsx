import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-lg">
        <div className="relative">
          <h1 className="text-[10rem] md:text-[14rem] font-black leading-none bg-gradient-to-b from-white/20 to-transparent bg-clip-text text-transparent select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-2xl md:text-3xl font-bold text-white">
              Página no encontrada
            </p>
          </div>
        </div>

        <p className="text-zinc-400 text-lg">
          La página que buscás no existe o fue movida.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
          >
            Volver al inicio
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-zinc-700 text-zinc-300 font-semibold hover:border-zinc-500 hover:text-white transition-colors"
          >
            Ver productos
          </Link>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { ChevronDown, HelpCircle } from 'lucide-react'
import VideoCard from '@/components/ayuda/VideoCard'

interface FaqItem {
  question: string
  answer: React.ReactNode
  video?: {
    src: string
    poster: string
    preview: string
    title: string
    duration: string
  }
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: '¿Cómo creo un producto con el Studio?',
    video: {
      src: '/ayuda/studio.mp4',
      poster: '/ayuda/studio-poster.jpg',
      preview: '/ayuda/studio-preview.mp4',
      title: 'Recorrido por el Studio',
      duration: '0:51',
    },
    answer: (
      <>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>Abrí el Studio desde el menú lateral.</li>
          <li>Describí el diseño que querés (o subí tu propio arte).</li>
          <li>Aplicá el diseño generado a la prenda que elijas.</li>
          <li>Tocá &quot;Agregar al catálogo&quot; para publicarlo en tu tienda.</li>
        </ol>
      </>
    ),
  },
  {
    question: '¿Cómo publico y edito los productos de mi catálogo?',
    video: {
      src: '/ayuda/catalog.mp4',
      poster: '/ayuda/catalog-poster.jpg',
      preview: '/ayuda/catalog-preview.mp4',
      title: 'Cómo administrar tu Catálogo',
      duration: '0:15',
    },
    answer: (
      <p>
        Desde Catálogo podés revisar el stock, ajustar los precios de venta y agregar los
        productos que creaste en el Studio a tu tienda oficial.
      </p>
    ),
  },
  {
    question: '¿Cómo comparto el link de mi tienda?',
    answer: (
      <p>
        Tu tienda está en <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">novamente.ar/p/tu-marca</code>{' '}
        (o en tu dominio propio si tenés plan Growth o Pro). Compartí ese link con tus clientes
        por redes o WhatsApp.
      </p>
    ),
  },
  {
    question: '¿Qué pasa con la producción, el envío y la atención al cliente?',
    answer: (
      <p>
        Nosotros nos encargamos de la producción, el empaque y el envío a todo el país. Vos te concentrás en diseñar y hacer crecer tu marca.
      </p>
    ),
  },
  {
    question: '¿Cómo pido ayuda si tengo un problema?',
    answer: (
      <p>
        Creá un ticket acá abajo, en esta misma sección de Soporte, contándonos tu consulta. Si
        tenés plan Pro, tenés atención directa y prioritaria.
      </p>
    ),
  },
]

export default function SupportFaq() {
  return (
    <section data-testid="support-faq" className="space-y-3">
      <div className="flex items-center gap-3">
        <HelpCircle className="h-5 w-5 text-zinc-400" />
        <h2 className="text-lg font-medium text-zinc-100">Preguntas frecuentes</h2>
      </div>

      <div className="space-y-2">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.question}
            className="group rounded-lg border border-zinc-800 bg-zinc-900/60 open:border-zinc-700"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-medium text-zinc-100 marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 rounded-lg">
              <span>{item.question}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4 space-y-4 text-sm text-zinc-400 leading-relaxed">
              {item.video && (
                <div
                  data-testid="support-faq-video"
                  className="rounded-xl overflow-hidden border border-zinc-800 max-w-md"
                >
                  <VideoCard
                    src={item.video.src}
                    poster={item.video.poster}
                    preview={item.video.preview}
                    title={item.video.title}
                    duration={item.video.duration}
                    accent="fuchsia"
                  />
                </div>
              )}
              {item.answer}
            </div>
          </details>
        ))}
      </div>

      <p className="text-xs text-zinc-500">
        ¿Sos cliente y buscás cómo diseñar tu prenda? Mirá la{' '}
        <Link href="/ayuda" className="text-purple-300 hover:text-purple-200 underline underline-offset-2">
          Mesa de Ayuda
        </Link>
        .
      </p>
    </section>
  )
}

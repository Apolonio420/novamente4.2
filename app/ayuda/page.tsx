import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Shirt } from 'lucide-react';
import { WHATSAPP_MESSAGES, getWhatsAppLink } from '@/lib/config/links';
import VideoCard from '@/components/ayuda/VideoCard';

export const metadata: Metadata = {
  title: 'Mesa de Ayuda - Novamente',
  description: 'Guías paso a paso y videos instructivos sobre cómo crear tus prendas y gestionar tu tienda como Partner en Novamente.',
  alternates: { canonical: '/ayuda' },
  openGraph: {
    title: 'Mesa de Ayuda - Novamente',
    description: 'Guías paso a paso y videos instructivos sobre cómo crear tus prendas y gestionar tu tienda como Partner en Novamente.',
    url: '/ayuda',
    type: 'website',
  },
};

export default function AyudaPage() {
  const whatsappUrl = getWhatsAppLink(WHATSAPP_MESSAGES.GENERIC);

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-violet-500/30 selection:text-violet-200">

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/10 via-neutral-950/50 to-neutral-950 pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-violet-300 mb-6 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            Guías y tutoriales
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60">
            ¿Cómo podemos ayudarte?
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Encontrá tutoriales paso a paso y respuestas rápidas para aprovechar al máximo todas las herramientas de Novamente.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-32">

        {/* Section: B2C (Clientes) */}
        <div className="flex flex-col space-y-6">
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shadow-inner shadow-violet-500/10">
              <Shirt className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Para Clientes</h2>
              <p className="text-neutral-400 text-sm">Creá y comprá tu prenda ideal</p>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden hover:border-violet-500/30 transition-all group shadow-2xl shadow-black/50">
            <VideoCard
              src="/ayuda/b2c.mp4"
              poster="/ayuda/b2c-poster.jpg"
              preview="/ayuda/b2c-preview.mp4"
              title="Cómo diseñar tu prenda con IA"
              accent="violet"
            />
            <div className="p-6 md:p-8">
              <h3 className="text-xl font-medium mb-3 group-hover:text-violet-300 transition-colors">Cómo diseñar tu prenda con IA</h3>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                Descubrí lo fácil que es crear un diseño único usando nuestro generador con inteligencia artificial. Solo tenés que describir tu idea y la magia sucede sola.
              </p>
              <div className="flex gap-2">
                <Link href="/crear" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors">
                  Probar el Generador <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          <p className="text-neutral-500 text-sm text-center">
            ¿Sos partner? Los tutoriales del Studio y del Catálogo están en tu workspace, en{' '}
            <Link href="/workspace/support" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">
              Soporte → Preguntas frecuentes
            </Link>
            .
          </p>
        </div>

        {/* Closing CTA */}
        <div className="mt-20 bg-neutral-950 border border-white/10 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">¿No encontraste lo que buscabas?</h2>
          <p className="text-neutral-400 max-w-xl mx-auto mb-8">
            Contactanos y te ayudamos a resolver tu duda lo antes posible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/faq" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors">
              Ver preguntas frecuentes
            </Link>
            <Link
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors backdrop-blur-md"
            >
              Escribinos por WhatsApp
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

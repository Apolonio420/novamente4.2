import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Play, ShoppingBag, LayoutDashboard, Shirt } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mesa de Ayuda - Novamente',
  description: 'Guías paso a paso y videos instructivos sobre cómo crear tus prendas y gestionar tu tienda como Partner en Novamente.',
};

export default function AyudaPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-violet-500/30 selection:text-violet-200">
      
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/10 via-neutral-950/50 to-neutral-950 pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-violet-300 mb-6 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            Soporte 24/7
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60">
            ¿Cómo podemos ayudarte?
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Encontrá tutoriales paso a paso y respuestas rápidas para aprovechar al máximo todas las herramientas de Novamente.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          
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
              <div className="aspect-video bg-neutral-900 relative">
                <video 
                  controls 
                  className="w-full h-full object-cover"
                  poster="/marketing_assets/poster_b2c.jpg"
                >
                  {/* The actual video file should be hosted on a CDN or Vercel Blob in prod */}
                  <source src="/MARKETING_B2C_OPENAI_POLISHED.mp4" type="video/mp4" />
                  Tu navegador no soporta el formato de video.
                </video>
              </div>
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
          </div>

          {/* Section: Partners (B2B) */}
          <div className="flex flex-col space-y-6">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20 shadow-inner shadow-fuchsia-500/10">
                <LayoutDashboard className="w-6 h-6 text-fuchsia-400" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Para Partners</h2>
                <p className="text-neutral-400 text-sm">Gestioná tu tienda y catálogo</p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* Partner Video 1: Studio */}
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden hover:border-fuchsia-500/30 transition-all group shadow-2xl shadow-black/50">
                <div className="aspect-video bg-neutral-900 relative">
                  <video 
                    controls 
                    className="w-full h-full object-cover"
                    poster="/marketing_assets/poster_studio.jpg"
                  >
                    <source src="/MARKETING_DEMO_OPENAI_POLISHED.mp4" type="video/mp4" />
                  </video>
                </div>
                <div className="p-6 md:p-8">
                  <h3 className="text-xl font-medium mb-3 group-hover:text-fuchsia-300 transition-colors">Recorrido por el Studio</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    Un vistazo general a tu panel de control, donde podés ver tus métricas, ganancias, y usar el generador integrado para tu marca.
                  </p>
                </div>
              </div>

              {/* Partner Video 2: Catalog */}
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden hover:border-fuchsia-500/30 transition-all group shadow-2xl shadow-black/50">
                <div className="aspect-video bg-neutral-900 relative">
                  <video 
                    controls 
                    className="w-full h-full object-cover"
                    poster="/marketing_assets/poster_catalog.jpg"
                  >
                    <source src="/MARKETING_CATALOG_OPENAI_POLISHED.mp4" type="video/mp4" />
                  </video>
                </div>
                <div className="p-6 md:p-8">
                  <h3 className="text-xl font-medium mb-3 group-hover:text-fuchsia-300 transition-colors">Cómo administrar tu Catálogo</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                    Aprendé a revisar el stock, ajustar los precios de venta y agregar nuevos productos creados a tu tienda oficial.
                  </p>
                  <div className="flex gap-2">
                    <Link href="https://novamente.ar/partners/workspace" target="_blank" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors backdrop-blur-md">
                      Ir a mi Studio <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

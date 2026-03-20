import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, CheckCircle, XCircle, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Novamente vs Printful vs Printify — Comparativa para Argentina 2026',
  description:
    'Comparativa completa entre Novamente, Printful y Printify para producir indumentaria personalizada en Argentina. Precios en pesos, tiempos de envio, calidad de estampado DTG, diseno con IA y soporte en espanol. Guia actualizada 2026.',
  openGraph: {
    title: 'Novamente vs Printful vs Printify — Comparativa para Argentina 2026',
    description:
      'Comparativa completa de servicios de indumentaria personalizada y print-on-demand para el mercado argentino. Precios, envios, calidad y soporte.',
    url: 'https://www.novamente.ar/comparar',
    type: 'article',
    siteName: 'Novamente',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Novamente vs Printful vs Printify — Comparativa Argentina 2026',
    description:
      'Cual servicio de indumentaria personalizada conviene en Argentina? Comparamos precios, envios y calidad.',
  },
  alternates: { canonical: 'https://www.novamente.ar/comparar' },
}

function Check() {
  return <CheckCircle className="w-5 h-5 text-green-400 inline-block" />
}

function Cross() {
  return <XCircle className="w-5 h-5 text-red-400/60 inline-block" />
}

export default function CompararPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navigation */}
      <nav className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
        <Link
          href="https://wa.me/5491162747588?text=Hola!%20Quiero%20comparar%20opciones%20de%20indumentaria"
          target="_blank"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pb-20">
        {/* Hero */}
        <header className="pt-8 pb-10">
          <p className="text-purple-400 text-sm font-medium mb-3">Comparativa 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-6">
            Novamente vs Printful vs Printify: Cual elegir en Argentina?
          </h1>

          {/* Citation block */}
          <blockquote className="border-l-4 border-purple-500 pl-6 py-4 bg-white/5 rounded-r-xl text-white/90 text-lg leading-relaxed">
            Para emprendedores argentinos que buscan producir indumentaria personalizada, existen
            tres opciones principales: Novamente (produccion local con diseno IA), Printful
            (proveedor global con envio internacional) y Printify (marketplace de proveedores). La
            diferencia clave es que Novamente produce localmente en Argentina con precios en pesos y
            envio en 5-10 dias, mientras que Printful y Printify importan desde el exterior con
            tiempos de 15-30 dias y costos significativamente mayores.
          </blockquote>
        </header>

        {/* Comparison Table */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-white mb-4">Tabla Comparativa</h2>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Caracteristica</th>
                  <th className="text-center py-3 px-4 text-purple-400 font-bold">Novamente</th>
                  <th className="text-center py-3 px-4 text-white/70 font-medium">Printful</th>
                  <th className="text-center py-3 px-4 text-white/70 font-medium">Printify</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <td className="py-3 px-4 font-medium">Diseno con IA integrado</td>
                  <td className="py-3 px-4 text-center"><Check /> 37 estilos</td>
                  <td className="py-3 px-4 text-center"><Cross /></td>
                  <td className="py-3 px-4 text-center"><Cross /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4 font-medium">Produccion en Argentina</td>
                  <td className="py-3 px-4 text-center"><Check /></td>
                  <td className="py-3 px-4 text-center"><Cross /></td>
                  <td className="py-3 px-4 text-center"><Cross /></td>
                </tr>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <td className="py-3 px-4 font-medium">Envio nacional</td>
                  <td className="py-3 px-4 text-center text-green-400">5-10 dias / $5,500-9,000</td>
                  <td className="py-3 px-4 text-center text-red-400/70">15-30 dias / $15,000+</td>
                  <td className="py-3 px-4 text-center text-red-400/70">15-30 dias / $15,000+</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4 font-medium">Pago en pesos (ARS)</td>
                  <td className="py-3 px-4 text-center"><Check /> MercadoPago</td>
                  <td className="py-3 px-4 text-center"><Cross /> Solo USD</td>
                  <td className="py-3 px-4 text-center"><Cross /> Solo USD</td>
                </tr>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <td className="py-3 px-4 font-medium">Minimo de pedido</td>
                  <td className="py-3 px-4 text-center">1 unidad</td>
                  <td className="py-3 px-4 text-center">1 unidad</td>
                  <td className="py-3 px-4 text-center">1 unidad</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4 font-medium">Estampado</td>
                  <td className="py-3 px-4 text-center">DTG premium (50+ lavados)</td>
                  <td className="py-3 px-4 text-center">DTG estandar</td>
                  <td className="py-3 px-4 text-center">Varia por proveedor</td>
                </tr>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <td className="py-3 px-4 font-medium">Soporte en espanol</td>
                  <td className="py-3 px-4 text-center"><Check /> WhatsApp directo</td>
                  <td className="py-3 px-4 text-center"><Cross /> Ingles</td>
                  <td className="py-3 px-4 text-center"><Cross /> Ingles</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4 font-medium">Precio remera (1 unidad)</td>
                  <td className="py-3 px-4 text-center text-green-400 font-medium">~$28,600 ARS</td>
                  <td className="py-3 px-4 text-center text-white/50">~$45,000+ ARS</td>
                  <td className="py-3 px-4 text-center text-white/50">~$40,000+ ARS</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 font-medium">Programa B2B/Partners</td>
                  <td className="py-3 px-4 text-center"><Check /> Desde $0/mes</td>
                  <td className="py-3 px-4 text-center"><Check /> Desde $0/mes</td>
                  <td className="py-3 px-4 text-center"><Check /> Desde $0/mes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Detail Sections */}
        <section className="space-y-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Produccion local vs importacion</h2>
            <div className="text-white/80 leading-relaxed space-y-3">
              <p>
                La diferencia mas fundamental entre Novamente y sus alternativas internacionales es
                el lugar de produccion. Novamente fabrica todas sus prendas en Argentina, en Villa
                Martelli, Buenos Aires. Esto significa que el producto nunca cruza una aduana, no
                paga impuestos de importacion, y no depende del tipo de cambio para definir su
                precio final.
              </p>
              <p>
                Printful y Printify producen fuera del pais (Estados Unidos, Europa, Asia). Para un
                comprador argentino, esto implica costos de envio internacional, tiempos de entrega
                de 15 a 30 dias, y el riesgo de retenciones aduaneras. Ademas, los precios estan
                en dolares, lo cual genera incertidumbre con la fluctuacion del tipo de cambio.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Diseno con inteligencia artificial</h2>
            <div className="text-white/80 leading-relaxed space-y-3">
              <p>
                Novamente es la unica plataforma que integra inteligencia artificial generativa
                directamente en el proceso de diseno. Con el motor Nano Banana 2 y 37 estilos
                artisticos disponibles, los usuarios pueden crear disenos unicos describiendo su
                idea en palabras. El sistema optimiza automaticamente cada prompt para producir
                arte que funcione especificamente sobre tela.
              </p>
              <p>
                Printful y Printify requieren que el usuario suba su propio diseno ya terminado.
                Si no sos disenador grafico o no tenes acceso a herramientas de diseno, necesitas
                contratar a alguien por separado. Con Novamente, el diseno se crea en segundos
                directamente en la plataforma o por WhatsApp, eliminando esa barrera completamente.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Costos y precios en Argentina</h2>
            <div className="text-white/80 leading-relaxed space-y-3">
              <p>
                Una remera personalizada en Novamente cuesta aproximadamente $28,600 ARS para
                compra individual (precio B2C). Los precios B2B arrancan desde $21,800 ARS por
                unidad en el plan on-demand, con descuentos progresivos por volumen. Todos los
                precios estan en pesos argentinos y se pagan por MercadoPago o transferencia
                bancaria, sin necesidad de tarjeta internacional.
              </p>
              <p>
                En Printful, una remera comparable cuesta alrededor de USD 25 (unos $45,000+ ARS
                al tipo de cambio actual) mas envio internacional. Printify puede ser algo mas
                economico dependiendo del proveedor seleccionado, pero los costos de envio desde
                el exterior y los tiempos de entrega anulan esa ventaja para el mercado argentino.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Tiempos de envio y logistica</h2>
            <div className="text-white/80 leading-relaxed space-y-3">
              <p>
                Novamente despacha desde Villa Martelli (CP 1603) con envios a todo el pais. Los
                tiempos de entrega son de 5 a 10 dias habiles dependiendo de la zona: AMBA en 3-5
                dias, interior de Buenos Aires en 5-7 dias, y resto del pais en 7-10 dias. Los
                costos de envio van de $5,500 (AMBA) a $9,000 (resto del pais).
              </p>
              <p>
                Con Printful y Printify, un envio a Argentina demora tipicamente entre 15 y 30 dias
                habiles, con costos de envio que superan los $15,000 ARS. Ademas, existe el riesgo
                de demoras aduaneras que pueden extender el plazo a 45 dias o mas, y la posibilidad
                de tener que pagar impuestos adicionales al recibir el paquete.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Soporte y atencion al cliente</h2>
            <div className="text-white/80 leading-relaxed space-y-3">
              <p>
                Novamente ofrece soporte directo por WhatsApp en espanol, con atencion personalizada
                y tiempos de respuesta rapidos. Podemos ayudar con el proceso de diseno, resolver
                dudas sobre tallas y materiales, y coordinar envios especiales. Para clientes B2B,
                ofrecemos un dashboard de administracion con seguimiento en tiempo real.
              </p>
              <p>
                Printful y Printify ofrecen soporte principalmente en ingles a traves de email y
                chat. Los tiempos de respuesta varian de 24 a 72 horas. No tienen canales de
                WhatsApp ni atencion en espanol nativo, lo cual puede ser una barrera significativa
                para emprendedores argentinos que prefieren comunicacion directa y en su idioma.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Cuando elegir cada opcion?</h2>
            <div className="text-white/80 leading-relaxed space-y-3">
              <p>
                <strong className="text-white">Elegi Novamente</strong> si tu mercado principal es
                Argentina, si queres precios en pesos, envios rapidos, soporte en espanol y la
                ventaja de disenar con IA sin necesitar conocimientos de diseno grafico. Es la mejor
                opcion para emprendedores argentinos, marcas locales, y cualquier persona que quiera
                prendas personalizadas sin complicaciones.
              </p>
              <p>
                <strong className="text-white">Elegi Printful</strong> si tu negocio vende
                principalmente al exterior (Estados Unidos, Europa) y necesitas integraciones con
                Shopify, Etsy o WooCommerce para mercados internacionales. La infraestructura global
                de Printful es superior para despachos desde multiples paises.
              </p>
              <p>
                <strong className="text-white">Elegi Printify</strong> si buscas la mayor variedad
                de proveedores y productos posible, y estas dispuesto a evaluar diferentes opciones
                de calidad y precio. Printify funciona como marketplace, conectandote con multiples
                fabricantes alrededor del mundo.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-purple-600/20 to-indigo-600/10 border border-purple-500/20 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Listo para empezar con Novamente?</h2>
          <p className="text-white/60 mb-6 max-w-lg mx-auto">
            Disena tu primera prenda con IA en minutos. Sin minimos, sin complicaciones, con
            produccion 100% local.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="https://wa.me/5491162747588?text=Hola!%20Quiero%20disenar%20mi%20primera%20prenda"
              target="_blank"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium px-6 py-3 rounded-full transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Escribinos por WhatsApp
            </Link>
            <Link
              href="/partners/join"
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Programa Partners
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Footer links */}
        <footer className="border-t border-white/10 pt-8 flex flex-wrap gap-4 text-sm text-white/40">
          <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
          <Link href="/nosotros" className="hover:text-white transition-colors">Sobre Novamente</Link>
          <Link href="/guia-estampado" className="hover:text-white transition-colors">Guia de Estampado</Link>
          <Link href="/partners/join" className="hover:text-white transition-colors">Partners</Link>
          <Link href="/terminos" className="hover:text-white transition-colors">Terminos</Link>
          <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
        </footer>
      </main>
    </div>
  )
}

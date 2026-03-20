import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'DTG vs Serigrafia vs Sublimacion — Guia Completa 2026',
  description:
    'Guia completa de metodos de estampado textil: DTG (Direct to Garment), serigrafia y sublimacion. Compara durabilidad, costos, minimos de produccion, tipos de tela y calidad de imagen. Actualizada 2026 con precios para Argentina.',
  openGraph: {
    title: 'DTG vs Serigrafia vs Sublimacion — Guia Completa de Estampado Textil 2026',
    description:
      'Compara los tres principales metodos de estampado textil: DTG, serigrafia y sublimacion. Durabilidad, costos, minimos y calidad.',
    url: 'https://www.novamente.ar/guia-estampado',
    type: 'article',
    siteName: 'Novamente',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DTG vs Serigrafia vs Sublimacion — Guia Completa 2026',
    description:
      'Todo lo que necesitas saber sobre estampado textil: DTG, serigrafia y sublimacion comparados.',
  },
  alternates: { canonical: 'https://www.novamente.ar/guia-estampado' },
}

export default function GuiaEstampadoPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Cual es la diferencia entre DTG y serigrafia?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El DTG (Direct to Garment) imprime directamente sobre la tela con tintas a base de agua, permitiendo disenos full color sin minimos de produccion. La serigrafia aplica tinta a traves de mallas, es mas economica a gran escala pero requiere crear una malla por cada color y tiene minimos de 50-100 unidades.',
        },
      },
      {
        '@type': 'Question',
        name: 'Cuanto dura un estampado DTG?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Un estampado DTG de calidad premium dura 50 o mas lavados sin degradacion significativa. La durabilidad depende del pretratamiento de la tela, la calidad de las tintas y el correcto curado. Novamente utiliza estampado DTG premium que garantiza minimo 50 lavados.',
        },
      },
      {
        '@type': 'Question',
        name: 'La sublimacion funciona en algodon?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, la sublimacion solo funciona en telas sinteticas (poliester) o mezclas con alto porcentaje de poliester, y preferiblemente en colores claros. La tinta sublimada se convierte en gas y se adhiere a las fibras sinteticas. Para algodon, las opciones son DTG o serigrafia.',
        },
      },
      {
        '@type': 'Question',
        name: 'Cual metodo de estampado es mas barato?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Depende de la cantidad. Para 1-50 unidades, el DTG es la opcion mas economica ya que no tiene costos de setup. Para tiradas de 100+ unidades del mismo diseno, la serigrafia es significativamente mas barata por unidad. La sublimacion tiene costos intermedios pero esta limitada a telas sinteticas.',
        },
      },
      {
        '@type': 'Question',
        name: 'Por que Novamente usa DTG en vez de serigrafia?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Novamente usa DTG porque su modelo de negocio se basa en produccion bajo demanda con disenos unicos generados por IA. El DTG permite producir una sola unidad con diseno full color sin costos de setup, lo cual es esencial para un servicio de indumentaria personalizada donde cada prenda puede tener un diseno diferente.',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

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
          href="https://wa.me/5491162747588?text=Hola!%20Quiero%20estampar%20mis%20prendas"
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
          <p className="text-purple-400 text-sm font-medium mb-3">Guia Completa 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-6">
            DTG vs Serigrafia vs Sublimacion: Guia Completa de Estampado Textil
          </h1>

          {/* Citation block */}
          <blockquote className="border-l-4 border-purple-500 pl-6 py-4 bg-white/5 rounded-r-xl text-white/90 text-lg leading-relaxed">
            El estampado DTG (Direct to Garment) imprime directamente sobre la tela con tintas a
            base de agua, permitiendo disenos full color sin minimos de produccion. La serigrafia
            aplica tinta a traves de mallas, ideal para tirajes grandes de colores solidos. La
            sublimacion transfiere tinta con calor, limitada a telas sinteticas claras.
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
                  <th className="text-center py-3 px-4 text-purple-400 font-bold">DTG</th>
                  <th className="text-center py-3 px-4 text-white/70 font-medium">Serigrafia</th>
                  <th className="text-center py-3 px-4 text-white/70 font-medium">Sublimacion</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <td className="py-3 px-4 font-medium">Colores</td>
                  <td className="py-3 px-4 text-center">Ilimitados, full color</td>
                  <td className="py-3 px-4 text-center">1-6 colores por diseno</td>
                  <td className="py-3 px-4 text-center">Full color</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4 font-medium">Minimo de produccion</td>
                  <td className="py-3 px-4 text-center text-green-400">1 unidad</td>
                  <td className="py-3 px-4 text-center text-red-400/70">50-100 unidades</td>
                  <td className="py-3 px-4 text-center text-green-400">1 unidad</td>
                </tr>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <td className="py-3 px-4 font-medium">Telas compatibles</td>
                  <td className="py-3 px-4 text-center">Algodon, mezclas</td>
                  <td className="py-3 px-4 text-center">Cualquier tela</td>
                  <td className="py-3 px-4 text-center">Solo poliester/sinteticas claras</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4 font-medium">Durabilidad</td>
                  <td className="py-3 px-4 text-center">50+ lavados</td>
                  <td className="py-3 px-4 text-center">100+ lavados</td>
                  <td className="py-3 px-4 text-center">Permanente</td>
                </tr>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <td className="py-3 px-4 font-medium">Costo por unidad (1 ud.)</td>
                  <td className="py-3 px-4 text-center">$$$</td>
                  <td className="py-3 px-4 text-center text-white/40">N/A (minimo alto)</td>
                  <td className="py-3 px-4 text-center">$$</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4 font-medium">Costo por unidad (100+ uds.)</td>
                  <td className="py-3 px-4 text-center">$$$</td>
                  <td className="py-3 px-4 text-center text-green-400">$ (mas barato a escala)</td>
                  <td className="py-3 px-4 text-center">$$</td>
                </tr>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <td className="py-3 px-4 font-medium">Detalle de imagen</td>
                  <td className="py-3 px-4 text-center">Excelente (fotografico)</td>
                  <td className="py-3 px-4 text-center">Bueno (colores solidos)</td>
                  <td className="py-3 px-4 text-center">Excelente</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4 font-medium">Costo de setup</td>
                  <td className="py-3 px-4 text-center text-green-400">Sin setup</td>
                  <td className="py-3 px-4 text-center text-red-400/70">Requiere crear mallas ($)</td>
                  <td className="py-3 px-4 text-center text-green-400">Sin setup</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 font-medium">Ideal para</td>
                  <td className="py-3 px-4 text-center">Disenos unicos, on-demand</td>
                  <td className="py-3 px-4 text-center">Tiradas grandes, uniformes</td>
                  <td className="py-3 px-4 text-center">Deportivo, full-print</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Detail Sections */}
        <section className="space-y-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Que es el estampado DTG?</h2>
            <div className="text-white/80 leading-relaxed space-y-3">
              <p>
                DTG significa &ldquo;Direct to Garment&rdquo; (directo a la prenda). Es una
                tecnologia de impresion digital que funciona de manera similar a una impresora de
                escritorio, pero sobre tela. La prenda se coloca en una bandeja plana, se le aplica
                un pretratamiento quimico, y luego cabezales de impresion rocian tintas a base de
                agua directamente sobre las fibras textiles.
              </p>
              <p>
                Las tintas DTG son a base de agua, lo que las hace ecologicas y seguras para la
                piel. El resultado es un estampado suave al tacto, con colores vibrantes y
                capacidad de reproducir fotografias, degradados y detalles finos con alta fidelidad.
                A diferencia de otros metodos, no genera grosor ni textura adicional sobre la tela.
              </p>
              <p>
                El proceso no requiere setup ni creacion de mallas, lo que lo hace ideal para
                produccion de unidades individuales o tirajes cortos. Cada prenda puede tener un
                diseno completamente diferente sin costo adicional de preparacion, lo cual es
                perfecto para indumentaria personalizada y produccion bajo demanda.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Que es la serigrafia?</h2>
            <div className="text-white/80 leading-relaxed space-y-3">
              <p>
                La serigrafia (o screen printing) es el metodo de estampado textil mas antiguo y
                utilizado a nivel industrial. Funciona creando una &ldquo;malla&rdquo; o
                &ldquo;pantalla&rdquo; por cada color del diseno. La tinta se empuja a traves de la
                malla con una espatula (racleta), transfiriendo el patron a la tela. Cada color
                requiere una malla separada y una pasada adicional.
              </p>
              <p>
                La ventaja principal de la serigrafia es su costo por unidad en tirajes grandes. Una
                vez creadas las mallas (un proceso que tiene un costo fijo de setup), el costo
                marginal de cada prenda adicional es muy bajo. Por eso es el metodo preferido para
                uniformes corporativos, merchandising de eventos, y producciones de 100 o mas
                unidades del mismo diseno.
              </p>
              <p>
                Sus limitaciones son los minimos de produccion (generalmente 50-100 unidades para
                que sea rentable), la restriccion de colores (cada color adicional aumenta el costo
                del setup), y la imposibilidad de hacer degradados o detalles fotograficos finos.
                Es excelente para logos, texto y graficos de colores solidos.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Que es la sublimacion?</h2>
            <div className="text-white/80 leading-relaxed space-y-3">
              <p>
                La sublimacion es un proceso donde tinta especial se imprime primero en un papel
                transfer y luego se transfiere a la tela mediante calor y presion. A altas
                temperaturas (alrededor de 200 grados Celsius), la tinta se convierte en gas y
                penetra las fibras sinteticas, convirtiendose en parte integral de la tela en lugar
                de quedar sobre ella.
              </p>
              <p>
                El resultado es una impresion permanente que no se despega, no se agrieta, y no
                pierde color con los lavados. La tinta sublimada no agrega grosor ni textura a la
                tela, y permite impresion full color con calidad fotografica, incluyendo la
                posibilidad de cubrir toda la superficie de la prenda (all-over print).
              </p>
              <p>
                La gran limitacion de la sublimacion es que solo funciona en telas sinteticas
                (principalmente poliester) y preferiblemente de color blanco o claro. No funciona
                en algodon ni en telas oscuras. Por esta razon, es el metodo preferido para ropa
                deportiva, uniformes de futbol, y prendas tecnicas de poliester donde se necesita
                cobertura total.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Cual es mas durable?</h2>
            <div className="text-white/80 leading-relaxed space-y-3">
              <p>
                La durabilidad varia significativamente entre los tres metodos. La
                <strong className="text-white"> sublimacion</strong> es la mas durable porque la
                tinta se convierte en parte de la fibra: no hay una capa de estampado que pueda
                desprenderse. Es efectivamente permanente mientras la tela misma dure.
              </p>
              <p>
                La <strong className="text-white">serigrafia</strong> ofrece una durabilidad
                excelente de 100 o mas lavados cuando se realiza correctamente. La capa de tinta es
                mas gruesa y resistente, lo que la hace ideal para prendas de uso diario intensivo
                como uniformes de trabajo o remeras corporativas.
              </p>
              <p>
                El <strong className="text-white">DTG premium</strong> dura 50 o mas lavados sin
                degradacion significativa. La durabilidad depende del pretratamiento de la tela, la
                calidad de las tintas, y el correcto proceso de curado (fijacion con calor despues
                de la impresion). Los avances recientes en tintas y pretratamientos han mejorado
                significativamente la longevidad del DTG.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Cual elegir segun tu proyecto?</h2>
            <div className="text-white/80 leading-relaxed space-y-3">
              <p>
                <strong className="text-white">Elegi DTG</strong> si necesitas producir unidades
                individuales o tirajes cortos con disenos unicos. Es la opcion ideal para
                emprendedores que recien empiezan, indumentaria personalizada, regalos custom,
                merchandising de eventos pequenos, y produccion bajo demanda. No requiere inversion
                inicial en mallas ni pedidos minimos.
              </p>
              <p>
                <strong className="text-white">Elegi serigrafia</strong> si tenes un diseno
                definido y necesitas producir 100 o mas unidades iguales. Es la opcion mas
                economica a escala para uniformes corporativos, merchandising de bandas o eventos
                grandes, y produccion en serie. Asegurate de que tu diseno tenga colores solidos y
                definidos.
              </p>
              <p>
                <strong className="text-white">Elegi sublimacion</strong> si trabajas con telas
                sinteticas (poliester) y necesitas cobertura total de la prenda. Es ideal para
                indumentaria deportiva, uniformes de equipos, ropa tecnica, y disenos all-over
                print. No es viable para remeras de algodon.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Por que Novamente usa DTG?</h2>
            <div className="text-white/80 leading-relaxed space-y-3">
              <p>
                El modelo de negocio de Novamente se basa en produccion bajo demanda con disenos
                generados por inteligencia artificial. Cada prenda puede tener un diseno
                completamente unico, creado en el momento por nuestro motor Nano Banana 2 con 37
                estilos artisticos. Esto hace que el DTG sea el unico metodo viable: no podemos
                crear mallas de serigrafia para un diseno que solo se producira una vez.
              </p>
              <p>
                Utilizamos DTG premium con pretratamiento profesional y tintas de ultima generacion
                que garantizan un minimo de 50 lavados sin degradacion. El resultado es un
                estampado suave al tacto, con colores vibrantes y detalle fotografico, sobre
                prendas de algodon de alta calidad. Cada diseno se imprime bajo demanda, lo que
                significa cero desperdicio de inventario y la capacidad de ofrecer personalizacion
                total a cada cliente.
              </p>
              <p>
                Para clientes B2B que necesitan tirajes grandes de un mismo diseno, tambien ofrecemos
                la opcion de serigrafia a traves de nuestros partners de produccion. Pero para la
                experiencia core de Novamente &mdash;disenar tu prenda unica con IA&mdash; el DTG
                es la tecnologia perfecta.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-purple-600/20 to-indigo-600/10 border border-purple-500/20 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">
            Queres tu prenda con estampado DTG premium?
          </h2>
          <p className="text-white/60 mb-6 max-w-lg mx-auto">
            Disena tu prenda unica con inteligencia artificial y recibila con estampado DTG de
            calidad profesional. Sin minimos, envios a todo el pais.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="https://wa.me/5491162747588?text=Hola!%20Quiero%20mi%20prenda%20con%20estampado%20DTG"
              target="_blank"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium px-6 py-3 rounded-full transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Escribinos por WhatsApp
            </Link>
            <Link
              href="/comparar"
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Comparar servicios
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* FAQ Section (visible for SEO) */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            <details className="group bg-white/5 border border-white/10 rounded-xl">
              <summary className="cursor-pointer px-6 py-4 text-white font-medium list-none flex items-center justify-between">
                Cual es la diferencia entre DTG y serigrafia?
                <span className="text-white/40 group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="px-6 pb-4 text-white/70 text-sm leading-relaxed">
                El DTG imprime directamente sobre la tela con tintas a base de agua, permitiendo
                disenos full color sin minimos de produccion. La serigrafia aplica tinta a traves de
                mallas, es mas economica a gran escala pero requiere crear una malla por cada color
                y tiene minimos de 50-100 unidades.
              </p>
            </details>
            <details className="group bg-white/5 border border-white/10 rounded-xl">
              <summary className="cursor-pointer px-6 py-4 text-white font-medium list-none flex items-center justify-between">
                Cuanto dura un estampado DTG?
                <span className="text-white/40 group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="px-6 pb-4 text-white/70 text-sm leading-relaxed">
                Un estampado DTG de calidad premium dura 50 o mas lavados sin degradacion
                significativa. Novamente utiliza estampado DTG premium que garantiza minimo 50
                lavados con tintas de ultima generacion y pretratamiento profesional.
              </p>
            </details>
            <details className="group bg-white/5 border border-white/10 rounded-xl">
              <summary className="cursor-pointer px-6 py-4 text-white font-medium list-none flex items-center justify-between">
                La sublimacion funciona en algodon?
                <span className="text-white/40 group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="px-6 pb-4 text-white/70 text-sm leading-relaxed">
                No. La sublimacion solo funciona en telas sinteticas (poliester) o mezclas con alto
                porcentaje de poliester, y preferiblemente en colores claros. Para algodon, las
                opciones son DTG o serigrafia.
              </p>
            </details>
            <details className="group bg-white/5 border border-white/10 rounded-xl">
              <summary className="cursor-pointer px-6 py-4 text-white font-medium list-none flex items-center justify-between">
                Cual metodo de estampado es mas barato?
                <span className="text-white/40 group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="px-6 pb-4 text-white/70 text-sm leading-relaxed">
                Depende de la cantidad. Para 1-50 unidades, el DTG es mas economico (sin setup).
                Para 100+ unidades del mismo diseno, la serigrafia es significativamente mas barata
                por unidad. La sublimacion tiene costos intermedios pero esta limitada a sinteticas.
              </p>
            </details>
            <details className="group bg-white/5 border border-white/10 rounded-xl">
              <summary className="cursor-pointer px-6 py-4 text-white font-medium list-none flex items-center justify-between">
                Por que Novamente usa DTG en vez de serigrafia?
                <span className="text-white/40 group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="px-6 pb-4 text-white/70 text-sm leading-relaxed">
                Porque el modelo de Novamente se basa en produccion bajo demanda con disenos unicos
                generados por IA. El DTG permite producir una sola unidad con diseno full color sin
                costos de setup, esencial para un servicio donde cada prenda tiene un diseno
                diferente.
              </p>
            </details>
          </div>
        </section>

        {/* Footer links */}
        <footer className="border-t border-white/10 pt-8 flex flex-wrap gap-4 text-sm text-white/40">
          <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
          <Link href="/nosotros" className="hover:text-white transition-colors">Sobre Novamente</Link>
          <Link href="/comparar" className="hover:text-white transition-colors">Comparativa</Link>
          <Link href="/partners/join" className="hover:text-white transition-colors">Partners</Link>
          <Link href="/terminos" className="hover:text-white transition-colors">Terminos</Link>
          <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
        </footer>
      </main>
    </div>
  )
}

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terminos y Condiciones — Novamente',
  description:
    'Terminos y condiciones de uso de Novamente. Venta de indumentaria personalizada con disenos generados por inteligencia artificial y estampado DTG.',
  alternates: { canonical: 'https://www.novamente.ar/terminos' },
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          Terminos y Condiciones
        </h1>
        <p className="text-white/40 text-sm mb-10">
          Ultima actualizacion: Marzo 2026
        </p>

        <div className="space-y-10 text-white/70 leading-relaxed">
          {/* Identificacion */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Identificacion
            </h2>
            <p>
              <strong className="text-white">Novamente</strong> — CUIT
              20-40207637-3, con domicilio en Villa Martelli, Buenos Aires
              1603, Argentina. Los presentes terminos regulan el uso del sitio
              web y la compra de productos a traves de nuestros canales
              digitales.
            </p>
          </section>

          {/* Objeto */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Objeto
            </h2>
            <p>
              Novamente se dedica a la venta de indumentaria personalizada con
              disenos generados por inteligencia artificial y estampado DTG
              (Direct to Garment). Cada prenda se produce bajo demanda segun
              las especificaciones del cliente.
            </p>
          </section>

          {/* Productos */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Productos
            </h2>
            <p>
              Nuestro catalogo incluye remeras, hoodies y buzos con disenos
              generados por IA. Cada producto se confecciona bajo demanda una
              vez confirmado el pedido y el pago. Los disenos son unicos y
              generados segun las preferencias del cliente entre 37 estilos
              artisticos disponibles.
            </p>
          </section>

          {/* Precios */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Precios
            </h2>
            <p>
              Los precios estan expresados en pesos argentinos (ARS) e incluyen
              IVA. Los costos de envio se calculan por separado segun la zona
              de destino. Nos reservamos el derecho de modificar los precios en
              cualquier momento sin previo aviso. El precio vigente al momento
              de confirmar la compra es el que aplica a la transaccion.
            </p>
          </section>

          {/* Medios de pago */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Medios de pago
            </h2>
            <p>
              Aceptamos pagos a traves de{' '}
              <strong className="text-white/90">MercadoPago</strong>, que
              incluye tarjetas de credito, tarjetas de debito y transferencia
              bancaria. El procesamiento del pago es gestionado integramente
              por MercadoPago. Novamente no almacena datos de tarjetas de
              credito.
            </p>
          </section>

          {/* Proceso de compra */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Proceso de compra
            </h2>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>El cliente elige el producto (modelo, color, talle).</li>
              <li>
                Selecciona o genera un diseno con inteligencia artificial.
              </li>
              <li>Confirma el diseno y aprueba la vista previa.</li>
              <li>Realiza el pago a traves de MercadoPago.</li>
              <li>
                La prenda se produce bajo demanda (2-5 dias habiles).
              </li>
              <li>
                Se despacha y el cliente recibe el codigo de seguimiento.
              </li>
            </ol>
          </section>

          {/* Propiedad intelectual */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Propiedad intelectual de disenos IA
            </h2>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-sm space-y-3">
              <p>
                Los disenos generados por inteligencia artificial no poseen
                proteccion de derecho de autor bajo la legislacion argentina
                vigente (la{' '}
                <strong className="text-white/90">Ley 11.723</strong> requiere
                autoria humana para otorgar proteccion).
              </p>
              <p>
                Se otorga al comprador una{' '}
                <strong className="text-white/90">
                  licencia no exclusiva
                </strong>{' '}
                para uso personal del diseno en la prenda adquirida.
              </p>
              <p>
                Novamente se reserva el derecho de utilizar los disenos
                generados con fines de portfolio, marketing y promocion.
              </p>
            </div>
          </section>

          {/* Garantia */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Garantia legal
            </h2>
            <p>
              Conforme al{' '}
              <strong className="text-white/90">
                Art. 11 de la Ley 24.240
              </strong>
              , los productos nuevos cuentan con una garantia legal de{' '}
              <strong className="text-white/90">6 meses</strong> que cubre
              defectos de fabricacion y estampa. La garantia no cubre danos por
              uso indebido, lavado incorrecto o desgaste normal.
            </p>
          </section>

          {/* Arrepentimiento */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Derecho de arrepentimiento
            </h2>
            <p className="mb-3">
              Conforme al{' '}
              <strong className="text-white/90">
                Art. 34 de la Ley 24.240
              </strong>
              , el consumidor tiene{' '}
              <strong className="text-white/90">
                10 dias corridos
              </strong>{' '}
              desde la recepcion del producto para ejercer el derecho de
              arrepentimiento en compras realizadas por medios electronicos.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm">
              <p>
                <strong className="text-amber-400">Excepcion:</strong> Los
                productos personalizados confeccionados segun especificaciones
                del consumidor estan excluidos del derecho de arrepentimiento
                conforme al{' '}
                <strong className="text-white/90">
                  Art. 1116 del Codigo Civil y Comercial de la Nacion
                </strong>
                . Los productos de Novamente son disenados y producidos bajo
                demanda segun el diseno elegido por cada cliente.
              </p>
            </div>
            <p className="mt-3 text-sm">
              Podes ejercer tu derecho a traves de nuestro{' '}
              <Link
                href="/arrepentimiento"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Boton de Arrepentimiento
              </Link>
              .
            </p>
          </section>

          {/* Envios */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              10. Envios
            </h2>
            <p>
              La produccion demora entre{' '}
              <strong className="text-white/90">2 a 5 dias habiles</strong>.
              El envio demora entre{' '}
              <strong className="text-white/90">
                3 a 10 dias habiles adicionales
              </strong>{' '}
              dependiendo de la zona de destino. Los costos de envio se detallan
              en nuestra pagina de{' '}
              <Link
                href="/envios"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Envios y Devoluciones
              </Link>
              .
            </p>
          </section>

          {/* Cambios por defecto */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              11. Cambios por defecto de fabricacion
            </h2>
            <p>
              Si el producto presenta defectos de fabricacion o estampa,
              contactanos dentro de las{' '}
              <strong className="text-white/90">72 horas</strong> de recibido a{' '}
              <a
                href="mailto:contact@novamente.ar"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                contact@novamente.ar
              </a>{' '}
              con fotos del defecto. Evaluaremos el caso y procederemos al
              reemplazo sin cargo.
            </p>
          </section>

          {/* Limitacion de responsabilidad */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              12. Limitacion de responsabilidad
            </h2>
            <p>
              Pueden existir variaciones menores de color entre lo visualizado
              en pantalla y el producto impreso, debido a las diferencias entre
              la reproduccion de color en pantallas digitales y la impresion
              textil. El cliente acepta el diseno antes de la produccion.
            </p>
          </section>

          {/* Jurisdiccion */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              13. Jurisdiccion
            </h2>
            <p>
              Conforme al{' '}
              <strong className="text-white/90">
                Art. 36 de la Ley 24.240
              </strong>
              , resultan competentes los tribunales ordinarios del domicilio
              del consumidor.
            </p>
          </section>

          {/* Defensa del consumidor */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              14. Defensa del Consumidor
            </h2>
            <p>
              Para reclamos, podes dirigirte a la Direccion Nacional de Defensa
              del Consumidor:{' '}
              <a
                href="https://autogestion.produccion.gob.ar/consumidores"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline break-all"
              >
                autogestion.produccion.gob.ar/consumidores
              </a>
            </p>
          </section>
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-sm text-white/30">
          <Link href="/privacidad" className="hover:text-white/60 transition-colors">
            Politica de Privacidad
          </Link>
          <Link href="/envios" className="hover:text-white/60 transition-colors">
            Envios y Devoluciones
          </Link>
          <Link href="/arrepentimiento" className="hover:text-white/60 transition-colors">
            Boton de Arrepentimiento
          </Link>
        </div>
      </div>
    </div>
  )
}

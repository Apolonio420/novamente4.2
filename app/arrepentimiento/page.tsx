import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ArrepentimientoForm } from './form'

export const metadata: Metadata = {
  title: 'Boton de Arrepentimiento',
  description:
    'Ejerci tu derecho de arrepentimiento conforme a la Ley 24.240 Art. 34. Formulario de solicitud de devolucion para compras online en Novamente.',
  alternates: { canonical: 'https://www.novamente.ar/arrepentimiento' },
}

export default function ArrepentimientoPage() {
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
          Boton de Arrepentimiento
        </h1>
        <p className="text-white/40 text-sm mb-6">
          Conforme Ley 24.240 Art. 34 y Disposicion 945/2025
        </p>

        <div className="space-y-8 text-white/70 leading-relaxed">
          {/* Explicacion */}
          <section>
            <p>
              El consumidor tiene derecho a revocar la aceptacion de un producto
              adquirido por medios electronicos dentro de los{' '}
              <strong className="text-white">
                10 (diez) dias corridos
              </strong>{' '}
              contados desde la recepcion del producto, sin necesidad de
              justificar su decision y sin penalidad alguna.
            </p>
          </section>

          {/* Aviso importante */}
          <section>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
              <h2 className="text-lg font-semibold text-amber-400 mb-2">
                Aviso importante sobre productos personalizados
              </h2>
              <p className="text-sm text-white/70">
                Los productos personalizados confeccionados segun
                especificaciones del consumidor estan excluidos del derecho de
                arrepentimiento conforme al{' '}
                <strong className="text-white/90">
                  Art. 1116 del Codigo Civil y Comercial de la Nacion
                </strong>
                .
              </p>
              <p className="text-sm text-white/70 mt-2">
                Los productos de Novamente son disenados y producidos bajo
                demanda segun el diseno elegido por cada cliente. No obstante,
                podes enviar tu solicitud y la evaluaremos caso por caso.
              </p>
            </div>
          </section>

          {/* Formulario */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Formulario de solicitud
            </h2>
            <ArrepentimientoForm />
          </section>

          {/* Nota */}
          <section className="text-sm text-white/50">
            <p>
              Recibiras un codigo de confirmacion dentro de las 24 horas
              habiles a tu email.
            </p>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              Contacto
            </h2>
            <p className="text-sm">
              Para consultas sobre devoluciones:{' '}
              <a
                href="mailto:contact@novamente.ar"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                contact@novamente.ar
              </a>{' '}
              |{' '}
              <a
                href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Quiero%20ejercer%20boton%20de%20arrepentimiento%20%2F%20cancelacion%20de%20compra.%20(ref%20%C2%B7%20NV-ARR)"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                WhatsApp +54 9 11 2660-3080
              </a>
            </p>
          </section>

          {/* Defensa del consumidor */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              Defensa del Consumidor
            </h2>
            <p className="text-sm">
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
          <Link href="/terminos" className="hover:text-white/60 transition-colors">
            Terminos y Condiciones
          </Link>
          <Link href="/envios" className="hover:text-white/60 transition-colors">
            Envios y Devoluciones
          </Link>
        </div>
      </div>
    </div>
  )
}

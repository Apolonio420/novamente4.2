import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Truck, Package, RefreshCw } from 'lucide-react'
import { SHIPPING_ZONES_PUBLIC, formatShippingARS } from '@/lib/shipping-config'

export const metadata: Metadata = {
  title: 'Envios y Devoluciones — Novamente',
  description:
    'Informacion sobre envios, tiempos de entrega, costos por zona, tabla de talles y politica de devoluciones de Novamente.',
  alternates: { canonical: 'https://www.novamente.ar/envios' },
}

// Derivado de lib/shipping-config: esta página tenía su propia tabla y
// mostraba tarifas viejas que el checkout ya no cobraba.
const SHIPPING_ZONES = SHIPPING_ZONES_PUBLIC.map((z) => ({
  zone: z.zone,
  description: z.description,
  price: formatShippingARS(z.price),
  time: z.days,
}))

const SIZE_CHART = [
  { size: 'S', chest: '96 cm', length: '70 cm' },
  { size: 'M', chest: '100 cm', length: '72 cm' },
  { size: 'L', chest: '106 cm', length: '74 cm' },
  { size: 'XL', chest: '112 cm', length: '76 cm' },
  { size: 'XXL', chest: '118 cm', length: '78 cm' },
]

export default function EnviosPage() {
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
          Envios y Devoluciones
        </h1>
        <p className="text-white/40 text-sm mb-10">
          Ultima actualizacion: Marzo 2026
        </p>

        <div className="space-y-10 text-white/70 leading-relaxed">
          {/* Produccion */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Produccion bajo demanda
              </h2>
            </div>
            <p>
              Cada prenda se produce individualmente una vez confirmado el pago.
              El tiempo de produccion es de{' '}
              <strong className="text-white/90">2 a 5 dias habiles</strong>,
              que incluye la generacion del diseno, la impresion DTG y el
              control de calidad.
            </p>
          </section>

          {/* Zonas y costos */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Zonas y costos de envio
              </h2>
            </div>
            <p className="mb-4">
              Los tiempos de envio son adicionales al tiempo de produccion.
              Origen: Villa Martelli, Buenos Aires.
            </p>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5">
                    <th className="text-left px-4 py-3 text-white/90 font-semibold">
                      Zona
                    </th>
                    <th className="text-left px-4 py-3 text-white/90 font-semibold">
                      Costo
                    </th>
                    <th className="text-left px-4 py-3 text-white/90 font-semibold">
                      Tiempo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SHIPPING_ZONES.map((z) => (
                    <tr
                      key={z.zone}
                      className="border-t border-white/5"
                    >
                      <td className="px-4 py-3">
                        <div className="text-white/90">{z.zone}</div>
                        <div className="text-white/40 text-xs">
                          {z.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-purple-400 font-semibold">
                        {z.price}
                      </td>
                      <td className="px-4 py-3 text-white/60">{z.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-white/40">
              Envio gratuito: no disponible actualmente.
            </p>
          </section>

          {/* Seguimiento */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              Seguimiento del envio
            </h2>
            <p>
              Una vez despachado tu pedido, recibiras el codigo de seguimiento
              por WhatsApp al numero que proporcionaste durante la compra. Podes
              consultar el estado de tu envio en cualquier momento.
            </p>
          </section>

          {/* Tabla de talles */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              Tabla de talles
            </h2>
            <p className="mb-4">
              Medidas aproximadas de nuestras prendas. Recomendamos medir una
              prenda similar que te quede bien y comparar con la tabla.
            </p>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5">
                    <th className="text-left px-4 py-3 text-white/90 font-semibold">
                      Talle
                    </th>
                    <th className="text-left px-4 py-3 text-white/90 font-semibold">
                      Contorno pecho
                    </th>
                    <th className="text-left px-4 py-3 text-white/90 font-semibold">
                      Largo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_CHART.map((s) => (
                    <tr
                      key={s.size}
                      className="border-t border-white/5"
                    >
                      <td className="px-4 py-3 text-white font-semibold">
                        {s.size}
                      </td>
                      <td className="px-4 py-3 text-white/60">{s.chest}</td>
                      <td className="px-4 py-3 text-white/60">{s.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-white/40">
              Las medidas pueden variar +/- 2 cm segun el modelo.
            </p>
          </section>

          {/* Devoluciones */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Devoluciones por defecto de fabricacion
              </h2>
            </div>
            <p className="mb-3">
              Si tu prenda llego con un defecto de estampa o fabricacion,
              contactanos dentro de las{' '}
              <strong className="text-white/90">72 horas</strong> de recibido
              el producto a{' '}
              <a
                href="mailto:contact@novamente.ar"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                contact@novamente.ar
              </a>{' '}
              con fotos del defecto. Te reponemos el producto sin cargo.
            </p>
          </section>

          {/* No cambio por talle */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              Cambios por talle
            </h2>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm">
              <p>
                <strong className="text-amber-400">Importante:</strong> Al ser
                un producto personalizado y producido bajo demanda, no es posible
                realizar cambios por talle. Es fundamental que revises la tabla
                de talles antes de comprar. Los productos personalizados estan
                excluidos del derecho de arrepentimiento conforme al Art. 1116
                del Codigo Civil y Comercial de la Nacion.
              </p>
            </div>
          </section>

          {/* Dano en transito */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              Productos danados en transito
            </h2>
            <p>
              Si tu paquete llego danado, contactanos inmediatamente con fotos
              del paquete y del producto. Gestionamos el reclamo con el correo y
              te informamos la resolucion. Escribinos a{' '}
              <a
                href="mailto:contact@novamente.ar"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                contact@novamente.ar
              </a>{' '}
              o por{' '}
              <a
                href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Tengo%20consultas%20sobre%20envios%20y%20entregas.%20(ref%20%C2%B7%20NV-ENV)"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                WhatsApp
              </a>
              .
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
          <Link href="/arrepentimiento" className="hover:text-white/60 transition-colors">
            Boton de Arrepentimiento
          </Link>
        </div>
      </div>
    </div>
  )
}

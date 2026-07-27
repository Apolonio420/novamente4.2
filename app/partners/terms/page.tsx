import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CURRENT_TERMS_VERSION } from '@/lib/partners/terms-version'

export const metadata: Metadata = {
  title: 'Terminos y Condiciones — Novamente Partners',
  description:
    'Terminos y condiciones de uso del programa Novamente Partners. Planes, facturacion, derechos y responsabilidades.',
  alternates: {
    canonical: 'https://www.novamente.ar/partners/terms',
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/50">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Partners
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Terminos y Condiciones
        </h1>
        <p className="text-zinc-500 text-sm mb-10">
          Version {CURRENT_TERMS_VERSION} · Ultima actualizacion: 24 de julio de 2026
        </p>

        <div className="space-y-10 text-zinc-300 leading-relaxed text-[15px]">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              1. Aceptacion de los Terminos
            </h2>
            <p>
              Al registrarte en Novamente Partners ("el Servicio"), aceptas
              estos Terminos y Condiciones en su totalidad. Si no estas de
              acuerdo con alguna de las disposiciones, no debes utilizar el
              Servicio. El uso continuado de la plataforma implica la aceptacion
              de cualquier modificacion posterior a estos terminos.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              2. Descripcion del Servicio
            </h2>
            <p>
              Novamente Partners es una plataforma que permite a empresas,
              marcas y emprendedores ("Partners") crear y gestionar storefronts
              personalizadas de merchandising. El Servicio incluye, segun el
              plan contratado:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1.5 text-zinc-400">
              <li>
                Partners OS: panel de administracion para gestionar tu
                storefront, productos, leads y analytics.
              </li>
              <li>
                Storefronts: paginas web profesionales con tu marca, catalogo y
                formulario de contacto.
              </li>
              <li>
                Design Engine: generacion de disenos y mockups con inteligencia
                artificial.
              </li>
              <li>
                Produccion on-demand: Novamente produce, almacena y envia los
                productos vendidos.
              </li>
              <li>
                Integraciones: WhatsApp Business, MercadoPago, analytics y
                feeds de productos.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              3. Planes y Facturacion
            </h2>
            <p>El Servicio ofrece tres planes:</p>
            <ul className="list-disc list-inside mt-3 space-y-1.5 text-zinc-400">
              <li>
                <span className="text-zinc-200 font-medium">Starter</span> —
                Gratuito. Incluye storefront con logo, colores y banner, hasta
                10 productos y 20 leads por mes.
              </li>
              <li>
                <span className="text-zinc-200 font-medium">Growth</span> — USD$50
                /mes. Productos ilimitados, leads ilimitados, SEO completo,
                Design Engine, branding avanzado, analytics basicos y prendas
                al costo Novamente (margen alto para el partner).{' '}
                <span className="text-amber-400">Promo de lanzamiento: 50% OFF el primer año (USD$25/mes) para los primeros 100 partners; luego, precio full.</span>
              </li>
              <li>
                <span className="text-zinc-200 font-medium">Pro</span> — USD$100
                /mes. Todo lo de Growth mas chatbot WhatsApp + Instagram DM,
                automatizacion de contenido para Instagram, Facebook y X, setup
                Meta Business, plantillas de Ads, feed Meta Commerce, analytics
                avanzados, onboarding 1:1 y soporte WhatsApp prioritario.
              </li>
            </ul>
            <p className="mt-3">
              Los planes pagos se facturan mensualmente en pesos argentinos (ARS)
              al tipo de cambio del dia de cobro. Existe la opcion de
              facturacion anual con un{' '}
              <span className="text-zinc-100 font-medium">
                15% de descuento
              </span>{' '}
              sobre el precio mensual. Los precios pueden ser modificados con 30
              dias de aviso previo.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              4. Derechos y Responsabilidades del Partner
            </h2>
            <p>Como Partner te comprometes a:</p>
            <ul className="list-disc list-inside mt-3 space-y-1.5 text-zinc-400">
              <li>
                Proveer informacion veraz y actualizada durante el registro y la
                operacion de tu storefront.
              </li>
              <li>
                No utilizar el Servicio para fines ilegales, difamatorios o que
                violen derechos de terceros.
              </li>
              <li>
                No reproducir, distribuir ni sublicenciar el software o la
                plataforma de Novamente.
              </li>
              <li>
                Mantener la confidencialidad de tus credenciales de acceso.
              </li>
              <li>
                Cumplir con la legislacion aplicable en materia de comercio
                electronico, proteccion al consumidor y datos personales.
              </li>
            </ul>
            <p className="mt-3">
              Novamente se reserva el derecho de suspender o cancelar cuentas
              que incumplan estos terminos.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              5. Contenido y Propiedad Intelectual
            </h2>
            <p>
              El Partner retiene todos los derechos sobre su marca, logo,
              disenos y contenido subido a la plataforma. Novamente no reclama
              titularidad sobre dicho contenido.
            </p>
            <p className="mt-3">
              Al subir contenido, el Partner otorga a Novamente una licencia
              limitada, no exclusiva y revocable para mostrar dicho contenido en
              la storefront y en materiales promocionales del Servicio. Los
              disenos generados mediante el Design Engine pertenecen al Partner
              que los genero.
            </p>
            <p className="mt-3">
              La plataforma, su codigo fuente, arquitectura, marca y materiales
              son propiedad exclusiva de Novamente y estan protegidos por las
              leyes de propiedad intelectual.
            </p>

            <h3 className="text-lg font-semibold text-zinc-100 mt-6 mb-2">
              5.1. Garantia de derechos e indemnidad
            </h3>
            <p>
              El Partner declara y garantiza que es titular, o que cuenta con las
              licencias, permisos y autorizaciones necesarias, sobre la totalidad
              del contenido que sube, publica o comercializa a traves del Servicio
              (disenos, textos, logos, fotografias, marcas, escudos e imagenes).
            </p>
            <p className="mt-3">
              Queda expresamente prohibido subir, publicar o vender contenido que
              incorpore, sin autorizacion escrita del titular de los derechos:
              marcas registradas; escudos, emblemas o denominaciones de clubes o
              instituciones; logos o disenos de terceros (por ejemplo Adidas, Puma
              u otras marcas); personajes protegidos; denominaciones, simbolos o
              trofeos de eventos deportivos (por ejemplo "FIFA", "World Cup" y
              similares); e imagenes de personas sin su consentimiento.
            </p>
            <p className="mt-3">
              El Partner es el unico y exclusivo responsable por el contenido que
              carga y se compromete a mantener indemne a Novamente, sus titulares,
              empleados y colaboradores, frente a cualquier reclamo, demanda,
              sancion, multa, dano o costo (incluidos honorarios legales) de
              terceros derivado de la infraccion a derechos de propiedad
              intelectual, marcaria, de imagen o de cualquier otra naturaleza
              relacionada con dicho contenido. Novamente no asume responsabilidad
              alguna por el contenido subido por los Partners.
            </p>
            <p className="mt-3">
              Novamente podra despublicar, ocultar o suspender, sin aviso previo y
              a su solo criterio, cualquier contenido que pudiera infringir
              derechos de terceros, y reponerlo unicamente si el Partner acredita
              de manera fehaciente la licencia o autorizacion correspondiente.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              6. Cancelacion y Reembolsos
            </h2>
            <p>
              El Partner puede cancelar su suscripcion en cualquier momento
              desde su panel de administracion. Al cancelar:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1.5 text-zinc-400">
              <li>
                El acceso al plan contratado se mantiene hasta el final del
                periodo de facturacion ya abonado.
              </li>
              <li>
                No se otorgan reembolsos parciales por periodos no utilizados.
              </li>
              <li>
                La storefront pasara automaticamente al plan Starter (gratuito)
                una vez finalizado el periodo pago.
              </li>
              <li>
                Los datos del Partner se conservan durante 90 dias posteriores a
                la cancelacion, tras lo cual podran ser eliminados.
              </li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              7. Limitacion de Responsabilidad
            </h2>
            <p>
              El Servicio se proporciona "tal cual" y "segun disponibilidad".
              Novamente no garantiza que el Servicio sea ininterrumpido, libre
              de errores o que cumpla con todas las expectativas del Partner.
            </p>
            <p className="mt-3">
              En la maxima medida permitida por la ley, Novamente no sera
              responsable por danos indirectos, incidentales, especiales o
              consecuenciales derivados del uso del Servicio, incluyendo pero no
              limitado a perdida de datos, perdida de ventas o interrupcion del
              negocio.
            </p>
            <p className="mt-3">
              La responsabilidad total de Novamente frente al Partner no
              excedera el monto abonado por el Partner en los ultimos 3 meses
              de servicio.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              8. Modificaciones a los Terminos
            </h2>
            <p>
              Novamente se reserva el derecho de modificar estos Terminos en
              cualquier momento. Las modificaciones seran notificadas por email
              al Partner con al menos 15 dias de anticipacion. El uso continuado
              del Servicio despues de la entrada en vigencia de los cambios
              constituye su aceptacion.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              9. Ley Aplicable
            </h2>
            <p>
              Estos Terminos se rigen por las leyes de la Republica Argentina.
              Cualquier controversia derivada de estos Terminos sera sometida a
              la jurisdiccion de los tribunales ordinarios de la Ciudad Autonoma
              de Buenos Aires.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              10. Contacto
            </h2>
            <p>
              Para consultas sobre estos Terminos, podes escribirnos a{' '}
              <a
                href="mailto:contact@novamente.ar"
                className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
              >
                contact@novamente.ar
              </a>
              .
            </p>
          </section>
        </div>

        {/* Footer link */}
        <div className="mt-12 pt-8 border-t border-zinc-800/50 text-center">
          <Link
            href="/partners/privacy"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Politica de Privacidad
          </Link>
        </div>
      </main>
    </div>
  )
}

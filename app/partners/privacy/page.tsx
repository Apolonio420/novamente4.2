import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Politica de Privacidad — Novamente Partners',
  description:
    'Politica de privacidad del programa Novamente Partners. Como recopilamos, usamos y protegemos tus datos.',
  alternates: {
    canonical: 'https://www.novamente.ar/partners/privacy',
  },
}

export default function PrivacyPage() {
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
          Politica de Privacidad
        </h1>
        <p className="text-zinc-500 text-sm mb-10">
          Ultima actualizacion: 18 de marzo de 2026
        </p>

        <div className="space-y-10 text-zinc-300 leading-relaxed text-[15px]">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              1. Informacion que Recopilamos
            </h2>
            <p>
              Al utilizar Novamente Partners, recopilamos la siguiente
              informacion:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1.5 text-zinc-400">
              <li>
                <span className="text-zinc-200 font-medium">
                  Datos de registro:
                </span>{' '}
                nombre del negocio, email, telefono, pais, rubro y redes
                sociales.
              </li>
              <li>
                <span className="text-zinc-200 font-medium">
                  Datos de storefront:
                </span>{' '}
                logo, banner, colores, productos, descripciones y precios
                publicados.
              </li>
              <li>
                <span className="text-zinc-200 font-medium">Analytics:</span>{' '}
                datos anonimizados de visitas, clics, conversiones y
                comportamiento de los visitantes de tu storefront.
              </li>
              <li>
                <span className="text-zinc-200 font-medium">Leads:</span>{' '}
                informacion de contacto enviada por visitantes a traves del
                formulario de tu storefront (nombre, email, telefono, mensaje).
              </li>
              <li>
                <span className="text-zinc-200 font-medium">
                  Datos de facturacion:
                </span>{' '}
                procesados por MercadoPago. Novamente no almacena datos de
                tarjetas de credito.
              </li>
            </ul>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              2. Uso de la Informacion
            </h2>
            <p>Utilizamos la informacion recopilada para:</p>
            <ul className="list-disc list-inside mt-3 space-y-1.5 text-zinc-400">
              <li>
                Proveer y mantener el Servicio, incluyendo la generacion de tu
                storefront y la gestion de pedidos.
              </li>
              <li>
                Generar reportes de analytics para que puedas medir el
                rendimiento de tu tienda.
              </li>
              <li>
                Mejorar la plataforma, desarrollar nuevas funcionalidades y
                optimizar la experiencia de uso.
              </li>
              <li>
                Comunicar novedades, actualizaciones del servicio y cambios en
                los terminos.
              </li>
              <li>
                Prevenir fraude y garantizar la seguridad de la plataforma.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              3. Comparticion de Datos
            </h2>
            <p>
              Novamente no vende, alquila ni comercializa datos personales de
              sus Partners ni de los visitantes de sus storefronts.
            </p>
            <p className="mt-3">
              Compartimos datos unicamente con los siguientes proveedores, en la
              medida necesaria para operar el Servicio:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1.5 text-zinc-400">
              <li>
                <span className="text-zinc-200 font-medium">MercadoPago:</span>{' '}
                procesamiento de pagos y suscripciones.
              </li>
              <li>
                <span className="text-zinc-200 font-medium">Cloudflare:</span>{' '}
                alojamiento de imagenes (R2) y distribucion de contenido (CDN).
              </li>
              <li>
                <span className="text-zinc-200 font-medium">Supabase:</span>{' '}
                base de datos y autenticacion.
              </li>
              <li>
                <span className="text-zinc-200 font-medium">Google:</span>{' '}
                servicios de inteligencia artificial (Gemini) para generacion de
                disenos.
              </li>
            </ul>
            <p className="mt-3">
              Tambien podemos divulgar informacion cuando sea requerido por ley
              o por orden judicial.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              4. Cookies y Tracking
            </h2>
            <p>
              La plataforma utiliza cookies funcionales necesarias para el
              funcionamiento del Servicio (autenticacion, preferencias de
              sesion).
            </p>
            <p className="mt-3">
              Para los analytics de storefronts, se utiliza un identificador de
              visitante almacenado en{' '}
              <code className="text-purple-400 bg-zinc-800/50 px-1.5 py-0.5 rounded text-sm">
                sessionStorage
              </code>{' '}
              (no persistente entre sesiones del navegador). No se utilizan
              cookies de terceros para tracking publicitario.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              5. Derechos del Usuario
            </h2>
            <p>
              Como Partner, tenes derecho a:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1.5 text-zinc-400">
              <li>
                <span className="text-zinc-200 font-medium">Acceso:</span>{' '}
                solicitar una copia de todos los datos personales que tenemos
                sobre vos.
              </li>
              <li>
                <span className="text-zinc-200 font-medium">Correccion:</span>{' '}
                actualizar o corregir tus datos en cualquier momento desde el
                panel de administracion.
              </li>
              <li>
                <span className="text-zinc-200 font-medium">Eliminacion:</span>{' '}
                solicitar la eliminacion completa de tu cuenta y datos asociados.
                Este proceso es irreversible.
              </li>
              <li>
                <span className="text-zinc-200 font-medium">
                  Portabilidad:
                </span>{' '}
                exportar tus datos de productos, leads y analytics en formato
                estandar.
              </li>
            </ul>
            <p className="mt-3">
              Para ejercer estos derechos, escribi a{' '}
              <a
                href="mailto:contact@novamente.ar"
                className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
              >
                contact@novamente.ar
              </a>
              . Responderemos dentro de los 10 dias habiles.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              6. Seguridad
            </h2>
            <p>
              Implementamos medidas de seguridad acordes a los estandares de la
              industria para proteger tu informacion:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1.5 text-zinc-400">
              <li>
                Encriptacion en transito (HTTPS/TLS) para todas las
                comunicaciones.
              </li>
              <li>
                Almacenamiento seguro en Supabase con politicas de acceso a
                nivel de fila (Row Level Security).
              </li>
              <li>
                Autenticacion segura con tokens JWT y sesiones protegidas.
              </li>
              <li>
                Acceso restringido a datos segun roles (admin/viewer).
              </li>
            </ul>
            <p className="mt-3">
              Ninguna medida de seguridad es infalible. En caso de una brecha de
              seguridad, notificaremos a los Partners afectados dentro de las 72
              horas de detectada.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              7. Retencion de Datos
            </h2>
            <p>
              Conservamos los datos del Partner mientras su cuenta este activa.
              Tras la cancelacion del servicio:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1.5 text-zinc-400">
              <li>
                Los datos de la storefront y productos se mantienen por 90 dias
                y luego se eliminan.
              </li>
              <li>
                Los datos de analytics anonimizados pueden conservarse de forma
                agregada con fines estadisticos.
              </li>
              <li>
                Los datos de facturacion se conservan segun los plazos legales
                vigentes en Argentina (10 anos para documentacion contable).
              </li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              8. Menores de Edad
            </h2>
            <p>
              Novamente Partners es un servicio dirigido a empresas y
              emprendedores. No esta destinado a menores de 18 anos. No
              recopilamos intencionalmente datos de menores de edad. Si
              detectamos que un menor se ha registrado, procederemos a eliminar
              su cuenta y datos asociados.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              9. Cambios en la Politica
            </h2>
            <p>
              Podemos actualizar esta Politica de Privacidad periodicamente. Los
              cambios seran notificados por email y publicados en esta pagina con
              la fecha de actualizacion correspondiente. Te recomendamos revisar
              esta pagina de forma periodica.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">
              10. Contacto
            </h2>
            <p>
              Para consultas sobre esta Politica de Privacidad o sobre el
              tratamiento de tus datos, podes escribirnos a{' '}
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
            href="/partners/terms"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Terminos y Condiciones
          </Link>
        </div>
      </main>
    </div>
  )
}

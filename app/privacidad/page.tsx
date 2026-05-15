import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Politica de Privacidad — Novamente',
  description:
    'Conoce como Novamente protege tus datos personales. Politica de privacidad conforme a la Ley 25.326 de Proteccion de Datos Personales de Argentina.',
  alternates: { canonical: 'https://www.novamente.ar/privacidad' },
}

export default function PrivacidadPage() {
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
          Politica de Privacidad
        </h1>
        <p className="text-white/40 text-sm mb-10">
          Ultima actualizacion: Marzo 2026
        </p>

        <div className="space-y-10 text-white/70 leading-relaxed">
          {/* Responsable */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Responsable del tratamiento
            </h2>
            <p>
              <strong className="text-white">Novamente</strong> — CUIT
              20-40207637-3, con domicilio en Villa Martelli, Buenos Aires,
              Argentina, es responsable del tratamiento de los datos personales
              recopilados. Esta Politica de Privacidad se aplica a la aplicacion{' '}
              <strong className="text-white">Novamente</strong> (en adelante,
              "la Aplicacion" o "Novamente"), disponible en{' '}
              <strong className="text-white">novamente.ar</strong>, e incluye
              tanto el sitio web como sus integraciones con servicios de terceros
              (incluyendo la API de TikTok for Developers, segun se detalla en
              la seccion 10).
            </p>
          </section>

          {/* Datos que recolectamos */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Datos que recolectamos
            </h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>
                <strong className="text-white/90">Datos de identificacion:</strong>{' '}
                nombre y apellido, email, numero de telefono.
              </li>
              <li>
                <strong className="text-white/90">Datos de envio:</strong>{' '}
                direccion postal, codigo postal, localidad, provincia.
              </li>
              <li>
                <strong className="text-white/90">Datos de navegacion:</strong>{' '}
                direccion IP, tipo de navegador, paginas visitadas, cookies
                tecnicas y analiticas.
              </li>
              <li>
                <strong className="text-white/90">Datos de transaccion:</strong>{' '}
                historial de compras, preferencias de diseno. No almacenamos
                datos de tarjetas de credito (gestionados por MercadoPago).
              </li>
            </ul>
          </section>

          {/* Finalidad */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Finalidad del tratamiento
            </h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Procesamiento y gestion de pedidos.</li>
              <li>
                Comunicacion con el cliente sobre el estado de su compra.
              </li>
              <li>Mejora continua de nuestros productos y servicios.</li>
              <li>
                Envio de comunicaciones comerciales (solo con consentimiento
                previo).
              </li>
              <li>Cumplimiento de obligaciones legales y fiscales.</li>
            </ul>
          </section>

          {/* Base legal */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Base legal
            </h2>
            <p>
              El tratamiento de datos se realiza conforme a la{' '}
              <strong className="text-white">
                Ley 25.326 de Proteccion de Datos Personales
              </strong>{' '}
              y su Decreto Reglamentario 1558/2001, sobre la base del
              consentimiento del titular, la ejecucion de un contrato de
              compraventa y el cumplimiento de obligaciones legales.
            </p>
          </section>

          {/* Terceros */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Servicios de terceros
            </h2>
            <p className="mb-3">
              Para la prestacion de nuestros servicios, compartimos datos con
              los siguientes proveedores:
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/90">Supabase</span>
                <span className="text-white/50">Base de datos y autenticacion</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/90">Cloudflare</span>
                <span className="text-white/50">CDN y almacenamiento de imagenes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/90">MercadoPago</span>
                <span className="text-white/50">Procesamiento de pagos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/90">Google</span>
                <span className="text-white/50">Analytics y servicios de IA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/90">Meta</span>
                <span className="text-white/50">WhatsApp Business API</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/90">TikTok</span>
                <span className="text-white/50">Content Posting API (publicacion automatizada)</span>
              </div>
            </div>
          </section>

          {/* Transferencias internacionales */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Transferencias internacionales
            </h2>
            <p>
              Los servicios de terceros mencionados pueden almacenar y procesar
              datos fuera de la Republica Argentina. En estos casos, nos
              aseguramos de que dichos proveedores cumplan con estandares de
              seguridad adecuados para la proteccion de los datos personales.
            </p>
          </section>

          {/* Derechos ARCO */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Derechos del titular (ARCO)
            </h2>
            <p className="mb-3">
              Como titular de los datos, tenes derecho a:
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 text-sm">
              <div>
                <strong className="text-purple-400">Acceso</strong>
                <span className="text-white/50">
                  {' '}
                  — Solicitar informacion sobre tus datos almacenados.
                  Respuesta en 10 dias corridos.
                </span>
              </div>
              <div>
                <strong className="text-purple-400">Rectificacion</strong>
                <span className="text-white/50">
                  {' '}
                  — Corregir datos inexactos o incompletos. Respuesta en 5
                  dias habiles.
                </span>
              </div>
              <div>
                <strong className="text-purple-400">Supresion</strong>
                <span className="text-white/50">
                  {' '}
                  — Solicitar la eliminacion de tus datos. Respuesta en 5 dias
                  habiles.
                </span>
              </div>
              <div>
                <strong className="text-purple-400">Oposicion</strong>
                <span className="text-white/50">
                  {' '}
                  — Oponerte al tratamiento de tus datos para fines
                  especificos.
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm">
              Para ejercer estos derechos, contactanos a{' '}
              <a
                href="mailto:contact@novamente.ar"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                contact@novamente.ar
              </a>
              .
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Cookies
            </h2>
            <p>
              Este sitio utiliza cookies tecnicas (necesarias para el
              funcionamiento) y cookies analiticas (para comprender el uso del
              sitio). Podes desactivar las cookies desde la configuracion de tu
              navegador, aunque esto puede afectar la funcionalidad del sitio.
            </p>
          </section>

          {/* Menores */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Menores de edad
            </h2>
            <p>
              No recolectamos intencionalmente datos personales de menores de
              18 anos. Si tomas conocimiento de que un menor ha proporcionado
              datos sin consentimiento parental, contactanos para proceder a su
              eliminacion.
            </p>
          </section>

          {/* TikTok API */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              10. Uso de la API de TikTok por parte de Novamente
            </h2>
            <p className="mb-3">
              La aplicacion <strong className="text-white/90">Novamente</strong>{' '}
              (operada desde <strong className="text-white/90">novamente.ar</strong> y
              registrada como tal en TikTok for Developers) integra la API de TikTok
              mediante Login Kit y Content Posting API. La integracion se utiliza en
              dos contextos:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-3">
              <li>
                <strong className="text-white/90">Marcas y creadores (Novamente Studio):</strong>{' '}
                cada partner puede conectar voluntariamente su propia cuenta de TikTok
                via OAuth oficial desde su workspace en{' '}
                <Link
                  href="/partners/scheduler"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  novamente.ar/partners/scheduler
                </Link>
                . Los tokens y datos de cada partner se almacenan de forma{' '}
                <strong className="text-white/90">aislada por tenant</strong> en
                nuestra base de datos (Supabase) y nunca se comparten entre marcas.
              </li>
              <li>
                <strong className="text-white/90">Uso propio:</strong> Novamente publica
                contenido en su cuenta oficial{' '}
                <strong className="text-white/90">@novamente.ar</strong> en TikTok.
              </li>
            </ul>
            <p className="mb-3">
              <strong className="text-white/90">
                Datos que Novamente retiene de TikTok:
              </strong>{' '}
              unicamente <code className="text-purple-300">open_id</code>,{' '}
              <code className="text-purple-300">display_name</code>, avatar (URL publica)
              y los tokens de acceso/refresh necesarios para mantener la conexion. No
              recolectamos seguidores, mensajes privados, contactos ni ningun dato
              personal de los seguidores del partner.
            </p>
            <p className="mb-3">
              <strong className="text-white/90">Retencion y borrado:</strong> los datos
              se conservan mientras la cuenta de TikTok este conectada al workspace del
              partner. El partner puede desconectar su cuenta en cualquier momento desde
              su workspace (lo que revoca los tokens) o desde la configuracion oficial
              de TikTok. La desconexion borra los tokens almacenados en un plazo de 30
              dias.
            </p>
            <p>
              Esta Politica de Privacidad cubre el uso que Novamente hace de la API de
              TikTok; el tratamiento de datos por parte de TikTok se rige por la{' '}
              <a
                href="https://www.tiktok.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Politica de Privacidad de TikTok
              </a>
              .
            </p>
          </section>

          {/* Cambios */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              11. Modificaciones
            </h2>
            <p>
              Nos reservamos el derecho de modificar esta politica de
              privacidad en cualquier momento. Las modificaciones seran
              publicadas en esta pagina con la fecha de actualizacion
              correspondiente.
            </p>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              12. Contacto
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-sm">
              <p>
                <strong className="text-white/90">Email:</strong>{' '}
                <a
                  href="mailto:contact@novamente.ar"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  contact@novamente.ar
                </a>
              </p>
              <p>
                <strong className="text-white/90">WhatsApp:</strong>{' '}
                <a
                  href="https://wa.me/5492235169720?text=Hola%20Novamente!%20Tengo%20una%20consulta%20sobre%20Politica%20de%20Privacidad%20%2F%20datos%20personales.%20(ref%20%C2%B7%20NV-PRIV)"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  +54 9 11 2660-3080
                </a>
              </p>
            </div>
          </section>

          {/* Organismo de control */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              13. Organismo de control
            </h2>
            <p>
              La Agencia de Acceso a la Informacion Publica (AAIP) es el
              organo de control de la Ley 25.326. Para mas informacion o para
              presentar una denuncia:{' '}
              <a
                href="https://www.argentina.gob.ar/aaip"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                www.argentina.gob.ar/aaip
              </a>
              .
            </p>
          </section>
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-sm text-white/30">
          <Link href="/terminos" className="hover:text-white/60 transition-colors">
            Terminos y Condiciones
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

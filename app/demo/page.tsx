import Link from 'next/link'

const demos = [
  {
    slug: 'demo-restaurante',
    name: 'Restaurante',
    description: 'Pedidos, menu, reservas y delivery',
    icon: '🍽️',
    color: '#DC2626',
    example: '"Quiero pedir un asado para 2 con delivery"',
  },
  {
    slug: 'demo-clinica',
    name: 'Clinica / Consultorio',
    description: 'Turnos, obras sociales y especialidades',
    icon: '🏥',
    color: '#0891B2',
    example: '"Necesito un turno con dermatologo para manana"',
  },
  {
    slug: 'demo-inmobiliaria',
    name: 'Inmobiliaria',
    description: 'Propiedades, precios, visitas y alquileres',
    icon: '🏠',
    color: '#7C3AED',
    example: '"Busco un 2 ambientes en Palermo hasta USD 90.000"',
  },
  {
    slug: 'demo-mayorista',
    name: 'Mayorista',
    description: 'Catalogo, precios por mayor y cotizaciones',
    icon: '📦',
    color: '#EA580C',
    example: '"Necesito 100 remeras basicas, que precios manejan?"',
  },
  {
    slug: 'demo-peluqueria',
    name: 'Peluqueria / Estetica',
    description: 'Turnos, servicios, precios y disponibilidad',
    icon: '💇',
    color: '#DB2777',
    example: '"Tienen turno para mechas el sabado?"',
  },
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero */}
      <div className="mx-auto max-w-4xl px-6 pt-16 pb-12 text-center">
        <div className="mb-4 text-5xl">🤖</div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Proba el chatbot de IA
          <br />
          <span className="text-green-400">para tu negocio</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Elegi tu rubro y chatea con un bot de ejemplo.
          Asi funciona el asistente virtual que podemos instalar en tu WhatsApp en menos de 7 dias.
        </p>
      </div>

      {/* Demo Cards */}
      <div className="mx-auto max-w-5xl px-6 pb-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((demo) => (
            <Link
              key={demo.slug}
              href={`/demo/${demo.slug}`}
              className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                style={{ backgroundColor: `${demo.color}22` }}
              >
                {demo.icon}
              </div>
              <h2 className="text-lg font-semibold text-white group-hover:text-green-400 transition">
                {demo.name}
              </h2>
              <p className="mt-1 text-sm text-zinc-400">{demo.description}</p>
              <p className="mt-3 text-xs text-zinc-500 italic">
                Proba: {demo.example}
              </p>
            </Link>
          ))}

          {/* CTA Card */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 p-6 text-center">
            <div className="mb-3 text-3xl">💬</div>
            <p className="text-sm text-zinc-400">
              Tu rubro no esta?
              <br />
              Lo adaptamos a cualquier negocio.
            </p>
            <a
              href="https://calendly.com/vwnrvm/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-500"
            >
              Agendar demo gratis
            </a>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-4xl px-6 py-12 text-center">
          <h2 className="text-2xl font-bold">Queres esto para tu negocio?</h2>
          <p className="mt-2 text-zinc-400">
            Chatbot con IA funcionando en tu WhatsApp en 7 dias. Sin codigo. Sin complicaciones.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="https://calendly.com/vwnrvm/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-500"
            >
              Agendar demo gratuita
            </a>
            <a
              href="https://wa.me/5492235169720?text=Hola!%20Vi%20la%20demo%20del%20chatbot%20y%20me%20interesa%20para%20mi%20negocio"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-zinc-700 px-6 py-3 font-semibold text-white transition hover:bg-zinc-800"
            >
              Escribime por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

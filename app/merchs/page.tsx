import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, Clock, Package, Sparkles, Target, Zap } from "lucide-react"
import { WHATSAPP_URL, GENERATOR_URL, INTERNAL_LINKS } from "@/lib/config/links"
import AutoScrollGallery from "@/components/merchs/AutoScrollGallery"

export const metadata: Metadata = {
  title: "B2B Merch | Novamente",
  description: "Potenciá tu marca con merchandising sin inversión inicial. Creá tu línea de productos con Novamente y hacé que tu marca llegue a más personas.",
  openGraph: {
    title: "Potenciá tu marca con merchandising sin inversión inicial | Novamente",
    description: "Creá tu línea de productos con Novamente y hacé que tu marca llegue a más personas. Sin riesgo, sin stock y con dos formas de generar ingresos.",
    images: ["/novamente-logo.png"],
  },
}

export default function MerchsPage() {
  const benefits = [
    {
      icon: <Package className="h-6 w-6" />,
      title: "Sin inversión inicial",
      description: "No necesitás stock ni capital. Nosotros nos ocupamos de la producción, impresión y logística."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Potenciá tu marca",
      description: "Hacé que tu marca esté presente en cada lugar, evento o red social. Llevá tu identidad a nuevas audiencias con productos únicos."
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Entrega rápida",
      description: "Producción y envío en 24–48 hs, con control de calidad y gestión automatizada."
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Diseños con IA a tu medida",
      description: "Creamos juntos la imagen que quieras para tu marca. Podés inspirarte, co-crear o dejar que nuestro generador te ayude a definir tu estilo."
    }
  ]

  const steps = [
    {
      number: "1",
      title: "Diseñamos juntos",
      description: "Te ayudamos a definir la imagen que querés para tu marca o negocio. Podés usar nuestro generador con IA o crear con nuestro equipo de diseño."
    },
    {
      number: "2", 
      title: "Elegís tus prendas y modalidad",
      description: (
        <>
          Seleccioná las{" "}
          <Link href="/products" className="text-violet-600 hover:text-violet-700 hover:underline font-medium">prendas</Link>{" "}
          que más te representen (remeras, buzos, gorras, etc.) y elegí si querés vender como Partner o a precio B2B con tu propio margen.
        </>
      )
    },
    {
      number: "3",
      title: "Lanzás tu línea",
      description: (
        <>
          Si no tenés ecommerce no te preocupes, nosotros creamos una personalizada para tu marca y la posicionamos en nuestra{" "}
          <Link href="/merch" className="text-violet-600 hover:text-violet-700 hover:underline font-medium">página de merch</Link>
          , para que empieces a vender sin inversión inicial.
        </>
      )
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8 bg-white min-h-screen border-0">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="novamente-heading text-4xl md:text-6xl mb-6 text-black">
          Potenciá tu marca personal con <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">merchandising</span> sin inversión inicial
        </h1>
        <p className="text-gray-700 max-w-4xl mx-auto text-lg md:text-xl mb-8">
          Creá tu línea de productos con Novamente y hacé que tu marca llegue a más personas.
          <br />
          Diseñamos juntos tus prendas, las producimos bajo demanda y las entregamos en 24–48 hs.
          <br />
          <span className="text-violet-600 font-medium">Sin riesgo, sin stock y con dos formas de generar ingresos.</span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href={WHATSAPP_URL} target="_blank">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500">
              <ArrowRight className="h-4 w-4 mr-2" />
              Sumate como Partner
            </Button>
          </Link>
          <Link href={INTERNAL_LINKS.merch}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-300 bg-white text-gray-900 hover:bg-gray-200 hover:border-gray-400">
              Ver Catálogo Actual
            </Button>
          </Link>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {benefits.map((benefit, index) => (
          <div key={index} className="text-center p-6 rounded-xl bg-gray-50 border border-gray-200">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-violet-100 text-violet-600 mb-4">
              {benefit.icon}
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">{benefit.title}</h3>
            <p className="text-gray-600 text-sm">{benefit.description}</p>
          </div>
        ))}
      </div>

      {/* Auto-scroll gallery */}
      <div className="mb-16 -mx-4 md:-mx-6 lg:-mx-8">
        <AutoScrollGallery heightClass="h-60 md:h-80 lg:h-96" gapClass="gap-4 md:gap-6" pauseOnHover speedSec={34} />
      </div>

      {/* How it Works */}
      <div className="bg-gray-50 rounded-xl p-8 mb-16 border border-gray-200">
        <h2 className="novamente-heading text-3xl text-center mb-8 text-gray-900">¿Cómo funciona? Tres pasos simples.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">{step.title}</h3>
              <p className="text-gray-700">{step.description}</p>
            </div>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href={WHATSAPP_URL} target="_blank">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500">
              Contactar por WhatsApp
            </Button>
          </Link>
          <Link href={GENERATOR_URL}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-300 bg-white text-gray-900 hover:bg-gray-200 hover:border-gray-400">
              Probar el Generador
            </Button>
          </Link>
          <Link href={INTERNAL_LINKS.merch}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-300 bg-white text-gray-900 hover:bg-gray-200 hover:border-gray-400">
              Ver Catálogo
            </Button>
          </Link>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="text-center bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-xl p-6 md:p-8 border border-violet-100 max-w-4xl mx-auto">
        <h2 className="novamente-heading text-2xl md:text-3xl mb-4 text-gray-900">
          Tu comunidad quiere vestir tu marca. Dejá que Novamente lo haga posible.
        </h2>
        <p className="text-gray-700 mb-6 max-w-2xl mx-auto text-base md:text-lg">
          Sumate a la nueva forma de crecer con merchandising inteligente: sin riesgos, con tu esencia y con el respaldo de nuestra tecnología.
          <br />
          Hacemos que tus ideas se conviertan en productos reales, listos para el mundo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={WHATSAPP_URL} target="_blank">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500">
              <Users className="h-4 w-4 mr-2" />
              Chatear con nosotros
            </Button>
          </Link>
          <Link href={GENERATOR_URL}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-300 bg-white text-gray-900 hover:bg-gray-200 hover:border-gray-400">
              <Zap className="h-4 w-4 mr-2" />
              Probar Generador
            </Button>
          </Link>
          <Link href={INTERNAL_LINKS.merch}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-300 bg-white text-gray-900 hover:bg-gray-200 hover:border-gray-400">
              Ver Catálogo Actual
            </Button>
          </Link>
        </div>
      </div>

    </div>
  )
}

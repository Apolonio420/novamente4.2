import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock, Package, Sparkles, Target, Users, Zap } from "lucide-react"
import { WHATSAPP_MESSAGES, getWhatsAppLink } from "@/lib/config/links"
import AutoScrollGallery from "@/components/merchs/AutoScrollGallery"

export const metadata: Metadata = {
  title: "Merch para Vender sin Stock o por Mayor | Novamente",
  description: "Merch personalizado para marcas, creadores, empresas, eventos y revendedores B2B. Crea tu linea de productos sin stock o pedi por cantidad con produccion DTG premium.",
  openGraph: {
    title: "Merch para vender sin stock o por mayor | Novamente",
    description: "Crea tu linea de productos con Novamente: para marcas, creadores, empresas, eventos, comunidades y revendedores B2B.",
    images: ["/marketing/merch-general-hero.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Merch para vender | Novamente",
    description: "Merch personalizado para vender sin stock o pedir por cantidad.",
  },
  alternates: { canonical: "https://www.novamente.ar/merchs" },
}

export default function MerchsPage() {
  const benefits = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Potenciá tu marca",
      description: "Hacé que tu marca esté presente en cada lugar, evento o red social. Llevá tu identidad a nuevas audiencias con productos únicos."
    },
    {
      icon: <Package className="h-6 w-6" />,
      title: "Sin inversión inicial",
      description: "No necesitás stock ni capital. Nosotros nos ocupamos de la producción, impresión y logística."
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
          que más te representen (remeras, buzos, gorras, etc.) y empezá a vender como Partner con tu propia línea oficial.
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
      <div className="grid lg:grid-cols-[1fr_0.9fr] gap-10 lg:gap-14 items-center mb-16">
        <div className="text-center lg:text-left">
          <h1 className="novamente-heading text-4xl md:text-6xl mb-6 text-black">
            Merch para vender: <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">sin stock o por mayor</span>
          </h1>
          <p className="text-gray-700 max-w-4xl mx-auto lg:mx-0 text-lg md:text-xl mb-8">
            Crea tu linea de productos con Novamente: para marcas personales, empresas, creadores, eventos, comunidades y revendedores B2B.
            <br />
            Nos encargamos del diseno, la produccion y el envio bajo demanda.
            <br />
            <span className="text-violet-600 font-medium">Sin stock si queres vender online; por cantidad si necesitas merch para tu equipo, evento o cliente.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
            <Link href={getWhatsAppLink(WHATSAPP_MESSAGES.PARTNER)} target="_blank">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500">
                <ArrowRight className="h-4 w-4 mr-2" />
                Sumate como Partner
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-2xl">
            <Image
              src="/marketing/merch-general-hero.webp"
              alt="Merch personalizado para marcas, creadores, empresas y venta B2B"
              width={1600}
              height={900}
              priority
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="text-center bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-xl p-6 md:p-8 border border-violet-100 max-w-4xl mx-auto mb-16">
        <h2 className="novamente-heading text-2xl md:text-3xl mb-4 text-gray-900">
          Tu comunidad quiere vestir tu marca. Dejá que Novamente lo haga posible.
        </h2>
        <p className="text-gray-700 max-w-2xl mx-auto text-base md:text-lg">
          Sumate a la nueva forma de crecer con merchandising inteligente: sin riesgos, con tu esencia y con el respaldo de nuestra tecnología.
          <br />
          Hacemos que tus ideas se conviertan en productos reales, listos para el mundo.
        </p>
      </div>

      {/* Auto-scroll gallery */}
      <div className="mb-16 -mx-4 md:-mx-6 lg:-mx-8">
        <AutoScrollGallery heightClass="h-60 md:h-80 lg:h-96" gapClass="gap-4 md:gap-6" pauseOnHover speedSec={34} />
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
          <Link href={getWhatsAppLink(WHATSAPP_MESSAGES.PARTNER)} target="_blank">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500">
              <ArrowRight className="h-4 w-4 mr-2" />
              Sumate como Partner
            </Button>
          </Link>
          <Link href="/#generator-section">
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-300 bg-white text-gray-900 hover:bg-gray-200 hover:border-gray-400">
              <Zap className="h-4 w-4 mr-2" />
              Probar Generador
            </Button>
          </Link>
        </div>
      </div>

      {/* Aclaración final sobre pedidos puntuales */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="border-t border-gray-300 my-8"></div>
        <div className="text-center">
          <div className="mb-6">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 uppercase">
              MAYORISTA
            </h3>
          </div>
          <p className="text-gray-700 text-base md:text-lg mb-4">
            También realizamos pedidos <span className="font-bold text-violet-600">puntuales</span> para empresas, equipos, eventos y acciones especiales, <span className="font-bold text-violet-600">sin</span> necesidad de comprometerse con cantidades <span className="font-bold text-violet-600">mínimas</span> y <span className="font-bold text-violet-600">stock</span>.
          </p>
          <p className="text-gray-700 text-base md:text-lg font-bold mb-6">
            Hacemos tu pedido ajustado a tu necesidad.
          </p>
          <Link href={getWhatsAppLink(WHATSAPP_MESSAGES.MAYORISTA)} target="_blank">
            <Button size="default" className="bg-[#25D366] hover:bg-[#20BA5A] text-white border-0 shadow-md hover:shadow-lg transition-all px-6 py-3 tracking-wide">
              Hace tu pedido único
            </Button>
          </Link>
        </div>
        <div className="border-t border-gray-300 my-8"></div>
      </div>

    </div>
  )
}

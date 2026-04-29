export interface BlogPost {
  slug: string
  title: string
  description: string
  category: string
  readingTime: string
  date: string
  priority?: number
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "novamente-vs-printful-argentina",
    title: "Novamente vs Printful en Argentina: que conviene para vender merch",
    description:
      "Comparativa practica entre producir merch localmente con Novamente y usar una plataforma global de print-on-demand como Printful. Costos ocultos, tiempos, marca, soporte y experiencia para clientes argentinos.",
    category: "Comparativas",
    readingTime: "7 min",
    date: "2026-04-29",
    priority: 0.85,
  },
  {
    slug: "novamente-vs-fullprinted",
    title: "Novamente vs proveedores tradicionales: IA, DTG y produccion on-demand",
    description:
      "Como elegir entre Novamente y un proveedor tradicional de indumentaria personalizada: minima inversion, variedad de disenos, DTG, tiempos, calidad y control de marca.",
    category: "Comparativas",
    readingTime: "6 min",
    date: "2026-04-29",
    priority: 0.85,
  },
  {
    slug: "dtg-todo-lo-que-necesitas-saber",
    title: "DTG: todo lo que necesitas saber sobre impresion directa a prenda",
    description:
      "Guia 2026 sobre Direct-to-Garment: como funciona el pre-tratamiento, por que se imprime con tinta acuosa, cuando conviene frente a serigrafia y que calidad esperar en una remera real.",
    category: "Produccion",
    readingTime: "8 min",
    date: "2026-04-15",
    priority: 0.8,
  },
  {
    slug: "como-crear-merch-sin-inversion",
    title: "Como crear merch sin inversion inicial",
    description:
      "Produccion bajo demanda en Argentina: lanza tu marca o el merch de tu banda sin comprar stock. Como funciona el modelo, que necesitas para arrancar y que errores evitar.",
    category: "Negocio",
    readingTime: "6 min",
    date: "2026-04-10",
    priority: 0.8,
  },
]

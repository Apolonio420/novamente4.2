import type { Tenant, PartnerProduct } from './types'
import type { ReviewStats } from './reviews'
import { SHIPPING } from '../shipping-config'

const BASE_URL = 'https://www.novamente.ar'

export function generateOrganizationSchema(tenant: Tenant, baseRoute = '/p/') {
  const sameAs: string[] = []
  if (tenant.instagram) {
    sameAs.push(
      tenant.instagram.startsWith('http')
        ? tenant.instagram
        : `https://instagram.com/${tenant.instagram.replace('@', '')}`,
    )
  }
  if (tenant.website) {
    sameAs.push(tenant.website.startsWith('http') ? tenant.website : `https://${tenant.website}`)
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: tenant.name,
    url: `${BASE_URL}${baseRoute}${tenant.slug}`,
    ...(tenant.logo_url && { logo: tenant.logo_url }),
    ...(tenant.description && { description: tenant.description }),
    ...(tenant.email && { email: tenant.email }),
    ...(tenant.phone && { telephone: tenant.phone }),
    ...(sameAs.length > 0 && { sameAs }),
  }
}

export function generateProductSchema(
  product: PartnerProduct,
  tenant: Tenant,
  options: { baseRoute?: string; enhanced?: boolean; reviews?: ReviewStats | null } = {},
) {
  const { baseRoute = '/p/', enhanced = false, reviews = null } = options
  const productUrl = `${BASE_URL}${baseRoute}${tenant.slug}/${product.slug}`

  // Build images array
  const images: string[] = []
  if (Array.isArray(product.images)) {
    for (const img of product.images) {
      if (typeof img === 'string' && img) images.push(img)
    }
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: productUrl,
    ...(product.description && { description: product.description }),
    ...(images.length > 0 && { image: enhanced ? images : images[0] }),
    brand: {
      '@type': 'Brand',
      name: tenant.name,
    },
    ...(product.category && { category: product.category }),
    ...(enhanced && { sku: product.id }),
  }

  if (product.price != null) {
    const offers: Record<string, unknown> = {
      '@type': 'Offer',
      url: productUrl,
      price: product.price,
      priceCurrency: product.currency || tenant.currency || 'ARS',
      availability: product.availability === 'out_of_stock'
        ? 'https://schema.org/OutOfStock'
        : product.availability === 'preorder'
          ? 'https://schema.org/PreOrder'
          : 'https://schema.org/InStock',
    }

    if (enhanced) {
      offers.itemCondition = 'https://schema.org/NewCondition'
      offers.priceValidUntil = '2026-12-31'
      offers.seller = {
        '@type': 'Organization',
        name: tenant.name,
        url: `${BASE_URL}${baseRoute}${tenant.slug}`,
      }
      offers.shippingDetails = {
        '@type': 'OfferShippingDetails',
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: tenant.country || 'AR',
        },
        shippingRate: {
          '@type': 'MonetaryAmount',
          currency: 'ARS',
          // Derivado de shipping-config: antes decía '5500', que ya no es lo
          // que cobra el checkout.
          value: SHIPPING.RESTO,
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 7,
            unitCode: 'DAY',
          },
        },
      }
      offers.hasMerchantReturnPolicy = { '@id': 'https://www.novamente.ar/#return-policy' }
    } else {
      offers.seller = {
        '@type': 'Organization',
        name: tenant.name,
      }
    }

    schema.offers = offers
  }

  // Rating: SOLO con reseñas reales aprobadas y visibles en la misma página.
  // Google exige que el aggregateRating se corresponda con contenido que el
  // usuario pueda ver; emitir un promedio sin reseñas publicadas es causa de
  // acción manual sobre el dominio entero.
  if (reviews && reviews.count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: reviews.avg,
      reviewCount: reviews.count,
      bestRating: 5,
      worstRating: 1,
    }

    const withText = reviews.top.filter((r) => r.body && r.body.trim().length > 0)
    if (withText.length > 0) {
      schema.review = withText.map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.author },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
        datePublished: r.createdAt.slice(0, 10),
        reviewBody: r.body,
      }))
    }
  }

  return schema
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function generateLocalBusinessSchema(tenant: Tenant, baseRoute = '/p/') {
  const sameAs: string[] = []
  if (tenant.instagram) {
    sameAs.push(
      tenant.instagram.startsWith('http')
        ? tenant.instagram
        : `https://instagram.com/${tenant.instagram.replace('@', '')}`,
    )
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: tenant.name,
    url: `${BASE_URL}${baseRoute}${tenant.slug}`,
    ...(tenant.logo_url && { image: tenant.logo_url }),
    ...(tenant.description && { description: tenant.description }),
    ...(tenant.phone && { telephone: tenant.phone }),
    ...(tenant.email && { email: tenant.email }),
    ...(sameAs.length > 0 && { sameAs }),
    address: {
      '@type': 'PostalAddress',
      addressCountry: tenant.country || 'AR',
    },
    areaServed: {
      '@type': 'Country',
      name: tenant.country === 'AR' || !tenant.country ? 'Argentina' : tenant.country,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  }
}

export function generateItemListSchema(items: { name: string; url: string; image?: string; position: number }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      url: item.url,
      ...(item.image && { image: item.image }),
    })),
  }
}

export function getDefaultPartnerFAQs(tenantName: string): { question: string; answer: string }[] {
  return [
    {
      question: `¿Cómo compro productos de ${tenantName}?`,
      answer: `Podés consultar por WhatsApp o completar el formulario de contacto en la tienda de ${tenantName}. Te responderemos a la brevedad con precios, talles disponibles y formas de pago.`,
    },
    {
      question: `¿Cuánto tarda el envío de ${tenantName}?`,
      answer: 'Los envíos se realizan a todo el país. AMBA: 3-5 días hábiles. Interior: 5-10 días hábiles. Todos los productos se fabrican a pedido con la mejor calidad.',
    },
    {
      question: `¿Los productos de ${tenantName} tienen garantía?`,
      answer: 'Sí, todos nuestros productos tienen garantía de calidad. Si recibís un producto defectuoso, contactanos dentro de las 72hs para gestionar el cambio.',
    },
    {
      question: `¿Qué métodos de pago acepta ${tenantName}?`,
      answer: 'Aceptamos MercadoPago (tarjetas de crédito, débito, efectivo en puntos de pago), transferencia bancaria y efectivo al momento de la entrega en AMBA.',
    },
  ]
}

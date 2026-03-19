import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/products/', '/styles/', '/faq/', '/merch/', '/partners/', '/p/',
                '/nosotros', '/comparar', '/guia-estampado', '/envios',
                '/terminos', '/privacidad', '/arrepentimiento'],
        disallow: ['/workspace/', '/api/', '/partners/payment/', '/admin/', '/checkout/', '/cart/'],
      },
      // Explicitly allow AI crawlers for GEO
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/workspace/', '/api/', '/admin/'],
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: ['/workspace/', '/api/', '/admin/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/workspace/', '/api/', '/admin/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/workspace/', '/api/', '/admin/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/workspace/', '/api/', '/admin/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/workspace/', '/api/', '/admin/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/workspace/', '/api/', '/admin/'],
      },
    ],
    sitemap: 'https://www.novamente.ar/sitemap.xml',
  }
}

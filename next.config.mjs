/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Transpile shared local packages so Next can consume raw TS without a build step.
  transpilePackages: ['@novamente/catalog'],
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 días
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'blob.v0.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.novamente.ar',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.novamente.ar',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'novamente.ar',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fvsjvvyohaarivametxq.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ywsoqaclylvrbqfvwofr.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
  },
  // Optimizaciones de rendimiento
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'framer-motion'],
  },
  serverExternalPackages: ['@vercel/blob'],
  // Configuración webpack para excluir binarios nativos y paquetes server-only
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Excluir binarios nativos de canvas del bundle
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'canvas',
        '@napi-rs/canvas': '@napi-rs/canvas',
      });
    }
    if (!isServer) {
      // Evitar que paquetes server-only se bundleen para el browser
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@vercel/blob': false,
      };
    }
    return config;
  },
  // Compresión y optimización
  compress: true,
  poweredByHeader: false,
  // Redirects para Meta Commerce feed
  async rewrites() {
    return [
      {
        source: '/llms.txt',
        destination: '/api/llms',
      },
      {
        source: '/openai-products.jsonl',
        destination: '/api/openai-feed',
      },
      {
        // OAuth de TikTok: el handler vive en admin.novamente.ar pero TikTok
        // aprobo la app con redirect URI en www.novamente.ar/api/auth/tiktok/callback.
        // Vercel rewrite reenvia server-to-server con headers+cookies+querystring.
        // Cookie de state se setea con domain=.novamente.ar (en repo platform).
        source: '/api/auth/tiktok/:path*',
        destination: 'https://admin.novamente.ar/api/auth/tiktok/:path*',
      },
    ];
  },
  async redirects() {
    return [
      // Canonicalización de dominio: apex (sin www) → www.
      // www es el host canónico en todo el stack: metadataBase/canonical (app/layout.tsx),
      // Site URL + allowlist de Supabase Auth, y el redirect URI aprobado de TikTok.
      // Match de host EXACTO 'novamente.ar' → no toca www. / admin. / cdn. / localhost,
      // por lo que no hay riesgo de loop. Preserva path y querystring.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'novamente.ar' }],
        destination: 'https://www.novamente.ar/:path*',
        permanent: true,
      },
      {
        source: '/meta/catalog.tsv',
        destination: '/meta/catalog',
        permanent: true,
      },
      // ── Retiro del storefront legacy /merch/[brand] → canónico /p/[slug] ──
      // 308 (permanent) preserva método y querystring (UTMs de campañas de
      // partners generadas por utm-generator siguen llegando intactas).
      // OJO orden: la regla del slug renombrado hard-demonio va ANTES de la
      // genérica /merch/:brand para ganar el match.
      // NO se toca /merch raíz (directorio de marcas) ni /merch-para-* ni
      // /merchs (landings SEO distintas — no matchean /merch/:brand).
      {
        source: '/merch/hard-demonio',
        destination: '/p/maldito-demonio',
        permanent: true,
      },
      {
        source: '/merch/:brand',
        destination: '/p/:brand',
        permanent: true,
      },
      // Producto: los slugs de partner_products coinciden 1:1 con los slugs
      // legibles del viejo catálogo estático (verificado en DB), así que el
      // detalle de producto redirige directo a su equivalente canónico.
      {
        source: '/merch/:brand/:product',
        destination: '/p/:brand/:product',
        permanent: true,
      },
      // Generador viejo → nuevo estudio. source EXACTO '/design' (NO matchea
      // /design/[imageId]) → los permalinks de diseños compartidos siguen vivos.
      // Preserva querystring (?style=…). 301 para consolidar SEO en /crear.
      {
        source: '/design',
        destination: '/crear',
        permanent: true,
      },
      // /products/lienzo-premium es un id huérfano: no existe en lib/products.ts
      // (PRODUCTS real usa id "lienzo") así que app/products/[id]/page.tsx
      // devuelve notFound(). El único producto real de lienzo vive en
      // /products/lienzo (desglose de 3 medidas). 301 para no dejar la URL
      // vieja (indexada, referenciada en el feed viejo) sirviendo 404.
      {
        source: '/products/lienzo-premium',
        destination: '/products/lienzo',
        permanent: true,
      },
      // NOTA: NO redirigir /disena-tu-remera, /quote ni /merchs — son
      // landings SEO con keywords propios distintos a /crear, /cotizador
      // y /merch. Cada una rankea queries específicas. Verificar antes en
      // Search Console si se las quiere consolidar.
    ];
  },
  // Headers de cache y seguridad para assets estáticos
  async headers() {
    return [
      {
        // Global security headers for all routes (belt-and-suspenders with middleware)
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/products/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400',
          },
        ],
      },
      {
        source: '/styles/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400',
          },
        ],
      },
      {
        source: '/falco/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

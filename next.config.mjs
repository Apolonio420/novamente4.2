/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
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
        hostname: 'fvsjvvyohaarivametxq.supabase.co',
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
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
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
    ];
  },
  async redirects() {
    return [
      {
        source: '/meta/catalog.tsv',
        destination: '/meta/catalog',
        permanent: true, // 308 redirect
      },
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
    ];
  },
};

export default nextConfig;

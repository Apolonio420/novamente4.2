import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  // Skip security headers for static assets
  if (pathname.startsWith('/_next/')) {
    return response
  }

  // --- Workspace auth protection ---
  if (pathname.startsWith('/workspace')) {
    // Extract token from Supabase auth cookie
    let token: string | null = null
    const allCookies = request.cookies.getAll()
    for (const cookie of allCookies) {
      if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
        try {
          const parsed = JSON.parse(cookie.value)
          token = Array.isArray(parsed) ? parsed[0] : parsed
        } catch {
          token = cookie.value
        }
        break
      }
    }

    if (!token) {
      // No session — redirect to partner login
      const loginUrl = new URL('/partners/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Validate token is still valid (lightweight check)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
        const { data, error } = await supabase.auth.getUser(token)
        if (error || !data?.user) {
          const loginUrl = new URL('/partners/login', request.url)
          loginUrl.searchParams.set('redirect', pathname)
          return NextResponse.redirect(loginUrl)
        }
      }
    } catch {
      // If validation fails, allow through — API routes will handle auth
    }
  }

  // Skip remaining headers for API routes
  if (pathname.startsWith('/api/')) {
    return response
  }

  // --- Security Headers ---

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // XSS Protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer Policy — send origin for cross-origin, full for same-origin
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // HSTS — enforce HTTPS for 1 year + subdomains
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // Permissions Policy — restrict sensitive APIs
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Content Security Policy — balanced for functionality
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://www.googletagmanager.com https://www.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://api.mercadopago.com https://*.r2.cloudflarestorage.com https://*.r2.dev https://cdn.novamente.ar https://www.facebook.com https://graph.facebook.com https://*.facebook.com https://*.conversionsapigateway.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://*.g.doubleclick.net https://www.google.com",
    "frame-src 'self' https://www.mercadopago.com.ar https://www.facebook.com https://td.doubleclick.net https://bid.g.doubleclick.net",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  return response
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)',
  ],
}

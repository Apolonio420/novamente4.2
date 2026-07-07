'use client'

import { usePathname } from 'next/navigation'

export interface PageContext {
  pathname: string
  pageType: 'home' | 'storefront' | 'product' | 'catalog' | 'styles' | 'workspace' | 'other'
  storefrontSlug?: string
  productSlug?: string
  workspaceSection?: string
}

export function usePageContext(): PageContext {
  const pathname = usePathname()

  // /p/[slug] (tienda canónica de partner; /merch/[brand] legacy redirige acá)
  const merchMatch = pathname.match(/^\/p\/([^/]+)$/)
  if (merchMatch) {
    return { pathname, pageType: 'storefront', storefrontSlug: merchMatch[1] }
  }

  // /p/[slug]/[product]
  const productMatch = pathname.match(/^\/p\/([^/]+)\/([^/]+)$/)
  if (productMatch) {
    return { pathname, pageType: 'product', storefrontSlug: productMatch[1], productSlug: productMatch[2] }
  }

  // /workspace/[section]
  const workspaceMatch = pathname.match(/^\/workspace\/?(.*)$/)
  if (workspaceMatch) {
    return { pathname, pageType: 'workspace', workspaceSection: workspaceMatch[1] || 'dashboard' }
  }

  if (pathname === '/styles') return { pathname, pageType: 'styles' }
  if (pathname === '/products' || pathname === '/catalogo') return { pathname, pageType: 'catalog' }
  if (pathname === '/') return { pathname, pageType: 'home' }

  return { pathname, pageType: 'other' }
}

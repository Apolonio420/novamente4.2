import type { NextRequest } from "next/server"

/**
 * Resolves a possibly-relative image URL (e.g. "/api/proxy-image?key=...") to
 * an absolute one usable from server-side fetch. The upload endpoint returns
 * relative paths to keep R2 keys internal, so any endpoint that needs to
 * download those URLs must call this helper first.
 */
export function resolveAbsoluteUrl(url: string, req: NextRequest): string {
  if (!url) return url
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  const origin =
    req.headers.get("origin") ||
    req.nextUrl.origin ||
    `https://${req.headers.get("host") ?? "www.novamente.ar"}`
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`
}

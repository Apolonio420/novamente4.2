/**
 * GET /i/[id]/[n].jpg — Photo proxy for TikTok PULL_FROM_URL (photo carousels).
 *
 * TikTok solo baja de novamente.ar (dominio verificado), pero las fotos las
 * arma el robot en platform (admin.novamente.ar/i/[id]/[n], que resuelve el
 * Content y re-encodea a JPEG). Acá solo se hace stream de esa respuesta —
 * NO redirect: TikTok no sigue redirects en PULL_FROM_URL.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ID_RE = /^[a-z0-9-]{20,40}$/i;
const N_RE = /^([0-9]|[12][0-9]|3[0-4])(\.jpe?g)?$/i;
const UPSTREAM = process.env.ROBOT_PHOTO_PROXY_ORIGIN || "https://admin.novamente.ar";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; n: string }> },
) {
  const { id, n } = await params;
  if (!ID_RE.test(id) || !N_RE.test(n)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const index = Number.parseInt(n, 10);
  const upstream = await fetch(`${UPSTREAM}/i/${id}/${index}.jpg`, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Not found" }, { status: upstream.status === 404 ? 404 : 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") ?? "image/jpeg");
  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);
  headers.set("Cache-Control", "public, max-age=86400");
  return new Response(upstream.body, { status: 200, headers });
}

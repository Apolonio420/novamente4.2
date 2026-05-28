/**
 * GET /v/[id].mp4 — Video proxy for TikTok PULL_FROM_URL.
 *
 * Streams the mp4 from the Robot's Supabase Storage through novamente.ar (the
 * domain verified in the TikTok Dev Portal). TikTok pulls anonymously.
 *
 * Reads Content rows from the Robot Supabase project (ywsoqaclylvrbqfvwofr) via
 * the service role key. This repo's own Supabase project is unrelated — do NOT
 * reuse NEXT_PUBLIC_SUPABASE_URL here.
 *
 * Required env:
 *   ROBOT_SUPABASE_URL                — https://ywsoqaclylvrbqfvwofr.supabase.co
 *   ROBOT_SUPABASE_SERVICE_ROLE_KEY   — service_role key for the Robot project
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ID_RE = /^[a-z0-9-]{20,40}$/i;
const ALLOWED_UPSTREAM_RE = /^https:\/\/[a-z0-9-]+\.supabase\.co\//i;

const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): NextResponse | null {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return null;
  }
  if (bucket.count >= RATE_LIMIT) {
    return NextResponse.json({ error: "Rate limited" }, {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((bucket.resetAt - now) / 1000)),
      },
    });
  }
  bucket.count++;
  return null;
}

let supabaseClient: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const url = process.env.ROBOT_SUPABASE_URL;
  const key = process.env.ROBOT_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("ROBOT_SUPABASE_URL / ROBOT_SUPABASE_SERVICE_ROLE_KEY missing");
  }
  supabaseClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseClient;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const contentId = rawId.replace(/\.mp4$/i, "");

  if (!contentId || !ID_RE.test(contentId)) {
    return NextResponse.json({ error: "Not found" }, {
      status: 404,
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const limited = rateLimit(ip);
  if (limited) return limited;

  let content: { videoUrl: string | null; videoStatus: string | null } | null;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("Content")
      .select("videoUrl, videoStatus")
      .eq("id", contentId)
      .maybeSingle();
    if (error) {
      console.error("[video-proxy] Supabase error:", error.message);
      return NextResponse.json({ error: "Lookup failed" }, { status: 502 });
    }
    content = data as { videoUrl: string | null; videoStatus: string | null } | null;
  } catch (err) {
    console.error("[video-proxy] Init error:", err);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  console.info(
    `[v-proxy] id=${contentId} status=${content?.videoStatus ?? "missing"} range=${request.headers.get("range") ?? "none"}`,
  );

  if (!content?.videoUrl || content.videoStatus !== "DONE") {
    return NextResponse.json({ error: "Not found" }, {
      status: 404,
      headers: { "Cache-Control": "public, max-age=10" },
    });
  }

  if (!ALLOWED_UPSTREAM_RE.test(content.videoUrl)) {
    console.error(`[video-proxy] Blocked non-Supabase URL: ${content.videoUrl.slice(0, 80)}`);
    return NextResponse.json({ error: "Not found" }, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const upstreamHeaders: Record<string, string> = {};
  const rangeHeader = request.headers.get("range");
  if (rangeHeader) upstreamHeaders["Range"] = rangeHeader;

  const upstream = await fetch(content.videoUrl, { headers: upstreamHeaders });
  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json(
      { error: "Upstream fetch failed" },
      { status: upstream.status >= 400 && upstream.status < 500 ? 404 : 502 },
    );
  }

  const responseHeaders = new Headers();
  responseHeaders.set("Content-Type", "video/mp4");
  responseHeaders.set("Accept-Ranges", "bytes");
  responseHeaders.set("Cache-Control", "public, max-age=86400");
  responseHeaders.set("Content-Disposition", `inline; filename="${contentId}.mp4"`);
  responseHeaders.set("Vary", "Range");

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) responseHeaders.set("Content-Length", contentLength);
  const contentRange = upstream.headers.get("content-range");
  if (contentRange) responseHeaders.set("Content-Range", contentRange);

  return new Response(upstream.body, {
    status: upstream.status === 206 ? 206 : 200,
    headers: responseHeaders,
  });
}

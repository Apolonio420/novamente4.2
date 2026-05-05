/**
 * POST /api/drops/[id]/use-design
 *
 * Toma el printUrl del drop y crea una row en la tabla `images` para que
 * el usuario pueda usar ese mismo diseño en otra prenda. Retorna { imageId }
 * para que el cliente redirija a /design/[imageId].
 */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

const PLATFORM_API =
  process.env.NEXT_PUBLIC_PLATFORM_API ?? "https://novamente-platform.vercel.app";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  // 1) Fetch drop metadata from platform
  let printUrl: string | null = null;
  let topic: string | null = null;
  try {
    const r = await fetch(`${PLATFORM_API}/api/public/drop/${id}`, { cache: "no-store" });
    if (!r.ok) {
      return NextResponse.json({ error: `drop fetch ${r.status}` }, { status: 404 });
    }
    const drop = (await r.json()) as { printUrl?: string | null; topic?: string | null };
    printUrl = drop.printUrl ?? null;
    topic = drop.topic ?? null;
  } catch (err) {
    console.error("[use-design] fetch drop failed:", err);
    return NextResponse.json({ error: "failed to fetch drop" }, { status: 500 });
  }

  if (!printUrl) {
    return NextResponse.json(
      { error: "drop has no print artwork available" },
      { status: 422 },
    );
  }

  // 2) Insert minimal row in `images` so /design/[imageId] can render it
  const imageId = randomUUID();
  const cleanTopic = (topic ?? "").replace(/^trend:/, "").trim() || "drop reuse";
  const insertData = {
    id: imageId,
    url: printUrl,
    prompt: cleanTopic,
    storage_key: printUrl,
    is_generated: true,
    has_bg_removed: false,
    meta: { source: "drop-reuse", dropId: id, topic },
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await (supabaseAdmin.from("images") as any).insert(insertData);
    if (error) {
      console.error("[use-design] insert failed:", error);
      // Fallback ultra-mínimo
      const minimal = { id: imageId, url: printUrl, prompt: cleanTopic };
      const { error: e2 } = await (supabaseAdmin.from("images") as any).insert(minimal);
      if (e2) {
        return NextResponse.json({ error: "could not register image" }, { status: 500 });
      }
    }
  } catch (err) {
    console.error("[use-design] insert threw:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  return NextResponse.json({ imageId });
}

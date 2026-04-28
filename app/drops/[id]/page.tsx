/**
 * /drops/[id] — mini-landing pública por cada tweet/drop generado por el robot.
 *
 * Lee la metadata desde el endpoint público de novamente-platform:
 *   GET https://novamente-platform.vercel.app/api/public/drop/[id]
 *
 * Renderiza:
 *   - Lifestyle hero (imagen 1)
 *   - Mockup packshot (imagen 2)
 *   - Copy del tweet
 *   - CTA principal: "Diseñá la tuya con IA" → /design
 *   - CTA secundario: link al tweet original
 *   - OG tags para preview en redes
 */
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";

const PLATFORM_API =
  process.env.NEXT_PUBLIC_PLATFORM_API ?? "https://novamente-platform.vercel.app";

interface Drop {
  id: string;
  copy: string;
  caption: string;
  hashtags: string[];
  lifestyleUrl: string | null;
  mockupUrl: string | null;
  topic: string | null;
  garmentKey: string | null;
  styleId: string | null;
  format: string | null;
  tweetUrl: string | null;
  postedAt: string | null;
}

async function fetchDrop(id: string): Promise<Drop | null> {
  try {
    const r = await fetch(`${PLATFORM_API}/api/public/drop/${id}`, {
      next: { revalidate: 300 },
    });
    if (!r.ok) return null;
    return (await r.json()) as Drop;
  } catch {
    return null;
  }
}

function garmentLabel(key: string | null): string {
  if (!key) return "Prenda Novamente";
  const map: Record<string, string> = {
    "tshirt-black": "Remera Negra",
    "tshirt-white": "Remera Blanca",
    "tshirt-caramel": "Remera Caramel",
    "tshirt-black-oversize": "Remera Oversize Negra",
    "tshirt-white-oversize": "Remera Oversize Blanca",
    "hoodie-black": "Hoodie Negro",
    "hoodie-cream": "Hoodie Crema",
    "hoodie-gray": "Hoodie Gris",
    "hoodie-caramel": "Hoodie Caramel",
  };
  return map[key] ?? "Prenda Novamente";
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const drop = await fetchDrop(id);
  if (!drop) return { title: "Drop no encontrado | Novamente" };

  const title = `${garmentLabel(drop.garmentKey)} — Drop único Novamente`;
  const description =
    drop.caption ||
    `Diseño exclusivo creado con IA y estampado en una ${garmentLabel(drop.garmentKey)} real. Producción DTG en Argentina.`;
  const image = drop.lifestyleUrl ?? drop.mockupUrl ?? "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image, width: 1080, height: 1350 }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function DropPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const drop = await fetchDrop(id);
  if (!drop) notFound();

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Hero */}
        <div className="grid gap-6 md:grid-cols-2 md:gap-10">
          {drop.lifestyleUrl ? (
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-900">
              <Image
                src={drop.lifestyleUrl}
                alt={drop.caption || garmentLabel(drop.garmentKey)}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ) : null}

          {drop.mockupUrl ? (
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-900">
              <Image
                src={drop.mockupUrl}
                alt={`${garmentLabel(drop.garmentKey)} packshot`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
              />
            </div>
          ) : null}
        </div>

        {/* Info */}
        <div className="mt-10 max-w-3xl">
          <p className="text-xs uppercase tracking-widest text-neutral-400">
            Drop único · Generado con IA
          </p>
          <h1 className="mt-2 text-3xl font-bold md:text-5xl">
            {garmentLabel(drop.garmentKey)}
          </h1>

          <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-neutral-200">
            {drop.copy}
          </p>

          {drop.hashtags?.length ? (
            <p className="mt-4 text-sm text-neutral-400">
              {drop.hashtags.map((h) => `#${h}`).join(" ")}
            </p>
          ) : null}

          {/* CTAs */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href="/design"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
            >
              Diseñá la tuya con IA →
            </a>
            <a
              href="/cotizador"
              className="inline-flex items-center justify-center rounded-full border border-neutral-700 px-6 py-3 text-sm font-semibold text-neutral-100 transition hover:border-neutral-500"
            >
              Ver precios y plazos
            </a>
            {drop.tweetUrl ? (
              <a
                href={drop.tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-neutral-300 transition hover:text-white"
              >
                Ver en X ↗
              </a>
            ) : null}
          </div>

          <div className="mt-12 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-sm text-neutral-300">
            <p className="font-semibold text-neutral-100">¿Cómo funciona?</p>
            <p className="mt-2">
              Cada drop es único: nuestro sistema genera un diseño exclusivo y lo
              estampa con tecnología DTG sobre una prenda real Novamente. Si te gusta
              uno, podés pedir el tuyo o crear el que quieras desde cero. Sin stock —
              producimos cuando lo pedís.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

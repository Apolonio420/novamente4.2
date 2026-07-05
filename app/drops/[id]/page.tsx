/**
 * /drops/[id] — Product page del drop generado por el robot de tweets.
 * Integrada al storefront real de novamente.ar: Navbar + Footer + cart store + checkout MercadoPago.
 *
 * Server component: fetcha la metadata del drop desde el endpoint público de novamente-platform
 * y delega la UI interactiva (carrito, selector de talle, MP) a DropClient.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DropClient from "./DropClient";
import { type Drop, garmentLabel } from "./drop-types";

const PLATFORM_API =
  process.env.NEXT_PUBLIC_PLATFORM_API ?? "https://novamente-platform.vercel.app";
const BASE_URL = "https://www.novamente.ar";

async function fetchDrop(id: string): Promise<Drop | null> {
  const url = `${PLATFORM_API}/api/public/drop/${id}`;
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) {
      console.error(`[drops] fetch ${url} → HTTP ${r.status}`);
      return null;
    }
    return (await r.json()) as Drop;
  } catch (err) {
    console.error(`[drops] fetch ${url} threw:`, err);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const drop = await fetchDrop(id);
  if (!drop) return { title: "Drop no encontrado" };

  const title = `${garmentLabel(drop.garmentKey)} — Drop único`;
  const description =
    drop.caption ||
    `Diseño único creado con IA y estampado en una ${garmentLabel(drop.garmentKey)} real Novamente. Producción DTG en Argentina, sin stock muerto.`;
  const image = drop.lifestyleUrl ?? drop.mockupUrl ?? "";
  const url = `${BASE_URL}/drops/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Novamente",
      locale: "es_AR",
      type: "website",
      images: image ? [{ url: image, width: 1080, height: 1350 }] : [],
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
  return <DropClient drop={drop} />;
}

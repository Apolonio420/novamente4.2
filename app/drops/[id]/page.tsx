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

const PLATFORM_API =
  process.env.NEXT_PUBLIC_PLATFORM_API ?? "https://novamente-platform.vercel.app";
const BASE_URL = "https://www.novamente.ar";

export interface Drop {
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

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const drop = await fetchDrop(id);
  if (!drop) return { title: "Drop no encontrado · Novamente" };

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

export function garmentLabel(key: string | null): string {
  if (!key) return "Prenda Novamente";
  const map: Record<string, string> = {
    "tshirt-black": "Remera Clásica Negra",
    "tshirt-white": "Remera Clásica Blanca",
    "tshirt-caramel": "Remera Clásica Caramel",
    "tshirt-black-oversize": "Aura Oversize T-Shirt Negra",
    "tshirt-white-oversize": "Aura Oversize T-Shirt Blanca",
    "hoodie-black": "Buzo Hoodie Oversize Negro",
    "hoodie-cream": "Buzo Hoodie Oversize Crema",
    "hoodie-gray": "Buzo Hoodie Oversize Gris",
    "hoodie-caramel": "Buzo Hoodie Oversize Caramel",
  };
  return map[key] ?? "Prenda Novamente";
}

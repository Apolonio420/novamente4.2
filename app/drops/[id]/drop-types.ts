/**
 * Tipos y helpers compartidos entre server (page.tsx) y client (DropClient.tsx).
 * NO tiene "use client" ni "use server" — code-only que ambos pueden importar.
 */

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

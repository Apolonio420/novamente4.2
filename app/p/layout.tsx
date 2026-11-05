/**
 * Las tiendas de partner (/p/*) son la marca de otro: banner, logo y colores se
 * eligieron sobre fondo oscuro. Quedan en oscuro aunque la web de Novamente esté
 * en claro (Juan 05/11: el tema claro es para el sitio de Novamente).
 */
export default function PartnerStoreLayout({ children }: { children: React.ReactNode }) {
  return <div className="dark min-h-screen bg-zinc-950 text-zinc-100">{children}</div>
}

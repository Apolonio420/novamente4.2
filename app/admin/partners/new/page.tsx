import Link from "next/link"
import PartnerForm from "@/components/admin/partners/PartnerForm"

export default function NewPartnerPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/admin/partners"
            className="text-zinc-500 hover:text-white text-sm transition-colors"
          >
            ← Volver a partners
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-3">Nuevo partner</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Completá los datos y subí los assets. Al guardar se escribe{" "}
            <code className="text-zinc-300 font-mono">src/data/partners.ts</code> con backup automático.
          </p>
        </div>
        <PartnerForm mode="create" />
      </div>
    </div>
  )
}

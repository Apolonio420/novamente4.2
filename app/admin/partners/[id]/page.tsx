import Link from "next/link"
import { notFound } from "next/navigation"
import { getPartnerById } from "@/src/data/partners"
import PartnerForm from "@/components/admin/partners/PartnerForm"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPartnerPage({ params }: Props) {
  const { id } = await params
  const partner = getPartnerById(id)
  if (!partner) notFound()

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
          <div className="flex items-center gap-3 mt-3">
            <h1 className="text-3xl font-bold tracking-tight">{partner.name}</h1>
            <span className="text-zinc-500 font-mono text-sm">/{partner.id}</span>
          </div>
          <p className="text-zinc-400 text-sm mt-1">
            Editando partner existente — los cambios sobrescriben{" "}
            <code className="text-zinc-300 font-mono">src/data/partners.ts</code> (con backup automático).
          </p>
        </div>
        <PartnerForm mode="edit" initial={partner} />
      </div>
    </div>
  )
}

import { NextResponse } from "next/server"
import { partners } from "@/src/data/partners"
import { writePartners } from "@/lib/admin/partnerWriter"
import type { Partner } from "@/src/data/partners"

// GET /api/admin/partners/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const partner = partners.find((p) => p.id === id)
  if (!partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 })
  }
  return NextResponse.json({ partner })
}

// PUT /api/admin/partners/[id] — full replace of a partner
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json() as Partner
    const idx = partners.findIndex((p) => p.id === id)
    if (idx === -1) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }
    const updated = [...partners]
    updated[idx] = { ...updated[idx], ...body, id }
    writePartners(updated)
    return NextResponse.json({ success: true, partner: updated[idx] })
  } catch (err) {
    console.error("[admin/partners/[id]] PUT error", err)
    return NextResponse.json({ error: "Failed to update partner" }, { status: 500 })
  }
}

// DELETE /api/admin/partners/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const idx = partners.findIndex((p) => p.id === id)
    if (idx === -1) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }
    const updated = partners.filter((p) => p.id !== id)
    writePartners(updated)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[admin/partners/[id]] DELETE error", err)
    return NextResponse.json({ error: "Failed to delete partner" }, { status: 500 })
  }
}

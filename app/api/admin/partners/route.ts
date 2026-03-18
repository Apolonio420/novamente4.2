import { NextResponse } from "next/server"
import { partners } from "@/src/data/partners"
import { writePartners } from "@/lib/admin/partnerWriter"
import type { Partner } from "@/src/data/partners"

// GET /api/admin/partners — returns all partners
export async function GET() {
  try {
    return NextResponse.json({ partners })
  } catch (err) {
    console.error("[admin/partners] GET error", err)
    return NextResponse.json({ error: "Failed to read partners" }, { status: 500 })
  }
}

// POST /api/admin/partners — create a new partner
export async function POST(req: Request) {
  try {
    const body = await req.json() as Partner
    if (!body.id || !body.name) {
      return NextResponse.json({ error: "id and name are required" }, { status: 400 })
    }
    // Prevent duplicate slugs
    const exists = partners.find((p) => p.id === body.id)
    if (exists) {
      return NextResponse.json({ error: `Partner with id "${body.id}" already exists` }, { status: 409 })
    }
    const newPartner: Partner = { products: [], ...body }
    const updated = [...partners, newPartner]
    writePartners(updated)
    return NextResponse.json({ success: true, partner: newPartner })
  } catch (err) {
    console.error("[admin/partners] POST error", err)
    return NextResponse.json({ error: "Failed to create partner" }, { status: 500 })
  }
}

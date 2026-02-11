import { NextResponse } from "next/server"
import { getPublishableProducts } from "@/lib/products"
import { PARTNER_PRICE_BY_ID_ARS } from "@/lib/partnerPrices"

export const dynamic = "force-dynamic"

/**
 * Meta Commerce Product Feed (TSV format)
 * 
 * This endpoint provides a TSV feed for Meta Commerce Manager.
 * URL: https://www.novamente.ar/meta/catalog
 * 
 * Format: Tab-separated values with UTF-8 encoding
 * Columns: id, title, description, availability, condition, price, link, image_link, brand
 * 
 * NOTE: Uses partner prices (OnDemand_Precio_Nuevo) from lib/partnerPrices.ts
 */
export async function GET() {
    try {
        const products = getPublishableProducts()

        // TSV Header
        const header = [
            "id",
            "title",
            "description",
            "availability",
            "condition",
            "price",
            "link",
            "image_link",
            "brand"
        ].join("\t")

        // TSV Rows
        const rows = products.map(product => {
            const metaId = `novamente_${product.id}`
            const availability = product.inStock ? "in stock" : "out of stock"
            const condition = "new"

            // Use partner price if available, otherwise fall back to product price
            const partnerPrice = PARTNER_PRICE_BY_ID_ARS[product.id]
            const price = partnerPrice
                ? `${partnerPrice} ARS`
                : `${product.price} ${product.currency}`

            const link = "https://www.novamente.ar/products"
            const brand = "NovaMente"

            return [
                metaId,
                product.title,
                product.description,
                availability,
                condition,
                price,
                link,
                product.imageUrl,
                brand
            ].join("\t")
        })

        // Combine header and rows
        const tsvContent = [header, ...rows].join("\n")

        // Return TSV response with proper headers
        return new NextResponse(tsvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/tab-separated-values; charset=utf-8",
                "Cache-Control": "public, max-age=3600", // Cache for 1 hour
            },
        })
    } catch (error) {
        console.error("[Meta Feed] Error generating TSV feed:", error)
        return new NextResponse("Error generating product feed", { status: 500 })
    }
}

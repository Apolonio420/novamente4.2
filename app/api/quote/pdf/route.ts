// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { quoteSchema } from "@/lib/quote-schema";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotePdfDocument } from "@/components/QuotePdfDocument";
import React from "react";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate input
        const validation = quoteSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Datos invalidos", details: validation.error.format() },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Generate a simple budget number (e.g., NM + timestamp last 4 digits)
        const quoteNumber = `NM-${new Date().getTime().toString().slice(-4)}`;

        // Render PDF to buffer
        const buffer = await renderToBuffer(
            React.createElement(QuotePdfDocument, { data, quoteNumber })
        );

        // Prepare filename: "Presupuesto - <NOMBRE_CLIENTE> - <YYYY-MM-DD>.pdf"
        const sanitizedClientName = data.clientName
            .replace(/[/\\:*?"<>|]/g, "") // Sanitize forbidden characters
            .trim();
        const dateStr = new Date().toISOString().split("T")[0];
        const filename = `Presupuesto - ${sanitizedClientName} - ${dateStr}.pdf`;

        // Return response with PDF
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("PDF Generation Error:", error);
        return NextResponse.json(
            { error: "Error al generar el PDF" },
            { status: 500 }
        );
    }
}

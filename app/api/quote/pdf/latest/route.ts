import { NextResponse } from "next/server";
import { quoteSchema } from "@/lib/quote-schema";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotePdfDocument } from "@/components/QuotePdfDocument";
import React from "react";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        const dataPath = path.join(process.cwd(), "tmp/quote_request.json");
        if (!fs.existsSync(dataPath)) {
            return NextResponse.json({ error: "No data found in tmp/quote_request.json" }, { status: 404 });
        }

        const body = JSON.parse(fs.readFileSync(dataPath, "utf8"));

        // Validate input
        const validation = quoteSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Datos invalidos en cache", details: validation.error.format() },
                { status: 400 }
            );
        }

        const data = validation.data;
        const quoteNumber = `NM-${new Date().getTime().toString().slice(-4)}`;

        // Render PDF to buffer
        const buffer = await renderToBuffer(
            React.createElement(QuotePdfDocument, { data, quoteNumber })
        );

        // Prepare filename
        const sanitizedClientName = data.clientName.replace(/[/\\:*?"<>|]/g, "").trim();
        const dateStr = new Date().toISOString().split("T")[0];
        const filename = `Presupuesto - ${sanitizedClientName} - ${dateStr}.pdf`;

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("PDF Final Generation Error:", error);
        return NextResponse.json({ error: "Error al generar el PDF" }, { status: 500 });
    }
}

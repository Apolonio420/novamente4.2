import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        const dataPath = path.join(process.cwd(), "tmp/quote_request.json");
        if (!fs.existsSync(dataPath)) {
            return NextResponse.json({ error: "No data found in tmp/quote_request.json" }, { status: 404 });
        }
        const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
    }
}

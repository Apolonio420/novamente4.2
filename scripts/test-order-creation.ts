
import { createOrder } from "../lib/db";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load environment variables manually
try {
    const envPath = resolve(__dirname, "../.env.local");
    const envConfig = readFileSync(envPath, "utf-8");
    envConfig.split("\n").forEach((line) => {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
            const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
            process.env[key.trim()] = value;
        }
    });
} catch (e) {
    console.warn("⚠️ Could not load .env.local");
}

async function main() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    console.log("🌍 Supabase URL:", url);
    console.log("🌍 Supabase URL type:", url.includes("localhost") || url.includes("127.0.0.1") ? "LOCAL" : "REMOTE (supabase.co)");
    console.log("🚀 Testing createOrder...");

    const mockOrder = {
        customer_email: "test@example.com",
        customer_first_name: "Test",
        customer_last_name: "User",
        shipping_address: "123 Test St",
        shipping_city: "Test City",
        payment_method: "mercadopago" as const, // Fix type literal
        subtotal: 100,
        shipping_cost: 0,
        total: 100,
        items: [
            {
                item_name: "Test Item",
                product_type: "t-shirt",
                product_color: "black",
                product_size: "M",
                quantity: 1,
                unit_price: 100,
                total_price: 100,
                image_url: "https://example.com/image.png",
                mockup_url: "https://example.com/mockup.png",
            }
        ]
    };

    try {
        const order = await createOrder(mockOrder as any); // Cast to avoid strict type checks for quick test
        if (order) {
            console.log("✅ Order created successfully:", order.id);
        } else {
            console.error("❌ createOrder returned null. Check previous logs for details.");
        }
    } catch (error) {
        console.error("❌ Exception during test:", error);
    }

    // Verify columns via Select
    try {
        console.log("🔍 Verifying 'orders' columns explicitly...");
        const { supabaseAdmin } = require("../lib/supabase-admin");

        // Check ID
        const { error: idError } = await supabaseAdmin.from("orders").select("id").limit(1);
        console.log("Checking 'id':", idError ? `❌ Error: ${idError.message}` : "✅ Exists");

        // Check customer_email
        const { error: emailError } = await supabaseAdmin.from("orders").select("customer_email").limit(1);
        console.log("Checking 'customer_email':", emailError ? `❌ Error: ${emailError.message}` : "✅ Exists");

        // Check order_number
        const { error: numError } = await supabaseAdmin.from("orders").select("order_number").limit(1);
        console.log("Checking 'order_number':", numError ? `❌ Error: ${numError.message}` : "✅ Exists");

        // Check total
        const { error: totalError } = await supabaseAdmin.from("orders").select("total").limit(1);
        console.log("Checking 'total':", totalError ? `❌ Error: ${totalError.message}` : "✅ Exists");

        // Check total_amount
        const { error: totalAmountError } = await supabaseAdmin.from("orders").select("total_amount").limit(1);
        console.log("Checking 'total_amount':", totalAmountError ? `❌ Error: ${totalAmountError.message}` : "✅ Exists");

        // Verify order_items columns
        console.log("🔍 Verifying 'order_items' columns explicitly...");

        // Check name vs item_name
        const { error: nameError } = await supabaseAdmin.from("order_items").select("name").limit(1);
        console.log("Checking 'order_items.name':", nameError ? `❌ Error: ${nameError.message}` : "✅ Exists");

        const { error: itemNameError } = await supabaseAdmin.from("order_items").select("item_name").limit(1);
        console.log("Checking 'order_items.item_name':", itemNameError ? `❌ Error: ${itemNameError.message}` : "✅ Exists");

        // Check price columns
        const { error: priceError } = await supabaseAdmin.from("order_items").select("price").limit(1);
        console.log("Checking 'order_items.price':", priceError ? `❌ Error: ${priceError.message}` : "✅ Exists");

        const { error: unitPriceError } = await supabaseAdmin.from("order_items").select("unit_price").limit(1);
        console.log("Checking 'order_items.unit_price':", unitPriceError ? `❌ Error: ${unitPriceError.message}` : "✅ Exists");

        // Check garment columns
        const { error: garmentTypeError } = await supabaseAdmin.from("order_items").select("garment_type").limit(1);
        console.log("Checking 'order_items.garment_type':", garmentTypeError ? `❌ Error: ${garmentTypeError.message}` : "✅ Exists");

        const { error: colorError } = await supabaseAdmin.from("order_items").select("color").limit(1);
        console.log("Checking 'order_items.color':", colorError ? `❌ Error: ${colorError.message}` : "✅ Exists");

        const { error: prodColorError } = await supabaseAdmin.from("order_items").select("product_color").limit(1);
        console.log("Checking 'order_items.product_color':", prodColorError ? `❌ Error: ${prodColorError.message}` : "✅ Exists");

        const { error: sizeError } = await supabaseAdmin.from("order_items").select("size").limit(1);
        console.log("Checking 'order_items.size':", sizeError ? `❌ Error: ${sizeError.message}` : "✅ Exists");

        const { error: mockupError } = await supabaseAdmin.from("order_items").select("mockup_url").limit(1);
        console.log("Checking 'order_items.mockup_url':", mockupError ? `❌ Error: ${mockupError.message}` : "✅ Exists");


    } catch (e) {
        console.error("❌ Error inspecting schema:", e);
    }
}
// Remove the old calling of main if it was there twice
// main(); is at the end of file


main();


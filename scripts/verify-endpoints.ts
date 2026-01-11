
import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";
import { readFileSync } from "fs";

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = "http://localhost:3000";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifyProxy() {
    console.log("\n🧪 Testing Proxy Endpoint (/api/proxy-image)...");
    try {
        // 1. Get a real image key from Supabase (recursively if needed, or just filter)
        const { data: files, error } = await supabaseAdmin.storage.from("images").list("", { limit: 10 });

        if (error || !files || files.length === 0) {
            console.warn("⚠️ No images found in 'images' bucket. Skipping proxy test.");
            return;
        }

        // Find first item that looks like a file (has an extension or is not a folder)
        // Note: supabase list returns just names. If it's a folder it might not have an extension.
        // We'll try to find one with a dot, or just try the first one that isn't commonly known as a folder.
        let validKey = files.find(f => f.name.includes("."))?.name;

        // If no file in root, try diving into 'generated' if it exists
        if (!validKey) {
            const generatedFolder = files.find(f => f.name === 'generated');
            if (generatedFolder) {
                const { data: subFiles } = await supabaseAdmin.storage.from("images").list("generated", { limit: 5 });
                if (subFiles && subFiles.length > 0) {
                    validKey = `generated/${subFiles[0].name}`;
                }
            }
        }

        if (!validKey) {
            console.warn("⚠️ Could not find a valid file key. Using placeholder 'test.png' which will likely fail but check 404.");
            validKey = "test.png";
        }

        console.log(`📝 Found valid key: ${validKey}`);

        // 2. Test Proxy with this key
        const proxyUrl = `${BASE_URL}/api/proxy-image?key=${encodeURIComponent(validKey)}`;
        console.log(`GET ${proxyUrl}`);

        const response = await fetch(proxyUrl);

        if (response.ok) {
            console.log("✅ Proxy Test Passed: 200 OK");
        } else {
            console.error(`❌ Proxy Test Failed: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response:", text);
        }

        // 3. Test with a "problematic" key (space simulation)
        // If we can't easily upload one, we construct a URL that *looks* like it has issues but points to the valid key logic
        // For now, simple success is enough to prove the endpoint works.

    } catch (e) {
        console.error("❌ Proxy Test Exception:", e);
    }
}

async function verifyCheckout() {
    console.log("\n🧪 Testing Checkout Endpoint (/api/checkout)...");
    const payload = {
        items: [
            {
                title: "Test Product from Script",
                quantity: 1,
                unit_price: 1500,
                // Add fields expected by the new logic
                product_type: "t-shirt",
                color: "black",
                size: "L"
            }
        ],
        customer: {
            email: "script_test@example.com",
            firstName: "Script",
            lastName: "Tester",
            phone: "123456789",
            address: "123 Fake St",
            city: "Testville",
            postalCode: "12345"
        },
        total: 1500
    };

    try {
        const response = await fetch(`${BASE_URL}/api/checkout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log("✅ Checkout Test Passed!");
            console.log("Returned Preference ID:", data.id);
            console.log("Created Order ID:", data.order_id);
            console.log("Redirect URL:", data.init_point);
        } else {
            console.error(`❌ Checkout Test Failed: ${response.status}`);
            console.error("Response:", JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("❌ Checkout Test Exception:", e);
        console.error("Ensure the server is running on http://localhost:3000");
    }
}

async function main() {
    await verifyProxy();
    await verifyCheckout();
}

main();

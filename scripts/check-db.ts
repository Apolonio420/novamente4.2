import { supabaseAdmin } from './lib/supabase-admin.ts';

async function checkDb() {
    const imageId = '0fbacb91-67bd-4a31-b214-5be205978046';
    console.log(`🔎 Checking database for imageId: ${imageId}`);

    const { data, error } = await supabaseAdmin
        .from('images')
        .select('*')
        .eq('id', imageId)
        .single();

    if (error) {
        console.error("❌ DB Check failed:", error.message);
    } else if (data) {
        console.log("✅ DB Check: SUCCESS");
        console.log("📄 Record found:", JSON.stringify(data, null, 2));
    } else {
        console.log("❓ Record not found, but API reported success. Checking if it used a different table or failed silently.");
    }
}

checkDb();

const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return;
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
            let val = match[2].trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            process.env[match[1].trim()] = val;
        }
    });
}

loadEnv();

async function runAudit() {
    console.log('🚀 Starting History & Proxy Audit...\n');
    const baseUrl = 'http://localhost:3000';
    const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

    try {
        // 1. Create a design (will fallback to Supabase locally)
        console.log('--- Step 1: Creating a test design (Supabase Fallback) ---');
        const apiRes = await fetch(`${baseUrl}/api/process-design`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageUrl: `data:image/png;base64,${testBuffer.toString('base64')}`,
                prompt: 'Audit History Fix',
                meta: { audit: true }
            })
        });

        if (!apiRes.ok) throw new Error(`API failed: ${apiRes.status}`);
        const apiData = await apiRes.json();
        const imageId = apiData.image.id;
        console.log(`✅ Design created: ${imageId}`);

        // 2. Fetch history via API
        console.log('\n--- Step 2: Fetching User History ---');
        const historyRes = await fetch(`${baseUrl}/api/user/session`); // Or wherever history is fetched
        // Wait, history is usually fetched via specific user/session endpoints. 
        // Let's use the Image Detail API which uses the same resolveUrl logic.
        const detailRes = await fetch(`${baseUrl}/api/images/${imageId}`);
        const detailData = await detailRes.json();

        if (detailData.success && detailData.image) {
            const finalUrl = detailData.image.url;
            console.log(`✅ Resolved URL: ${finalUrl}`);

            // 3. Test Proxy resolution
            if (finalUrl.includes('proxy-image?key=')) {
                console.log('🌐 Testing Proxy Retrieval...');
                const fullProxyUrl = finalUrl.startsWith('/') ? `${baseUrl}${finalUrl}` : finalUrl;
                const proxyRes = await fetch(fullProxyUrl);
                if (proxyRes.ok) {
                    console.log(`✅ PROXY RETRIEVAL SUCCESS! Content-Type: ${proxyRes.headers.get('content-type')}`);
                } else {
                    console.error(`❌ PROXY RETRIEVAL FAILED: ${proxyRes.status}`);
                }
            } else {
                console.log('ℹ️ URL is direct (Supabase or DataURI). Fetching directly...');
                const directRes = await fetch(finalUrl.startsWith('/') ? `${baseUrl}${finalUrl}` : finalUrl);
                if (directRes.ok) console.log('✅ DIRECT FETCH SUCCESS!');
            }
        }

    } catch (error) {
        console.error('❌ Audit failed:', error.message);
    }
}

runAudit();

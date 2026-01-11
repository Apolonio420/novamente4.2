async function testPartnerAPI() {
    console.log("🚀 Testing Partner API...")

    const testData = {
        fullName: "Test User",
        email: "test@example.com",
        phone: "123456789",
        brandName: "Test Brand",
        instagramHandle: "@testbrand",
        websiteUrl: "https://test.com",
        message: "This is a test application from the script."
    }

    try {
        const response = await fetch("http://localhost:3000/api/partners", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(testData),
        })

        const result = await response.json()
        console.log("Response status:", response.status)
        console.log("Result:", JSON.stringify(result, null, 2))

        if (response.ok) {
            console.log("✅ API test passed!")
        } else {
            console.log("❌ API test failed!")
        }
    } catch (error) {
        console.error("❌ Error testing API:", error)
    }
}

testPartnerAPI()

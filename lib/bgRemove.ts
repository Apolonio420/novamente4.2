export async function removeBackground(imageUrl: string) {
  try {
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVE_BG_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        size: "auto",
        format: "png",
      }),
    })

    if (!response.ok) {
      throw new Error(`Remove.bg API error: ${response.statusText}`)
    }

    const data = await response.arrayBuffer()

    // Convert the image data to base64
    const base64Image = Buffer.from(data).toString("base64")
    return `data:image/png;base64,${base64Image}`
  } catch (error) {
    console.error("Error removing background:", error)
    throw error
  }
}

import sharp from "sharp"

/**
 * Analyzes an image to detect potential UI artifacts like rulers, frames, or color palettes
 * @param buffer The image buffer to analyze
 * @returns "good" if no UI artifacts are detected, "bad" if artifacts are likely present
 */
export async function analyzeImage(imageBuffer: Buffer): Promise<"good" | "bad"> {
  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata()
    const { width, height } = metadata

    if (!width || !height) {
      console.error("Could not determine image dimensions")
      return "good" // Default to good if we can't analyze
    }

    // Check the outer border for dark pixels (potential UI frame)
    const borderSize = 40
    const darkPixelThreshold = 120
    const darkPixelRatioThreshold = 0.08

    // Extract edges
    const topEdge = await sharp(imageBuffer).extract({ left: 0, top: 0, width, height: borderSize }).raw().toBuffer()
    const bottomEdge = await sharp(imageBuffer)
      .extract({ left: 0, top: height - borderSize, width, height: borderSize })
      .raw()
      .toBuffer()
    const leftEdge = await sharp(imageBuffer).extract({ left: 0, top: 0, width: borderSize, height }).raw().toBuffer()
    const rightEdge = await sharp(imageBuffer)
      .extract({ left: width - borderSize, top: 0, width: borderSize, height })
      .raw()
      .toBuffer()

    // Check dark pixel ratios in edges
    const topEdgeDarkRatio = countDarkPixels(topEdge, width * borderSize, darkPixelThreshold) / (width * borderSize)
    const bottomEdgeDarkRatio =
      countDarkPixels(bottomEdge, width * borderSize, darkPixelThreshold) / (width * borderSize)
    const leftEdgeDarkRatio = countDarkPixels(leftEdge, height * borderSize, darkPixelThreshold) / (height * borderSize)
    const rightEdgeDarkRatio =
      countDarkPixels(rightEdge, height * borderSize, darkPixelThreshold) / (height * borderSize)

    // Check for horizontal and vertical lines (potential rulers or toolbars)
    const hasHorizontalLines =
      detectStraightLines(topEdge, width, borderSize, true, darkPixelThreshold) ||
      detectStraightLines(bottomEdge, width, borderSize, true, darkPixelThreshold)

    const hasVerticalLines =
      detectStraightLines(leftEdge, borderSize, height, false, darkPixelThreshold) ||
      detectStraightLines(rightEdge, borderSize, height, false, darkPixelThreshold)

    // Check for color palette patterns in corners
    const cornerSize = 80
    const topLeftCorner = await sharp(imageBuffer)
      .extract({ left: 0, top: 0, width: cornerSize, height: cornerSize })
      .raw()
      .toBuffer()

    const topRightCorner = await sharp(imageBuffer)
      .extract({ left: width - cornerSize, top: 0, width: cornerSize, height: cornerSize })
      .raw()
      .toBuffer()

    const hasColorPalette =
      detectColorPalettePattern(topLeftCorner, cornerSize) || detectColorPalettePattern(topRightCorner, cornerSize)

    // Log analysis results
    console.log("🔍 IMAGE ANALYSIS RESULTS:")
    console.log(
      `Dark pixel ratios - Top: ${topEdgeDarkRatio.toFixed(3)}, Bottom: ${bottomEdgeDarkRatio.toFixed(3)}, Left: ${leftEdgeDarkRatio.toFixed(3)}, Right: ${rightEdgeDarkRatio.toFixed(3)}`,
    )
    console.log(`Straight lines detected - Horizontal: ${hasHorizontalLines}, Vertical: ${hasVerticalLines}`)
    console.log(`Color palette detected: ${hasColorPalette}`)

    // Determine if the image has UI artifacts
    const hasDarkEdges =
      topEdgeDarkRatio > darkPixelRatioThreshold ||
      bottomEdgeDarkRatio > darkPixelRatioThreshold ||
      leftEdgeDarkRatio > darkPixelRatioThreshold ||
      rightEdgeDarkRatio > darkPixelRatioThreshold

    const hasUIArtifacts = hasDarkEdges || hasHorizontalLines || hasVerticalLines || hasColorPalette

    if (hasUIArtifacts) {
      console.log("❌ UI ARTIFACTS DETECTED - Image needs regeneration")
      return "bad"
    }

    console.log("✅ NO UI ARTIFACTS DETECTED - Image is clean")
    return "good"
  } catch (error) {
    console.error("Error analyzing image:", error)
    return "good" // Default to good if analysis fails
  }
}

/**
 * Counts dark pixels in a raw buffer
 */
function countDarkPixels(buffer: Buffer, pixelCount: number, threshold: number): number {
  let darkPixels = 0
  const channels = buffer.length / pixelCount

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * channels
    const r = buffer[offset] || 255
    const g = buffer[offset + 1] || 255
    const b = buffer[offset + 2] || 255

    // Calculate brightness (simple average)
    const brightness = (r + g + b) / 3

    if (brightness < threshold) {
      darkPixels++
    }
  }

  return darkPixels
}

/**
 * Detects straight lines in an edge region
 */
function detectStraightLines(
  buffer: Buffer,
  width: number,
  height: number,
  isHorizontal: boolean,
  threshold: number,
): boolean {
  const channels = buffer.length / (width * height)
  const lineThreshold = isHorizontal ? width * 0.2 : height * 0.2 // 20% of edge length

  if (isHorizontal) {
    // Check for horizontal lines
    for (let y = 0; y < height; y++) {
      let consecutiveDarkPixels = 0
      let maxConsecutive = 0

      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * channels
        const r = buffer[offset] || 255
        const g = buffer[offset + 1] || 255
        const b = buffer[offset + 2] || 255

        const brightness = (r + g + b) / 3

        if (brightness < threshold) {
          consecutiveDarkPixels++
          maxConsecutive = Math.max(maxConsecutive, consecutiveDarkPixels)
        } else {
          consecutiveDarkPixels = 0
        }
      }

      if (maxConsecutive > lineThreshold) {
        return true
      }
    }
  } else {
    // Check for vertical lines
    for (let x = 0; x < width; x++) {
      let consecutiveDarkPixels = 0
      let maxConsecutive = 0

      for (let y = 0; y < height; y++) {
        const offset = (y * width + x) * channels
        const r = buffer[offset] || 255
        const g = buffer[offset + 1] || 255
        const b = buffer[offset + 2] || 255

        const brightness = (r + g + b) / 3

        if (brightness < threshold) {
          consecutiveDarkPixels++
          maxConsecutive = Math.max(maxConsecutive, consecutiveDarkPixels)
        } else {
          consecutiveDarkPixels = 0
        }
      }

      if (maxConsecutive > lineThreshold) {
        return true
      }
    }
  }

  return false
}

/**
 * Detects color palette patterns (grid of different colored squares)
 */
function detectColorPalettePattern(buffer: Buffer, size: number): boolean {
  const channels = buffer.length / (size * size)
  const gridSize = 4 // Look for 4x4 grid patterns
  const cellSize = Math.floor(size / gridSize)

  // Skip if corner is too small
  if (cellSize < 3) return false

  let distinctColors = 0
  const colorHashes = new Set<string>()

  // Sample colors from grid cells
  for (let gridY = 0; gridY < gridSize; gridY++) {
    for (let gridX = 0; gridX < gridSize; gridX++) {
      // Sample from center of each cell
      const centerX = gridX * cellSize + Math.floor(cellSize / 2)
      const centerY = gridY * cellSize + Math.floor(cellSize / 2)

      const offset = (centerY * size + centerX) * channels
      const r = buffer[offset] || 0
      const g = buffer[offset + 1] || 0
      const b = buffer[offset + 2] || 0

      // Skip very dark or very light colors
      const brightness = (r + g + b) / 3
      if (brightness < 20 || brightness > 235) continue

      // Create a simple color hash
      const colorHash = `${Math.floor(r / 10)},${Math.floor(g / 10)},${Math.floor(b / 10)}`
      colorHashes.add(colorHash)
    }
  }

  distinctColors = colorHashes.size

  // If we have many distinct colors in a grid pattern, it might be a color palette
  return distinctColors >= 6
}

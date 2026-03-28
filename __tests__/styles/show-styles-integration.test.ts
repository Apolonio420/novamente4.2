// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Read the hardcoded SHOW_STYLES slugs directly from PublicAssistant.tsx source
// to verify they match the actual style catalogs

const PUBLIC_ASSISTANT_PATH = path.resolve(
  __dirname,
  "../../components/PublicAssistant.tsx"
);

// The 8 hardcoded slugs in the SHOW_STYLES action (line ~862)
const SHOW_STYLES_HARDCODED = [
  "acuarela-leon",
  "geometrico-colibri",
  "pixel-art-astronauta",
  "pop-art-comic",
  "japones-gran-ola",
  "retro-vaporwave-synthwave",
  "line-art-retrato",
  "surrealista-leopardo",
];

// BASE_STYLES slugs from StyleGallery.tsx (the gallery's own catalog)
const BASE_STYLES_SLUGS = [
  "acuarela-leon",
  "geometrico-aguila",
  "pixel-art-astronauta",
  "pop-art-retrato",
  "retro-vaporwave-palmera",
  "surrealista-leopardo",
  "urbano-muscle-car",
  "japones-gran-ola",
  "line-art-planta",
  "line-art-retrato",
  "retro-good-vibes",
  "botanico-vintage",
  "psicodelico-rostro-1",
  "psicodelico-rostro-2",
  "pop-art-comic",
  "mandala-floral",
  "bauhaus-geometrico",
  "alquimia-ojo-dorado",
  "retro-endless-summer",
  "pop-art-auto",
  "pop-art-sandia",
  "retro-cassette",
  "retro-typewriter",
  "retro-vaporwave-synthwave",
  "surrealista-guitarra",
  "urbano-auto-clasico",
  "urbano-retrato",
  "pixel-art-colibri",
  "pixel-art-skater",
];

describe("SHOW_STYLES integration", () => {
  it("PublicAssistant.tsx contains the SHOW_STYLES action", () => {
    const source = fs.readFileSync(PUBLIC_ASSISTANT_PATH, "utf-8");
    expect(source).toContain('action.type === "SHOW_STYLES"');
  });

  it("KNOWN BUG: SHOW_STYLES hardcodes exactly 8 slugs instead of full catalog", () => {
    const source = fs.readFileSync(PUBLIC_ASSISTANT_PATH, "utf-8");
    // Extract the array from the source
    const match = source.match(
      /\["([\w-]+)"(?:,\s*"([\w-]+)")*\]\.map\(s\s*=>/
    );
    expect(match).toBeTruthy();

    // Count the hardcoded slugs by finding the array content
    const arrayMatch = source.match(
      /\[("[a-z0-9-]+"(?:,\s*"[a-z0-9-]+")*)\]\.map\(s\s*=>/
    );
    expect(arrayMatch).toBeTruthy();
    const slugsInSource = arrayMatch![1].match(/"([a-z0-9-]+)"/g)!.map(
      (s) => s.replace(/"/g, "")
    );
    expect(slugsInSource).toHaveLength(8);
    // Should show all 29 BASE_STYLES instead
    expect(slugsInSource.length).toBeLessThan(BASE_STYLES_SLUGS.length);
  });

  it("KNOWN BUG: 'geometrico-colibri' in SHOW_STYLES does not exist in BASE_STYLES", () => {
    // SHOW_STYLES references "geometrico-colibri" but BASE_STYLES has "geometrico-aguila"
    const invalidSlugs = SHOW_STYLES_HARDCODED.filter(
      (s) => !BASE_STYLES_SLUGS.includes(s)
    );
    expect(invalidSlugs).toEqual(["geometrico-colibri"]);
  });

  it("all valid SHOW_STYLES slugs exist in BASE_STYLES", () => {
    const validSlugs = SHOW_STYLES_HARDCODED.filter((s) =>
      BASE_STYLES_SLUGS.includes(s)
    );
    expect(validSlugs).toHaveLength(7); // 7 of 8 are valid
  });

  it("KNOWN BUG: SHOW_STYLES thumbnails have no click handlers", () => {
    const source = fs.readFileSync(PUBLIC_ASSISTANT_PATH, "utf-8");
    // Find the SHOW_STYLES block
    const showStylesBlock = source.slice(
      source.indexOf('action.type === "SHOW_STYLES"'),
      source.indexOf('action.type === "SHOW_PRICING"')
    );
    // No onClick on the thumbnail container divs
    const thumbnailSection = showStylesBlock.match(
      /\.map\(s\s*=>\s*\(([\s\S]*?)\)\)/
    );
    expect(thumbnailSection).toBeTruthy();
    expect(thumbnailSection![1]).not.toContain("onClick");
  });

  it("KNOWN BUG: SHOW_STYLES thumbnails have no name labels", () => {
    const source = fs.readFileSync(PUBLIC_ASSISTANT_PATH, "utf-8");
    const showStylesBlock = source.slice(
      source.indexOf('action.type === "SHOW_STYLES"'),
      source.indexOf('action.type === "SHOW_PRICING"')
    );
    // The thumbnail divs only contain an Image, no text label
    const thumbnailSection = showStylesBlock.match(
      /\.map\(s\s*=>\s*\(([\s\S]*?)\)\)/
    );
    expect(thumbnailSection).toBeTruthy();
    // No text element showing the style name — only Image, no label/span/p
    // (template literal ${s} in alt/src doesn't count as a visible label)
    expect(thumbnailSection![1]).not.toMatch(/<span[^>]*>|<p[^>]*>|<h[1-6]/);
    expect(thumbnailSection![1]).not.toContain("style.name");
  });

  it("SHOW_STYLES text claims 37 styles but shows only 8 thumbnails", () => {
    const source = fs.readFileSync(PUBLIC_ASSISTANT_PATH, "utf-8");
    expect(source).toContain("37 estilos disponibles");
    // But only 8 are shown
    const arrayMatch = source.match(
      /\[("[a-z0-9-]+"(?:,\s*"[a-z0-9-]+")*)\]\.map\(s\s*=>/
    );
    const count = arrayMatch![1].split(",").length;
    expect(count).toBe(8);
  });
});

describe("Style thumbnail files", () => {
  const stylesDir = path.resolve(__dirname, "../../public/styles");

  it("all BASE_STYLES thumbnail files exist on disk", () => {
    const missing: string[] = [];
    for (const slug of BASE_STYLES_SLUGS) {
      const filePath = path.join(stylesDir, `${slug}.png`);
      if (!fs.existsSync(filePath)) {
        missing.push(slug);
      }
    }
    expect(missing).toEqual([]);
  });

  it("all SHOW_STYLES thumbnail files exist on disk", () => {
    const missing: string[] = [];
    for (const slug of SHOW_STYLES_HARDCODED) {
      const filePath = path.join(stylesDir, `${slug}.png`);
      if (!fs.existsSync(filePath)) {
        missing.push(slug);
      }
    }
    // All 8 hardcoded slugs should have matching PNG files
    expect(missing).toEqual([]);
  });
});

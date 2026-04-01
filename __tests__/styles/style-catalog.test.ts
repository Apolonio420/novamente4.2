// @vitest-environment node
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// We read the component source to extract BASE_STYLES since it's not exported separately.
// This is intentional — tests verify the data that actually ships.
const componentSource = fs.readFileSync(
  path.resolve(__dirname, "../../components/StyleGallery.tsx"),
  "utf-8"
);

// Extract the BASE_STYLES array content
const arrayMatch = componentSource.match(/const BASE_STYLES\s*=\s*\[([\s\S]*?)\n\]/);
if (!arrayMatch) throw new Error("Could not find BASE_STYLES in StyleGallery.tsx");

// Parse style IDs from the source
const idMatches = [...componentSource.matchAll(/id:\s*"([^"]+)"/g)];
const styleIds = idMatches.map((m) => m[1]);

// Parse style names
const nameMatches = [...componentSource.matchAll(/name:\s*"([^"]+)"/g)];
const styleNames = nameMatches.map((m) => m[1]);

// Parse categories
const categoryMatches = [...componentSource.matchAll(/category:\s*"([^"]+)"/g)];
const styleCategories = categoryMatches.map((m) => m[1]);

// Parse image paths
const imageMatches = [...componentSource.matchAll(/image:\s*"([^"]+)"/g)];
const styleImages = imageMatches.map((m) => m[1]);

// Documented styles from STYLES.md
const stylesDoc = fs.readFileSync(
  path.resolve(__dirname, "../../docs/public/STYLES.md"),
  "utf-8"
);
// Match slugs in format: **Name** (slug-here): — the pattern in STYLES.md
const docSlugMatches = [...stylesDoc.matchAll(/\*\*[^*]+\*\*\s*\(([a-z0-9-]+)\)/g)];
const docSlugs = docSlugMatches.map((m) => m[1]);

// SHOW_STYLES hardcoded slugs from PublicAssistant.tsx
const assistantSource = fs.readFileSync(
  path.resolve(__dirname, "../../components/PublicAssistant.tsx"),
  "utf-8"
);
const showStylesMatch = assistantSource.match(
  /SHOW_STYLES[\s\S]*?\[([^\]]+)\]\.map/
);
const hardcodedSlugs = showStylesMatch
  ? [...showStylesMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
  : [];

describe("Style catalog data integrity", () => {
  it("has styles defined in BASE_STYLES", () => {
    expect(styleIds.length).toBeGreaterThan(0);
  });

  it("BUG: BASE_STYLES has 29 styles, STYLES.md documents 37 with different slugs", () => {
    expect(styleIds).toHaveLength(29);
    expect(docSlugs).toHaveLength(37);
    // The two catalogs use almost entirely different slug naming schemes
    const overlap = docSlugs.filter((s) => styleIds.includes(s));
    const missingFromComponent = docSlugs.filter((s) => !styleIds.includes(s));
    // Document the overlap count and gap
    expect(missingFromComponent.length).toBe(docSlugs.length - overlap.length);
    // The key bug: code and docs are out of sync
    expect(styleIds.length).not.toBe(docSlugs.length);
  });

  it("each style has id, name, category, and image", () => {
    expect(styleIds.length).toBe(styleNames.length);
    expect(styleIds.length).toBe(styleCategories.length);
    expect(styleIds.length).toBe(styleImages.length);

    for (const id of styleIds) {
      expect(id).toBeTruthy();
      expect(id.length).toBeGreaterThan(0);
    }
    for (const name of styleNames) {
      expect(name).toBeTruthy();
    }
    for (const img of styleImages) {
      expect(img).toMatch(/^\/styles\/[a-z0-9-]+\.png$/);
    }
  });

  it("no duplicate slugs in BASE_STYLES", () => {
    const unique = new Set(styleIds);
    expect(unique.size).toBe(styleIds.length);
  });

  it("all thumbnail images exist on disk", () => {
    const publicDir = path.resolve(__dirname, "../../public");
    for (const img of styleImages) {
      const fullPath = path.join(publicDir, img);
      const exists = fs.existsSync(fullPath);
      if (!exists) {
        // Provide actionable error
        throw new Error(`Missing thumbnail: ${fullPath}`);
      }
    }
  });
});

describe("SHOW_STYLES integration", () => {
  it("BUG: SHOW_STYLES hardcodes exactly 8 slugs", () => {
    expect(hardcodedSlugs).toHaveLength(8);
  });

  it("hardcoded slugs have valid thumbnail files", () => {
    const publicDir = path.resolve(__dirname, "../../public");
    for (const slug of hardcodedSlugs) {
      const imgPath = path.join(publicDir, "styles", `${slug}.png`);
      expect(fs.existsSync(imgPath)).toBe(true);
    }
  });

  it("BUG: hardcoded slug 'geometrico-colibri' is NOT in BASE_STYLES", () => {
    // geometrico-colibri exists as a file but is not in the component's BASE_STYLES array
    const inBaseStyles = styleIds.includes("geometrico-colibri");
    expect(inBaseStyles).toBe(false);
    // But the file does exist
    const publicDir = path.resolve(__dirname, "../../public");
    expect(
      fs.existsSync(path.join(publicDir, "styles", "geometrico-colibri.png"))
    ).toBe(true);
  });

  it("SHOW_STYLES count (8) differs from BASE_STYLES count (29) and docs count (37)", () => {
    expect(hardcodedSlugs.length).not.toBe(styleIds.length);
    expect(hardcodedSlugs.length).not.toBe(docSlugs.length);
  });

  it("documents which STYLES.md slugs are missing from BASE_STYLES", () => {
    const missingFromCode = docSlugs.filter((s) => !styleIds.includes(s));
    // These are the styles documented but not yet added to the component
    expect(missingFromCode.length).toBeGreaterThan(0);
    // Snapshot for visibility — will be auto-generated on first run
    expect(missingFromCode).toMatchInlineSnapshot(`
      [
        "minimalista-lineal",
        "line-art-tatuaje",
        "brutalista-minimalista",
        "sticker-style",
        "pop-minimalista",
        "vintage-poster",
        "vintage",
        "pixel-art-retro",
        "retro-vaporwave",
        "manga-anime",
        "manga-estilizado",
        "ghibli-like",
        "chibi-3d",
        "voxel-lego",
        "isometrico-futurista",
        "neon-cyberpunk",
        "3d-translucido",
        "conceptual-isometrico",
        "acuarela-digital",
        "psicodelico",
        "grunge-distressed",
        "tribal-etnico",
        "geometrico-abstracto",
        "geometrico",
        "cartoon-western",
        "cartoon",
        "collage-surrealista",
        "surrealista",
        "surreal-vectorial",
        "tipografico",
        "editorial-tipografia",
        "vectorial",
        "botanica-vintage",
        "acuarela-naturaleza",
        "acuarela-urbana",
        "urbano-streetwear",
      ]
    `);
  });
});

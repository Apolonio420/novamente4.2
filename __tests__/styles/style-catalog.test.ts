import { describe, it, expect } from "vitest";
import { ARTISTIC_STYLES } from "@/lib/advanced-prompt-optimizer";

// The canonical style catalog from STYLES.md documents exactly 37 styles.
// ARTISTIC_STYLES is the runtime catalog used by the design engine.

const DOCUMENTED_STYLE_COUNT = 37;

const STYLES_MD_SLUGS = [
  // Minimalista (3)
  "minimalista-lineal",
  "line-art-tatuaje",
  "brutalista-minimalista",
  // Pop & Retro (7)
  "sticker-style",
  "pop-minimalista",
  "vintage-poster",
  "vintage",
  "pixel-art-retro",
  "retro-vaporwave",
  "retro-cassette",
  // Oriental (4)
  "manga-anime",
  "manga-estilizado",
  "ghibli-like",
  "chibi-3d",
  // Digital & Futurista (5)
  "voxel-lego",
  "isometrico-futurista",
  "neon-cyberpunk",
  "3d-translucido",
  "conceptual-isometrico",
  // Textural (4)
  "acuarela-digital",
  "psicodelico",
  "grunge-distressed",
  "tribal-etnico",
  // Geometrico (2)
  "geometrico-abstracto",
  "geometrico",
  // Ilustracion (5)
  "cartoon-western",
  "cartoon",
  "collage-surrealista",
  "surrealista",
  "surreal-vectorial",
  // Tipografico (2)
  "tipografico",
  "editorial-tipografia",
  // Vectorial (1)
  "vectorial",
  // Naturaleza (3)
  "botanica-vintage",
  "acuarela-naturaleza",
  "acuarela-urbana",
  // Urbano (1)
  "urbano-streetwear",
];

describe("Style catalog (ARTISTIC_STYLES)", () => {
  const slugs = Object.keys(ARTISTIC_STYLES);

  it("has styles defined", () => {
    expect(slugs.length).toBeGreaterThan(0);
  });

  it(`KNOWN BUG: ARTISTIC_STYLES has ${slugs.length} styles, not the documented ${DOCUMENTED_STYLE_COUNT}`, () => {
    // This test documents the mismatch between STYLES.md (37) and the runtime catalog
    expect(slugs.length).toBe(32);
    expect(slugs.length).not.toBe(DOCUMENTED_STYLE_COUNT);
  });

  it("each style has required fields: name, description, keywords, printOptimized", () => {
    for (const [slug, style] of Object.entries(ARTISTIC_STYLES)) {
      const s = style as { name: string; description: string; keywords: string; printOptimized: boolean };
      expect(s.name, `${slug} missing name`).toBeTruthy();
      expect(s.description, `${slug} missing description`).toBeTruthy();
      expect(s.keywords, `${slug} missing keywords`).toBeTruthy();
      expect(typeof s.printOptimized, `${slug} missing printOptimized`).toBe("boolean");
    }
  });

  it("has no duplicate slugs", () => {
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("KNOWN BUG: 5 styles from STYLES.md are missing from ARTISTIC_STYLES", () => {
    const missing = STYLES_MD_SLUGS.filter((s) => !slugs.includes(s));
    expect(missing).toEqual([
      "retro-vaporwave",
      "retro-cassette",
      "acuarela-naturaleza",
      "acuarela-urbana",
      "urbano-streetwear",
    ]);
  });

  it("all ARTISTIC_STYLES slugs are documented in STYLES.md", () => {
    const undocumented = slugs.filter((s) => !STYLES_MD_SLUGS.includes(s));
    expect(undocumented).toEqual([]);
  });
});

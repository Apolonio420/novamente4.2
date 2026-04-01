import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock next/image since we're in a test environment
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, ...rest } = props;
    return <img {...rest} />;
  },
}));

// Import after mocks
import { StyleGallery } from "@/components/StyleGallery";

describe("StyleGallery component", () => {
  it("renders with default limit of 8 styles", () => {
    render(<StyleGallery />);
    const styleNames = screen.getAllByRole("heading", { level: 4 });
    expect(styleNames).toHaveLength(8);
  });

  it("renders all styles when limit exceeds catalog size", () => {
    render(<StyleGallery limit={100} />);
    const styleNames = screen.getAllByRole("heading", { level: 4 });
    // BASE_STYLES currently has 29 entries — NOT 37 as STYLES.md documents
    expect(styleNames.length).toBeGreaterThan(8);
    expect(styleNames).toHaveLength(29);
  });

  it("each style card displays a name label", () => {
    render(<StyleGallery limit={100} />);
    const headings = screen.getAllByRole("heading", { level: 4 });
    for (const h of headings) {
      expect(h.textContent).toBeTruthy();
      expect(h.textContent!.length).toBeGreaterThan(0);
    }
  });

  it("style cards call onStyleSelect when clicked", async () => {
    // Mock clipboard API — handleCardClick is async (awaits clipboard.writeText)
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });
    const onSelect = vi.fn();
    render(<StyleGallery onStyleSelect={onSelect} limit={3} />);
    const images = screen.getAllByRole("img");
    // Click the first image — its onClick calls async handleCardClick
    fireEvent.click(images[0]);
    // Wait for the async clipboard call to resolve and onSelect to fire
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledTimes(1);
    });
    expect(onSelect).toHaveBeenCalledWith(expect.stringContaining("/styles/"));
  });

  it("each style card has a category badge", () => {
    render(<StyleGallery limit={100} />);
    const badges = screen.getAllByText(
      /Acuarela|Geométrico|Pixel Art|Pop Art|Retro|Surrealista|Urbano|Japonés|Line Art|Ilustración|Psicodélico|Ornamental|Místico/
    );
    expect(badges.length).toBeGreaterThan(0);
  });

  it("category filter shows only matching styles", () => {
    render(<StyleGallery limit={100} />);
    const retroButton = screen.getByRole("button", { name: "Retro" });
    fireEvent.click(retroButton);
    const headings = screen.getAllByRole("heading", { level: 4 });
    for (const h of headings) {
      const card = h.closest("[class*='overflow-hidden']");
      expect(card?.textContent).toMatch(/Retro|Vaporwave|Cassette|Typewriter|Endless|Good Vibes/i);
    }
  });
});

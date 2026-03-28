import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: (props: any) => {
    const { fill, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} data-fill={fill ? "true" : undefined} />;
  },
}));

// Mock shadcn UI components
vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className, onClick }: any) => (
    <div data-testid="style-card" className={className} onClick={onClick}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

// Import after mocks
import { StyleGallery } from "@/components/StyleGallery";

// Extract BASE_STYLES count by reading the component source's array
// We test the component behavior rather than internal constants

describe("StyleGallery component", () => {
  it("renders with default limit of 8 styles", () => {
    render(<StyleGallery />);
    const cards = screen.getAllByTestId("style-card");
    expect(cards).toHaveLength(8);
  });

  it("KNOWN BUG: default limit=8 hides most styles (29 total in BASE_STYLES)", () => {
    // With limit high enough to show all, we get the true count
    render(<StyleGallery limit={100} />);
    const cards = screen.getAllByTestId("style-card");
    expect(cards).toHaveLength(29);
    // Only 8 shown by default — user sees < 1/3 of catalog
    expect(8).toBeLessThan(cards.length);
  });

  it("each style card displays a name label", () => {
    render(<StyleGallery limit={100} />);
    // StyleGallery renders style.name inside an h4 inside CardContent
    const names = screen.getAllByRole("heading", { level: 4 });
    expect(names.length).toBe(29);
    names.forEach((el) => {
      expect(el.textContent).toBeTruthy();
    });
  });

  it("style cards are clickable and call onStyleSelect", async () => {
    // Mock clipboard API for the handler
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });

    const onSelect = vi.fn();
    render(<StyleGallery onStyleSelect={onSelect} limit={3} />);

    const cards = screen.getAllByTestId("style-card");
    await fireEvent.click(cards[0]);
    // handleCardClick is async — wait for microtask
    await vi.waitFor(() => {
      expect(onSelect).toHaveBeenCalledTimes(1);
    });
    expect(onSelect).toHaveBeenCalledWith(expect.stringContaining("/styles/"));
  });

  it("each style has a category badge", () => {
    render(<StyleGallery limit={100} />);
    const cards = screen.getAllByTestId("style-card");
    cards.forEach((card) => {
      // Badge renders the category text
      const badge = card.querySelector("[class*='text-xs']");
      expect(badge).toBeTruthy();
    });
  });

  it("each style has a thumbnail image with valid src", () => {
    render(<StyleGallery limit={100} />);
    const images = screen.getAllByRole("img");
    images.forEach((img) => {
      const src = img.getAttribute("src");
      expect(src).toBeTruthy();
      expect(src).toMatch(/^\/styles\/[\w-]+\.png$/);
    });
  });

  it("shows 'Ver mas estilos' button when simplified=false and limit < total", () => {
    render(<StyleGallery limit={4} />);
    const button = screen.getByText("Ver más estilos");
    expect(button).toBeTruthy();
  });

  it("hides 'Ver mas estilos' button when simplified=true", () => {
    render(<StyleGallery limit={4} simplified />);
    expect(screen.queryByText("Ver más estilos")).toBeNull();
  });

  it("filters styles by category", () => {
    render(<StyleGallery limit={100} />);
    // Click the "Retro" category filter button (not the badges in cards)
    const retroButtons = screen.getAllByText("Retro");
    // First match is the filter button
    fireEvent.click(retroButtons[0]);

    const cards = screen.getAllByTestId("style-card");
    // All visible cards should be Retro category
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThan(29);
  });
});

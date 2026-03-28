import { describe, it, expect } from "vitest";

describe("Smoke test", () => {
  it("vitest is working", () => {
    expect(1 + 1).toBe(2);
  });

  it("path alias @ resolves", async () => {
    const mod = await import("@/lib/utils");
    expect(mod).toBeDefined();
  });
});

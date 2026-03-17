import { describe, it, expect, vi } from "vitest";
import { cn, cnpjDigits, formatCnpj, generateStoreCode } from "../lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "skip", "keep")).toBe("base keep");
  });
});

describe("cnpjDigits", () => {
  it("strips non-digits", () => {
    expect(cnpjDigits("12.345.678/0001-99")).toBe("12345678000199");
  });

  it("truncates to 14 digits", () => {
    expect(cnpjDigits("123456789012345")).toBe("12345678901234");
  });

  it("returns empty string for empty input", () => {
    expect(cnpjDigits("")).toBe("");
  });
});

describe("formatCnpj", () => {
  it("returns raw digits for 1-2 characters", () => {
    expect(formatCnpj("1")).toBe("1");
    expect(formatCnpj("12")).toBe("12");
  });

  it("formats up to 5 digits as XX.XXX", () => {
    expect(formatCnpj("123")).toBe("12.3");
    expect(formatCnpj("12345")).toBe("12.345");
  });

  it("formats up to 8 digits as XX.XXX.XXX", () => {
    expect(formatCnpj("123456")).toBe("12.345.6");
    expect(formatCnpj("12345678")).toBe("12.345.678");
  });

  it("formats up to 12 digits as XX.XXX.XXX/XXXX", () => {
    expect(formatCnpj("123456789012")).toBe("12.345.678/9012");
  });

  it("formats full 14 digits as XX.XXX.XXX/XXXX-XX", () => {
    expect(formatCnpj("12345678000199")).toBe("12.345.678/0001-99");
  });

  it("accepts already-formatted string", () => {
    expect(formatCnpj("12.345.678/0001-99")).toBe("12.345.678/0001-99");
  });
});

describe("generateStoreCode", () => {
  it("returns a string with 3 to 6 digits", () => {
    const code = generateStoreCode([]);
    expect(code).toMatch(/^\d{3,6}$/);
  });

  it("does not return a code already in use", () => {
    // Fill all 3-digit codes to force a 4+ digit result
    const threedigit = Array.from({ length: 900 }, (_, i) => String(i + 100));
    const code = generateStoreCode(threedigit);
    expect(threedigit).not.toContain(code);
  });

  it("returns distinct codes on successive calls with accumulated list", () => {
    const used: string[] = [];
    for (let i = 0; i < 20; i++) {
      const code = generateStoreCode(used);
      expect(used).not.toContain(code);
      used.push(code);
    }
  });

  it("throws when no unique code can be found within maxAttempts", () => {
    // Mock Math.random to always return the same value → always the same code
    const spy = vi.spyOn(Math, "random").mockReturnValue(0);
    const alwaysSame = generateStoreCode([]); // first call works
    expect(() => generateStoreCode([alwaysSame], 5)).toThrow(
      "Não foi possível gerar um código único para a loja."
    );
    spy.mockRestore();
  });
});

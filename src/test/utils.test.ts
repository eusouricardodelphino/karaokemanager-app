import { describe, it, expect } from "vitest";
import { cn, cnpjDigits, formatCnpj } from "../lib/utils";

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

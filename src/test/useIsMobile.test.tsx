import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useIsMobile } from "../hooks/use-mobile";

const createMql = (matches: boolean) => {
  const listeners: Array<() => void> = [];
  return {
    matches,
    addEventListener: vi.fn((_: string, cb: () => void) => listeners.push(cb)),
    removeEventListener: vi.fn(),
    _trigger: () => listeners.forEach((cb) => cb()),
  };
};

describe("useIsMobile", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", { writable: true, value: vi.fn() });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when window width is >= 768", () => {
    const mql = createMql(false);
    vi.mocked(window.matchMedia).mockReturnValue(mql as any);
    Object.defineProperty(window, "innerWidth", { writable: true, value: 1024 });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true when window width is < 768", () => {
    const mql = createMql(true);
    vi.mocked(window.matchMedia).mockReturnValue(mql as any);
    Object.defineProperty(window, "innerWidth", { writable: true, value: 375 });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("updates value when media query change event fires", () => {
    const mql = createMql(false);
    vi.mocked(window.matchMedia).mockReturnValue(mql as any);
    Object.defineProperty(window, "innerWidth", { writable: true, value: 1024 });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window, "innerWidth", { writable: true, value: 375 });
      mql._trigger();
    });

    expect(result.current).toBe(true);
  });

  it("removes event listener on unmount", () => {
    const mql = createMql(false);
    vi.mocked(window.matchMedia).mockReturnValue(mql as any);
    Object.defineProperty(window, "innerWidth", { writable: true, value: 1024 });

    const { unmount } = renderHook(() => useIsMobile());
    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTrial } from "../hooks/useTrial";

vi.mock("@/firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(),
}));

const mockTimestamp = (daysAgo: number) => ({
  toMillis: () => Date.now() - daysAgo * 24 * 60 * 60 * 1000,
});

describe("useTrial", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns no_trial when storeId is undefined", async () => {
    const { onSnapshot } = await import("firebase/firestore");
    vi.mocked(onSnapshot).mockReturnValue(vi.fn() as any);

    const { result } = renderHook(() => useTrial(undefined));

    expect(result.current.status).toBe("no_trial");
  });

  it("returns no_trial when snapshot does not exist", async () => {
    const { onSnapshot } = await import("firebase/firestore");
    vi.mocked(onSnapshot).mockImplementation((_ref, onNext: any) => {
      onNext({ exists: () => false });
      return vi.fn();
    });

    const { result } = renderHook(() => useTrial("store-1"));
    expect(result.current.status).toBe("no_trial");
  });

  it("returns paid when subscription is active", async () => {
    const { onSnapshot } = await import("firebase/firestore");
    vi.mocked(onSnapshot).mockImplementation((_ref, onNext: any) => {
      onNext({
        exists: () => true,
        data: () => ({
          subscription: { status: "active" },
          trialDays: 30,
          trialStartedAt: mockTimestamp(5),
        }),
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useTrial("store-1"));
    expect(result.current.status).toBe("paid");
  });

  it("returns no_trial when trialStartedAt is missing", async () => {
    const { onSnapshot } = await import("firebase/firestore");
    vi.mocked(onSnapshot).mockImplementation((_ref, onNext: any) => {
      onNext({
        exists: () => true,
        data: () => ({ subscription: { status: "trial" }, trialDays: 30 }),
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useTrial("store-1"));
    expect(result.current.status).toBe("no_trial");
  });

  it("returns expired when trial has ended", async () => {
    const { onSnapshot } = await import("firebase/firestore");
    vi.mocked(onSnapshot).mockImplementation((_ref, onNext: any) => {
      onNext({
        exists: () => true,
        data: () => ({
          subscription: { status: "trial" },
          trialDays: 30,
          trialStartedAt: mockTimestamp(31),
        }),
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useTrial("store-1"));
    expect(result.current.status).toBe("expired");
    expect(result.current.daysLeft).toBe(0);
  });

  it("returns expiring_soon when <= 7 days left", async () => {
    const { onSnapshot } = await import("firebase/firestore");
    vi.mocked(onSnapshot).mockImplementation((_ref, onNext: any) => {
      onNext({
        exists: () => true,
        data: () => ({
          subscription: { status: "trial" },
          trialDays: 30,
          trialStartedAt: mockTimestamp(24),
        }),
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useTrial("store-1"));
    expect(result.current.status).toBe("expiring_soon");
    expect(result.current.daysLeft).toBeGreaterThan(0);
    expect(result.current.daysLeft).toBeLessThanOrEqual(7);
  });

  it("returns active when plenty of days remain", async () => {
    const { onSnapshot } = await import("firebase/firestore");
    vi.mocked(onSnapshot).mockImplementation((_ref, onNext: any) => {
      onNext({
        exists: () => true,
        data: () => ({
          subscription: { status: "trial" },
          trialDays: 30,
          trialStartedAt: mockTimestamp(1),
        }),
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useTrial("store-1"));
    expect(result.current.status).toBe("active");
    expect(result.current.daysLeft).toBeGreaterThan(7);
  });

  it("returns no_trial on snapshot error", async () => {
    const { onSnapshot } = await import("firebase/firestore");
    vi.mocked(onSnapshot).mockImplementation((_ref, _onNext: any, onError: any) => {
      onError(new Error("permission-denied"));
      return vi.fn();
    });

    const { result } = renderHook(() => useTrial("store-1"));
    expect(result.current.status).toBe("no_trial");
  });

  it("unsubscribes on unmount", async () => {
    const { onSnapshot } = await import("firebase/firestore");
    const unsubscribe = vi.fn();
    vi.mocked(onSnapshot).mockReturnValue(unsubscribe as any);

    const { unmount } = renderHook(() => useTrial("store-1"));
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});

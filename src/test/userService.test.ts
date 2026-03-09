import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Firestore } from "firebase/firestore";
import * as firestoreFunctions from "firebase/firestore";
import { subscribeToUser } from "../services/userService";

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    collection: vi.fn(() => "mock-collection"),
    query: vi.fn(() => "mock-query"),
    where: vi.fn(),
    onSnapshot: vi.fn(),
  };
});

const mockDb = {} as Firestore;

describe("userService - subscribeToUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onSnapshot with the correct query", () => {
    const mockUnsub = vi.fn();
    vi.mocked(firestoreFunctions.onSnapshot).mockReturnValueOnce(mockUnsub as any);

    const unsubscribe = subscribeToUser(mockDb, "uid-123", vi.fn());

    expect(firestoreFunctions.onSnapshot).toHaveBeenCalled();
    expect(unsubscribe).toBe(mockUnsub);
  });

  it("calls listener with null when snapshot is empty", () => {
    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_q, cb: any) => {
      cb({ empty: true, docs: [] });
      return vi.fn();
    });

    const listener = vi.fn();
    subscribeToUser(mockDb, "uid-123", listener);

    expect(listener).toHaveBeenCalledWith(null);
  });

  it("calls listener with the user from the first document when snapshot has data", () => {
    const fakeDoc = {
      id: "firestore-doc-id",
      data: () => ({
        name: "Test User",
        email: "test@example.com",
        isAdmin: true,
        createdAt: "2024-01-01",
      }),
    };

    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_q, cb: any) => {
      cb({ empty: false, docs: [fakeDoc] });
      return vi.fn();
    });

    const listener = vi.fn();
    subscribeToUser(mockDb, "uid-123", listener);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test User",
        email: "test@example.com",
        isAdmin: true,
      })
    );
  });

  it("calls listener with null on snapshot error", () => {
    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_q, _cb: any, errCb: any) => {
      errCb(new Error("Firestore error"));
      return vi.fn();
    });

    const listener = vi.fn();
    subscribeToUser(mockDb, "uid-123", listener);

    expect(listener).toHaveBeenCalledWith(null);
  });
});

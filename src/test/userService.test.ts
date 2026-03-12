import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Firestore } from "firebase/firestore";
import * as firestoreFunctions from "firebase/firestore";
import { subscribeToUser } from "../services/userService";

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    doc: vi.fn(() => "mock-doc-ref"),
    onSnapshot: vi.fn(),
  };
});

const mockDb = {} as Firestore;

describe("userService - subscribeToUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls doc with the correct path and onSnapshot on the doc ref", () => {
    const mockUnsub = vi.fn();
    vi.mocked(firestoreFunctions.onSnapshot).mockReturnValueOnce(mockUnsub as any);

    const unsubscribe = subscribeToUser(mockDb, "uid-123", vi.fn());

    expect(firestoreFunctions.doc).toHaveBeenCalledWith(mockDb, "users", "uid-123");
    expect(firestoreFunctions.onSnapshot).toHaveBeenCalledWith(
      "mock-doc-ref",
      expect.any(Function),
      expect.any(Function)
    );
    expect(unsubscribe).toBe(mockUnsub);
  });

  it("calls listener with null when snapshot does not exist", () => {
    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_ref, cb: any) => {
      cb({ exists: () => false });
      return vi.fn();
    });

    const listener = vi.fn();
    subscribeToUser(mockDb, "uid-123", listener);

    expect(listener).toHaveBeenCalledWith(null);
  });

  it("calls listener with user data when snapshot exists", () => {
    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_ref, cb: any) => {
      cb({
        exists: () => true,
        id: "uid-123",
        data: () => ({
          name: "Test User",
          email: "test@example.com",
          role: "owner",
          createdAt: "2024-01-01",
        }),
      });
      return vi.fn();
    });

    const listener = vi.fn();
    subscribeToUser(mockDb, "uid-123", listener);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "uid-123",
        name: "Test User",
        email: "test@example.com",
        role: "owner",
      })
    );
  });

  it("calls listener with null on snapshot error", () => {
    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_ref, _cb: any, errCb: any) => {
      errCb(new Error("Firestore error"));
      return vi.fn();
    });

    const listener = vi.fn();
    subscribeToUser(mockDb, "uid-123", listener);

    expect(listener).toHaveBeenCalledWith(null);
  });
});

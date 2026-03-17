import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import * as firebaseAuth from "firebase/auth";
import * as userServiceModule from "../services/userService";
import { FirebaseProvider } from "../hooks/firebaseContext";
import { AuthProvider } from "../contexts/AuthContext";
import { useCurrentUser } from "../hooks/useCurrentUser";

vi.mock("@/firebase", () => ({ auth: {}, db: {} }));
vi.mock("../firebase", () => ({ auth: {}, db: {} }));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>();
  return { ...actual, onAuthStateChanged: vi.fn(), signOut: vi.fn() };
});

vi.mock("@/services/userService", () => ({
  subscribeToUser: vi.fn(() => vi.fn()), // returns unsubscribe fn
}));

// firebaseContext needs db, mock it with our fake one
vi.mock("../hooks/firebaseContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../hooks/firebaseContext")>();
  return {
    ...actual,
    useFirebase: () => ({ db: {} }),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FirebaseProvider>
    <AuthProvider>{children}</AuthProvider>
  </FirebaseProvider>
);

describe("useCurrentUser hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with isLoading true and not authenticated", () => {
    vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation(() => vi.fn() as any);

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("sets isLoading to false and isAuthenticated false when no user", async () => {
    vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation((_auth, cb: any) => {
      cb(null); // no user logged in
      return vi.fn();
    });

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("subscribes to user data when firebase user is present", async () => {
    const mockFirebaseUser = { uid: "auth-uid" };
    vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation((_auth, cb: any) => {
      cb(mockFirebaseUser);
      return vi.fn();
    });

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(userServiceModule.subscribeToUser).toHaveBeenCalledWith(
      expect.anything(),
      "auth-uid",
      expect.any(Function)
    );
  });

  it("calls signOut on logout success", async () => {
    vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation(() => vi.fn() as any);
    vi.mocked(firebaseAuth.signOut).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(firebaseAuth.signOut).toHaveBeenCalled();
  });

  it("handles signOut error gracefully", async () => {
    vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation(() => vi.fn() as any);
    vi.mocked(firebaseAuth.signOut).mockRejectedValueOnce(new Error("sign-out-error"));

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await act(async () => {
      await result.current.logout(); // should not throw
    });

    expect(firebaseAuth.signOut).toHaveBeenCalled();
  });
});

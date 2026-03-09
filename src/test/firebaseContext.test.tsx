import { render, renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { FirebaseProvider, useFirebase } from "../hooks/firebaseContext";

// Mock the firebase module so we don't need a real instance
vi.mock("../firebase", () => ({
  db: { type: "firestore" } as any,
}));

describe("firebaseContext", () => {
  it("provides the db object via FirebaseProvider", () => {
    const { result } = renderHook(() => useFirebase(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <FirebaseProvider>{children}</FirebaseProvider>
      ),
    });

    expect(result.current.db).toBeDefined();
    expect((result.current.db as any).type).toBe("firestore");
  });

  it("throws when useFirebase is used outside FirebaseProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useFirebase())).toThrow(
      "useFirebase deve ser usado dentro de um FirebaseProvider"
    );
    spy.mockRestore();
  });
});

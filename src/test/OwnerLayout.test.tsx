import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { OwnerLayout } from "../components/OwnerLayout";
import * as useCurrentUserModule from "../hooks/useCurrentUser";
import * as firestoreFunctions from "firebase/firestore";

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/hooks/useTrial", () => ({
  useTrial: vi.fn(() => ({ status: "active", daysLeft: 20, trialDays: 30 })),
}));

vi.mock("@/firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    doc: vi.fn(() => "mock-store-ref"),
    getDoc: vi.fn(),
  };
});

const renderOwnerLayout = (initialPath = "/store-1") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<OwnerLayout />}>
          <Route path="/:storeId" element={<div>Store Content</div>} />
        </Route>
        <Route path="/correct-store" element={<div>Correct Store</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("OwnerLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: store exists
    vi.mocked(firestoreFunctions.getDoc).mockResolvedValue({ exists: () => true } as any);
  });

  it("renders null while loading", async () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: null, isAuthenticated: false, isLoading: true, logout: vi.fn(),
    });

    const { container } = renderOwnerLayout();
    // Still null because isLoading=true even after storeExists resolves
    await waitFor(() => {
      expect(firestoreFunctions.getDoc).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders outlet directly for non-owner users", async () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: { id: "u1", role: "singer" }, isAuthenticated: true, isLoading: false, logout: vi.fn(),
    });

    renderOwnerLayout();
    expect(await screen.findByText("Store Content")).toBeInTheDocument();
  });

  it("renders outlet via TrialGuard for owner at correct store URL", async () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: { id: "u1", role: "owner", storeId: "store-1" }, isAuthenticated: true, isLoading: false, logout: vi.fn(),
    });

    renderOwnerLayout("/store-1");
    expect(await screen.findByText("Store Content")).toBeInTheDocument();
  });

  it("redirects owner to their own store when restaurantId does not match storeId", async () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: { id: "u1", role: "owner", storeId: "correct-store" }, isAuthenticated: true, isLoading: false, logout: vi.fn(),
    });

    renderOwnerLayout("/wrong-store");
    expect(await screen.findByText("Correct Store")).toBeInTheDocument();
    expect(screen.queryByText("Store Content")).not.toBeInTheDocument();
  });

  it("renders outlet for unauthenticated users", async () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: null, isAuthenticated: false, isLoading: false, logout: vi.fn(),
    });

    renderOwnerLayout();
    expect(await screen.findByText("Store Content")).toBeInTheDocument();
  });

  it("renders NotFound when restaurantId does not exist in Firestore", async () => {
    vi.mocked(firestoreFunctions.getDoc).mockResolvedValue({ exists: () => false } as any);
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: null, isAuthenticated: false, isLoading: false, logout: vi.fn(),
    });

    renderOwnerLayout("/nonexistent-store");
    expect(await screen.findByText("404")).toBeInTheDocument();
    expect(screen.queryByText("Store Content")).not.toBeInTheDocument();
  });

  it("renders outlet when getDoc fails (permission denied for unauthenticated users)", async () => {
    vi.mocked(firestoreFunctions.getDoc).mockRejectedValue(new Error("permission-denied"));
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: null, isAuthenticated: false, isLoading: false, logout: vi.fn(),
    });

    renderOwnerLayout("/store-1");
    expect(await screen.findByText("Store Content")).toBeInTheDocument();
  });
});

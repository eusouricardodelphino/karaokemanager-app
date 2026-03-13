import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { OwnerLayout } from "../components/OwnerLayout";
import * as useCurrentUserModule from "../hooks/useCurrentUser";

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/hooks/useTrial", () => ({
  useTrial: vi.fn(() => ({ status: "active", daysLeft: 20, trialDays: 30 })),
}));

vi.mock("@/firebase", () => ({ db: {} }));

const renderOwnerLayout = (initialPath = "/store-1") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<OwnerLayout />}>
          <Route path="/:restaurantId" element={<div>Store Content</div>} />
        </Route>
        <Route path="/correct-store" element={<div>Correct Store</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("OwnerLayout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders null while loading", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: null, isAuthenticated: false, isLoading: true, logout: vi.fn(),
    });

    const { container } = renderOwnerLayout();
    expect(container).toBeEmptyDOMElement();
  });

  it("renders outlet directly for non-owner users", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: { id: "u1", role: "singer" }, isAuthenticated: true, isLoading: false, logout: vi.fn(),
    });

    renderOwnerLayout();
    expect(screen.getByText("Store Content")).toBeInTheDocument();
  });

  it("renders outlet via TrialGuard for owner at correct store URL", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: { id: "u1", role: "owner", storeId: "store-1" }, isAuthenticated: true, isLoading: false, logout: vi.fn(),
    });

    renderOwnerLayout("/store-1");
    expect(screen.getByText("Store Content")).toBeInTheDocument();
  });

  it("redirects owner to their own store when restaurantId does not match storeId", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: { id: "u1", role: "owner", storeId: "correct-store" }, isAuthenticated: true, isLoading: false, logout: vi.fn(),
    });

    renderOwnerLayout("/wrong-store");
    expect(screen.getByText("Correct Store")).toBeInTheDocument();
    expect(screen.queryByText("Store Content")).not.toBeInTheDocument();
  });

  it("renders outlet for unauthenticated users", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: null, isAuthenticated: false, isLoading: false, logout: vi.fn(),
    });

    renderOwnerLayout();
    expect(screen.getByText("Store Content")).toBeInTheDocument();
  });
});

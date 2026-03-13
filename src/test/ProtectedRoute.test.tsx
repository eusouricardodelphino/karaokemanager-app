import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import * as useCurrentUserModule from "../hooks/useCurrentUser";

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

const renderProtectedRoute = (path = "/protected") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("ProtectedRoute", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders nothing while loading", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: null, isAuthenticated: false, isLoading: true, logout: vi.fn(),
    });

    const { container } = renderProtectedRoute();
    expect(container).toBeEmptyDOMElement();
  });

  it("redirects to /login when unauthenticated", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: null, isAuthenticated: false, isLoading: false, logout: vi.fn(),
    });

    renderProtectedRoute("/protected");
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("includes redirect param in login URL", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: null, isAuthenticated: false, isLoading: false, logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/protected?foo=bar"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });

  it("renders outlet content when authenticated", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: { id: "u1", role: "singer" }, isAuthenticated: true, isLoading: false, logout: vi.fn(),
    });

    renderProtectedRoute();
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});

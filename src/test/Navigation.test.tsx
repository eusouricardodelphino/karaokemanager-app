import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Navigation from "../components/Navigation";
import * as useCurrentUserModule from "../hooks/useCurrentUser";

// Avoid pulling in real Firebase through Navigation
vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

const renderNav = (path = "/rest-123") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:storeId/*" element={<Navigation />} />
        <Route path="/login" element={<Navigation />} />
      </Routes>
    </MemoryRouter>
  );

describe("Navigation Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the brand name", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      isAuthenticated: false,
      logout: vi.fn(),
      user: null,
      isLoading: false,
    });

    renderNav();
    // 'KaraokeManager' is split between two spans, so use a custom matcher
    const brands = screen.getAllByText((content, element) =>
      element?.textContent?.replace(/\s/g, "") === "KaraokeManager"
    );
    expect(brands.length).toBeGreaterThan(0);
  });

  it("shows 'Entrar' link when user is NOT authenticated", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      isAuthenticated: false,
      logout: vi.fn(),
      user: null,
      isLoading: false,
    });

    renderNav();
    expect(screen.getAllByText("Entrar").length).toBeGreaterThan(0);
    expect(screen.queryByText("Sair")).toBeNull();
  });

  it("shows 'Sair' button when user IS authenticated", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      isAuthenticated: true,
      logout: vi.fn(),
      user: null,
      isLoading: false,
    });

    renderNav();
    expect(screen.getAllByText("Sair").length).toBeGreaterThan(0);
    expect(screen.queryByText("Entrar")).toBeNull();
  });

  it("calls logout when 'Sair' button is clicked", async () => {
    const logoutMock = vi.fn().mockResolvedValueOnce(undefined);
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      isAuthenticated: true,
      logout: logoutMock,
      user: null,
      isLoading: false,
    });

    renderNav();
    const logoutButtons = screen.getAllByText("Sair");
    fireEvent.click(logoutButtons[0]);

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalled();
    });
  });

  it("renders Home, Cantar and Configurações nav links", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      isAuthenticated: false,
      logout: vi.fn(),
      user: null,
      isLoading: false,
    });

    renderNav();
    // Each item appears in both desktop and mobile navs
    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cantar").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Configurações").length).toBeGreaterThan(0);
  });
});

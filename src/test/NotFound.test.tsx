import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import NotFound from "../pages/NotFound";

describe("NotFound Component", () => {
  it("renders the 404 page correctly", () => {
    render(
      <MemoryRouter initialEntries={["/some/unknown/path"]}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /404/i })).toBeInTheDocument();
    expect(screen.getByText(/Page not found/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Return to Home/i })).toBeInTheDocument();
  });

  it("logs a console error with the current path", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/bad-route"]}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("404 Error"),
      "/bad-route"
    );

    consoleSpy.mockRestore();
  });

  it("has a link pointing to home", () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: /Return to Home/i });
    expect(link).toHaveAttribute("href", "/");
  });
});

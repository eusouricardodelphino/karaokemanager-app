import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "../components/ScrollToTop";

describe("ScrollToTop Component", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  it("renders nothing (returns null)", () => {
    const { container } = render(
      <MemoryRouter>
        <ScrollToTop />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it("calls window.scrollTo on mount", () => {
    render(
      <MemoryRouter initialEntries={["/page1"]}>
        <ScrollToTop />
      </MemoryRouter>
    );
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
  });
});

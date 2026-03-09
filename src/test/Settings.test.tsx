import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Settings from "../pages/Settings";
import { ThemeProvider } from "../contexts/ThemeContext";

// Mock Navigation as it depends on Firebase context which is heavy to set up
vi.mock("@/components/Navigation", () => ({
  default: () => <nav data-testid="navigation" />,
}));

const renderSettings = () =>
  render(
    <BrowserRouter>
      <ThemeProvider>
        <Settings />
      </ThemeProvider>
    </BrowserRouter>
  );

describe("Settings Component", () => {
  it("renders the settings page correctly", () => {
    renderSettings();
    expect(screen.getByRole("heading", { name: /Configurações/i })).toBeInTheDocument();
    expect(screen.getByText(/Aparência/i)).toBeInTheDocument();
    expect(screen.getByText(/Sobre/i)).toBeInTheDocument();
    expect(screen.getByText(/Versão 1.0.0/i)).toBeInTheDocument();
    expect(screen.getByTestId("navigation")).toBeInTheDocument();
  });

  it("displays the light and dark theme options", () => {
    renderSettings();
    expect(screen.getByRole("button", { name: /Claro/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Escuro/i })).toBeInTheDocument();
  });

  it("switches to dark theme when Escuro button is clicked", () => {
    renderSettings();
    const darkButton = screen.getByRole("button", { name: /Escuro/i });
    fireEvent.click(darkButton);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("switches to light theme when Claro button is clicked", () => {
    localStorage.setItem("theme", "dark");
    renderSettings();
    const lightButton = screen.getByRole("button", { name: /Claro/i });
    fireEvent.click(lightButton);
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });
});

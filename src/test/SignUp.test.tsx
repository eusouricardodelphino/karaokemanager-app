import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import SignUp from "../pages/SignUp";

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("SignUp Component", () => {
  it("renders the sign up choice page correctly", () => {
    renderWithRouter(<SignUp />);

    expect(screen.getByRole("heading", { name: /Criar Conta/i })).toBeInTheDocument();
    expect(screen.getByText(/Como você quer se cadastrar?/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sou dono do estabelecimento/i })).toHaveAttribute("href", "/owner/signup");
    expect(screen.getByRole("link", { name: /Quero cantar no karaoke/i })).toHaveAttribute("href", "/users/signup");
    expect(screen.getByRole("link", { name: /Fazer login/i })).toHaveAttribute("href", "/login");
  });
});

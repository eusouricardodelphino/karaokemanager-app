import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login";

vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock("@/firebase", () => ({
  auth: {},
  db: {},
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ user: null, isAuthenticated: false, isLoading: false, logout: vi.fn() }),
}));

describe("Login Route (/login)", () => {
  it("renders email form without Google button", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.queryByText(/Continuar com Google/i)).not.toBeInTheDocument();
  });

  it("has 'Criar conta' link", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /Criar conta/i })).toBeInTheDocument();
  });
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import UserLogin from "../pages/UserLogin";
import OwnerLogin from "../pages/OwnerLogin";
import Login from "../pages/Login";
import * as firebaseAuth from "firebase/auth";

// Mock Firebase
vi.mock("firebase/auth", () => ({
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  getAuth: vi.fn(),
}));

vi.mock("@/firebase", () => ({
  auth: {},
  googleProvider: {},
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe("New Login Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("UserLogin Component (/users/login)", () => {
    it("renders Google login button but NOT email form", () => {
      render(
        <MemoryRouter>
          <UserLogin />
        </MemoryRouter>
      );

      expect(screen.getByText(/Entrar como Cantor/i)).toBeInTheDocument();
      expect(screen.getByText(/Entrar com Google/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Email/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Senha/i)).not.toBeInTheDocument();
    });

    it("triggers Google login when clicked", async () => {
      render(
        <MemoryRouter>
          <UserLogin />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText(/Entrar com Google/i));
      expect(firebaseAuth.signInWithPopup).toHaveBeenCalled();
    });
  });

  describe("OwnerLogin Component (/owner/login)", () => {
    it("renders Email form but NOT Google login button", () => {
      render(
        <MemoryRouter>
          <OwnerLogin />
        </MemoryRouter>
      );

      expect(screen.getByText(/Acesso Administrativo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Administrativo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
      expect(screen.queryByText(/Entrar com Google/i)).not.toBeInTheDocument();
    });

    it("triggers Email login when submitted", async () => {
      render(
        <MemoryRouter>
          <OwnerLogin />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Email Administrativo/i), { target: { value: "test@admin.com" } });
      fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "password123" } });
      fireEvent.click(screen.getByRole("button", { name: /Entrar no Painel/i }));

      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), "test@admin.com", "password123");
    });
  });

  describe("Existing Login Component (/login)", () => {
    it("renders BOTH Email form and Google login button", () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
      expect(screen.getByText(/Continuar com Google/i)).toBeInTheDocument();
    });
  });
});

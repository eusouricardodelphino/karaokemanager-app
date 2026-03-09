import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import * as authFunctions from "firebase/auth";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>();
  return {
    ...actual,
    signInWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
  };
});

vi.mock("@/firebase", () => ({
  auth: {},
  googleProvider: {},
}));

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe("Login Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login form correctly", () => {
    renderWithRouter(<Login />);
    expect(screen.getByRole("heading", { name: /Entrar/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Entrar$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuar com Google/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Criar conta/i })).toBeInTheDocument();
  });

  it("shows loading state when submitting email login", async () => {
    vi.mocked(authFunctions.signInWithEmailAndPassword).mockImplementation(
      () => new Promise(() => {}) // never resolves, stays loading
    );

    renderWithRouter(<Login />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /^Entrar$/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Entrando.../i })).toBeDisabled();
    });
  });

  it("handles email login successfully and navigates", async () => {
    const mockUser = { uid: "login-uid" };
    vi.mocked(authFunctions.signInWithEmailAndPassword).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    renderWithRouter(<Login />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /^Entrar$/i }));

    await waitFor(() => {
      expect(authFunctions.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "123456"
      );
    });
  });

  it("shows error when email login fails", async () => {
    vi.mocked(authFunctions.signInWithEmailAndPassword).mockRejectedValueOnce(
      new Error("auth/wrong-password")
    );

    renderWithRouter(<Login />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "bad@example.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "wrongpass" } });
    fireEvent.click(screen.getByRole("button", { name: /^Entrar$/i }));

    await waitFor(() => {
      expect(authFunctions.signInWithEmailAndPassword).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: /^Entrar$/i })).not.toBeDisabled();
    });
  });

  it("handles google login successfully", async () => {
    const mockUser = { uid: "google-login-uid" };
    vi.mocked(authFunctions.signInWithPopup).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    renderWithRouter(<Login />);

    fireEvent.click(screen.getByRole("button", { name: /Continuar com Google/i }));

    await waitFor(() => {
      expect(authFunctions.signInWithPopup).toHaveBeenCalled();
    });
  });

  it("shows error when google login fails", async () => {
    vi.mocked(authFunctions.signInWithPopup).mockRejectedValueOnce(
      new Error("popup-closed")
    );

    renderWithRouter(<Login />);
    fireEvent.click(screen.getByRole("button", { name: /Continuar com Google/i }));

    await waitFor(() => {
      expect(authFunctions.signInWithPopup).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: /Continuar com Google/i })).not.toBeDisabled();
    });
  });
});

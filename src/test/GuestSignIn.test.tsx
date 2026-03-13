import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import GuestSignIn from "../pages/GuestSignIn";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("firebase/auth", () => ({
  signInAnonymously: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({ id: "mock-doc-ref" })),
  setDoc: vi.fn(),
}));

vi.mock("@/firebase", () => ({
  auth: {},
  db: {},
}));

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe("GuestSignIn Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders heading, name field and submit button", () => {
    renderWithRouter(<GuestSignIn />);
    expect(screen.getByRole("heading", { name: /Entrar como visitante/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Entrar$/i })).toBeInTheDocument();
  });

  it("submit button is disabled when name is empty", () => {
    renderWithRouter(<GuestSignIn />);
    expect(screen.getByRole("button", { name: /^Entrar$/i })).toBeDisabled();
  });

  it("submit button enables when name is filled", async () => {
    renderWithRouter(<GuestSignIn />);
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: "João" } });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^Entrar$/i })).not.toBeDisabled();
    });
  });

  it("calls signInAnonymously and setDoc on submit", async () => {
    const { signInAnonymously } = await import("firebase/auth");
    const { setDoc } = await import("firebase/firestore");
    vi.mocked(signInAnonymously).mockResolvedValueOnce({
      user: { uid: "anon-uid" },
    } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    renderWithRouter(<GuestSignIn />);
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: "João" } });
    fireEvent.click(screen.getByRole("button", { name: /^Entrar$/i }));

    await waitFor(() => {
      expect(signInAnonymously).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: "anon-uid",
          name: "João",
          role: "singer",
          isAnonymous: true,
        })
      );
    });
  });

  it("shows error toast when signInAnonymously fails", async () => {
    const { signInAnonymously } = await import("firebase/auth");
    vi.mocked(signInAnonymously).mockRejectedValueOnce(new Error("auth/too-many-requests"));

    renderWithRouter(<GuestSignIn />);
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: "João" } });
    fireEvent.click(screen.getByRole("button", { name: /^Entrar$/i }));

    await waitFor(() => {
      expect(signInAnonymously).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: /^Entrar$/i })).not.toBeDisabled();
    });
  });

  it("shows loading state while submitting", async () => {
    const { signInAnonymously } = await import("firebase/auth");
    vi.mocked(signInAnonymously).mockImplementation(() => new Promise(() => {}));

    renderWithRouter(<GuestSignIn />);
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: "João" } });
    fireEvent.click(screen.getByRole("button", { name: /^Entrar$/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Entrando.../i })).toBeDisabled();
    });
  });

  it("has links to /login and /signup", () => {
    renderWithRouter(<GuestSignIn />);
    expect(screen.getByRole("link", { name: /^Entrar$/i })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: /Criar conta/i })).toHaveAttribute("href", "/signup");
  });
});

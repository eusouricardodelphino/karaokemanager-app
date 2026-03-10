import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import UserSignUp from "../pages/UserSignUp";
import * as authFunctions from "firebase/auth";
import * as firestoreFunctions from "firebase/firestore";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>();
  return { ...actual, signInWithPopup: vi.fn() };
});

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return { ...actual, setDoc: vi.fn(), doc: vi.fn() };
});

vi.mock("@/firebase", () => ({
  auth: {},
  googleProvider: {},
  db: {},
}));

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe("UserSignUp Component", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the user sign up page correctly", () => {
    renderWithRouter(<UserSignUp />);

    expect(screen.getByRole("heading", { name: /Cadastro de Cantor/i })).toBeInTheDocument();
    expect(screen.getByText(/Crie sua conta para entrar na fila do karaoke/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cadastrar com Google/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Entrar/i })).toHaveAttribute("href", "/users/login");
  });

  it("handles google sign up successfully", async () => {
    const mockUser = { uid: "google-uid", email: "google@example.com", displayName: "Google User" };
    vi.mocked(authFunctions.signInWithPopup).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(firestoreFunctions.doc).mockReturnValue("fake-doc-ref" as any);
    vi.mocked(firestoreFunctions.setDoc).mockResolvedValueOnce(undefined);

    renderWithRouter(<UserSignUp />);

    fireEvent.click(screen.getByRole("button", { name: /Cadastrar com Google/i }));

    await waitFor(() => {
      expect(authFunctions.signInWithPopup).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(firestoreFunctions.setDoc).toHaveBeenCalledWith(
        "fake-doc-ref",
        expect.objectContaining({
          id: "google-uid",
          email: "google@example.com",
          name: "Google User",
          role: "user",
        })
      );
    });
  });
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import SignUp from "../pages/SignUp";
import * as authFunctions from "firebase/auth";
import * as firestoreFunctions from "firebase/firestore";

// Mocking the toast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mocking Firebase Auth
vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>();
  return {
    ...actual,
    createUserWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
  };
});

// Mocking Firebase Firestore
vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    setDoc: vi.fn(),
    doc: vi.fn(),
  };
});

// Mocking firebase config payload to avoid real instantiation errors
vi.mock("@/firebase", () => ({
  auth: {},
  googleProvider: {},
  db: {},
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("SignUp Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the sign up form correctly", () => {
    renderWithRouter(<SignUp />);

    expect(screen.getByRole("heading", { name: /Criar Conta/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Criar Conta/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuar com Google/i })).toBeInTheDocument();
  });

  it("handles email and password sign up successfully", async () => {
    const mockUser = { uid: "test-uid", email: "test@example.com" };
    vi.mocked(authFunctions.createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    // We expect doc to be called, just returning a fake reference
    vi.mocked(firestoreFunctions.doc).mockReturnValue("fake-doc-ref" as any);
    vi.mocked(firestoreFunctions.setDoc).mockResolvedValueOnce(undefined);

    renderWithRouter(<SignUp />);

    // Fill the form
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "123456" } });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /Criar Conta/i }));

    await waitFor(() => {
      expect(authFunctions.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "123456"
      );
    });

    await waitFor(() => {
      expect(firestoreFunctions.setDoc).toHaveBeenCalledWith(
        "fake-doc-ref",
        expect.objectContaining({
          id: "test-uid",
          email: "test@example.com",
          name: "Test User",
          isAdmin: true,
        })
      );
    });
  });

  it("handles google sign up successfully", async () => {
    const mockUser = { uid: "google-uid", email: "google@example.com", displayName: "Google User" };
    vi.mocked(authFunctions.signInWithPopup).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    vi.mocked(firestoreFunctions.doc).mockReturnValue("fake-doc-ref" as any);
    vi.mocked(firestoreFunctions.setDoc).mockResolvedValueOnce(undefined);

    renderWithRouter(<SignUp />);

    // Click Google button
    fireEvent.click(screen.getByRole("button", { name: /Continuar com Google/i }));

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
        })
      );
    });
  });

  it("shows error toast when email signup fails", async () => {
    vi.mocked(authFunctions.createUserWithEmailAndPassword).mockRejectedValueOnce(
      new Error("Firebase Auth Error")
    );

    renderWithRouter(<SignUp />);

    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "123456" } });

    fireEvent.click(screen.getByRole("button", { name: /Criar Conta/i }));

    await waitFor(() => {
      expect(authFunctions.createUserWithEmailAndPassword).toHaveBeenCalled();
      // Verifying loading state went back to false and form is usable again
      expect(screen.getByRole("button", { name: /Criar Conta/i })).not.toBeDisabled();
    });
  });
});

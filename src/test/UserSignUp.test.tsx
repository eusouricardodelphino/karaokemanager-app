import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import SignUp from "../pages/SignUp";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ user: null, isAuthenticated: false, isLoading: false, logout: vi.fn() }),
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  setDoc: vi.fn(),
  doc: vi.fn(() => ({ id: "mock-doc-ref" })),
  addDoc: vi.fn(),
  collection: vi.fn(),
  serverTimestamp: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock("@/firebase", () => ({
  auth: {},
  db: {},
}));

vi.mock("@/services/storeService", () => ({
  getStoreCodes: vi.fn().mockResolvedValue([]),
}));

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe("Singer SignUp (tab Sou cantor)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders singer form by default", () => {
    renderWithRouter(<SignUp />);
    expect(screen.getByLabelText(/Nome da loja/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
  });

  it("submit button is disabled when singer form is empty", () => {
    renderWithRouter(<SignUp />);
    expect(screen.getByTestId("submit-button")).toBeDisabled();
  });

  it("submit button enables when singer form is filled", async () => {
    renderWithRouter(<SignUp />);
    fireEvent.change(screen.getByLabelText(/Nome da loja/i), { target: { value: "Bar do Zé" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "joao@email.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "senha123" } });

    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).not.toBeDisabled();
    });
  });

  it("calls createUserWithEmailAndPassword on singer form submit", async () => {
    const { createUserWithEmailAndPassword } = await import("firebase/auth");
    const { setDoc } = await import("firebase/firestore");
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: "singer-uid", email: "joao@email.com", displayName: null },
    } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    renderWithRouter(<SignUp />);
    fireEvent.change(screen.getByLabelText(/Nome da loja/i), { target: { value: "Bar do Zé" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "joao@email.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "senha123" } });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "joao@email.com",
        "senha123"
      );
    });
  });
});

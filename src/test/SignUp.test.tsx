import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import SignUp from "../pages/SignUp";

vi.mock("@/firebase", () => ({
  auth: {},
  googleProvider: {},
  db: {},
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe("SignUp Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders heading and default singer tab", () => {
    renderWithRouter(<SignUp />);
    expect(screen.getByRole("heading", { name: /Criar Conta/i })).toBeInTheDocument();
    expect(screen.getByText(/Como você quer se cadastrar\?/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cadastrar com Google/i })).toBeInTheDocument();
  });

  it("shows singer tab with Google signup button by default", () => {
    renderWithRouter(<SignUp />);
    expect(screen.getByRole("button", { name: /Cadastrar com Google/i })).toBeInTheDocument();
    expect(screen.getByText(/Já tem uma conta\?/i)).toBeInTheDocument();
  });

  it("shows owner form when owner tab is selected", () => {
    renderWithRouter(<SignUp />);
    fireEvent.click(screen.getByRole("button", { name: /Sou uma loja/i }));
    expect(screen.getByLabelText(/Nome da loja/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
  });

  it("submit button is disabled when owner form is empty", () => {
    renderWithRouter(<SignUp />);
    fireEvent.click(screen.getByRole("button", { name: /Sou uma loja/i }));
    const submitBtn = screen.getByTestId("submit-button");
    expect(submitBtn).toBeDisabled();
  });

  it("submit button enables when owner form is filled", async () => {
    renderWithRouter(<SignUp />);
    fireEvent.click(screen.getByRole("button", { name: /Sou uma loja/i }));

    fireEvent.change(screen.getByLabelText(/Nome da loja/i), { target: { value: "Bar do Zé" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "bar@ze.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "senha123" } });

    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).not.toBeDisabled();
    });
  });

  it("calls createUserWithEmailAndPassword on owner form submit", async () => {
    const { createUserWithEmailAndPassword } = await import("firebase/auth");
    const { setDoc, addDoc, updateDoc } = await import("firebase/firestore");
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: "owner-uid", email: "bar@ze.com" },
    } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);
    vi.mocked(addDoc).mockResolvedValueOnce({ id: "store-id" } as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    renderWithRouter(<SignUp />);
    fireEvent.click(screen.getByRole("button", { name: /Sou uma loja/i }));

    fireEvent.change(screen.getByLabelText(/Nome da loja/i), { target: { value: "Bar do Zé" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "bar@ze.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "senha123" } });

    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "bar@ze.com",
        "senha123"
      );
    });
  });

  it("calls signInWithPopup on Google signup button click", async () => {
    const { signInWithPopup } = await import("firebase/auth");
    const { setDoc } = await import("firebase/firestore");
    vi.mocked(signInWithPopup).mockResolvedValueOnce({
      user: { uid: "user-uid", email: "user@gmail.com", displayName: "User Name" },
    } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    renderWithRouter(<SignUp />);
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar com Google/i }));

    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
    });
  });
});

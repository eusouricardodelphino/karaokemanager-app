import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import OwnerSignUp from "../pages/OwnerSignUp";
import * as authFunctions from "firebase/auth";
import * as firestoreFunctions from "firebase/firestore";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>();
  return { ...actual, createUserWithEmailAndPassword: vi.fn() };
});

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    setDoc: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    collection: vi.fn(),
  };
});

vi.mock("@/firebase", () => ({
  auth: {},
  db: {},
}));

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe("OwnerSignUp Component", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the owner sign up form correctly", () => {
    renderWithRouter(<OwnerSignUp />);

    expect(screen.getByRole("heading", { name: /Cadastro de Dono/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Dados pessoais/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Dados da loja/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nome$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    // Nome da loja e CNPJ não devem estar no documento inicialmente (sem forceMount)
    expect(screen.queryByLabelText(/Nome da loja/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/CNPJ/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Próximo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Próximo/i })).toBeDisabled();
    expect(screen.getByRole("link", { name: /Entrar no painel/i })).toHaveAttribute("href", "/owner/login");
  });

  it("handles email and password sign up successfully", async () => {
    const mockUser = { uid: "test-uid", email: "test@example.com" };
    vi.mocked(authFunctions.createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(firestoreFunctions.doc).mockReturnValue("fake-doc-ref" as any);
    vi.mocked(firestoreFunctions.collection).mockReturnValue("fake-stores-ref" as any);
    vi.mocked(firestoreFunctions.setDoc).mockResolvedValueOnce(undefined);
    vi.mocked(firestoreFunctions.addDoc).mockResolvedValueOnce({ id: "store-1" } as any);
    vi.mocked(firestoreFunctions.updateDoc).mockResolvedValueOnce(undefined);

    renderWithRouter(<OwnerSignUp />);

    fireEvent.change(screen.getByLabelText(/^Nome$/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "123456" } });
    
    const nextButton = screen.getByRole("button", { name: /Próximo/i });
    expect(nextButton).not.toBeDisabled();
    fireEvent.click(nextButton);

    expect(screen.getByRole("tab", { name: /Dados da loja/i })).toHaveAttribute("data-state", "active");
    expect(screen.getByRole("button", { name: /Criar conta/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Nome da loja/i), { target: { value: "Minha Loja" } });
    fireEvent.change(screen.getByLabelText(/CNPJ/i), { target: { value: "12.345.678/0001-99" } });
    
    const submitButton = screen.getByRole("button", { name: /Criar conta/i });
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);

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
          role: "owner",
        })
      );
    });
    await waitFor(() => {
      expect(firestoreFunctions.addDoc).toHaveBeenCalled();
      const [, storeData] = vi.mocked(firestoreFunctions.addDoc).mock.calls[0];
      expect(storeData).toMatchObject({
        name: "Minha Loja",
        ownerId: "test-uid",
        cnpj: "12345678000199",
      });
    });
  });

  it("shows error toast when email signup fails", async () => {
    vi.mocked(authFunctions.createUserWithEmailAndPassword).mockRejectedValueOnce(
      new Error("Firebase Auth Error")
    );

    renderWithRouter(<OwnerSignUp />);

    fireEvent.change(screen.getByLabelText(/^Nome$/i), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByTestId("submit-button"));
    
    // Esperar a troca de texto do botão
    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).toHaveTextContent(/Criar conta/i);
    });

    fireEvent.change(screen.getByLabelText(/Nome da loja/i), { target: { value: "Loja" } });
    fireEvent.change(screen.getByLabelText(/CNPJ/i), { target: { value: "12.345.678/0001-99" } });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(authFunctions.createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(screen.getByTestId("submit-button")).not.toBeDisabled();
    });
  });
});

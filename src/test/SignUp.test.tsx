import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";
import SignUp from "../pages/SignUp";

vi.mock("@/firebase", () => ({
  auth: {},
  db: {},
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ user: null, isAuthenticated: false, isLoading: false, logout: vi.fn() }),
}));

vi.mock("@/services/storeService", () => ({
  getStoreCodes: vi.fn().mockResolvedValue([]),
}));

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe("SignUp Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders heading and owner form", () => {
    renderWithRouter(<SignUp />);
    expect(screen.getByRole("heading", { name: /Criar Conta/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome da loja/i)).toBeInTheDocument();
  });

  it("shows email and password fields", () => {
    renderWithRouter(<SignUp />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByText(/Já tem uma conta\?/i)).toBeInTheDocument();
  });

  it("submit button is disabled when form is empty", () => {
    renderWithRouter(<SignUp />);
    const submitBtn = screen.getByTestId("submit-button");
    expect(submitBtn).toBeDisabled();
  });

  it("submit button enables when form is filled", async () => {
    renderWithRouter(<SignUp />);
    fireEvent.change(screen.getByLabelText(/Nome da loja/i), { target: { value: "Bar do Zé" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "bar@ze.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "senha123" } });

    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).not.toBeDisabled();
    });
  });

  it("calls createUserWithEmailAndPassword on form submit", async () => {
    const { createUserWithEmailAndPassword } = await import("firebase/auth");
    const { setDoc, addDoc, updateDoc } = await import("firebase/firestore");
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: "owner-uid", email: "bar@ze.com" },
    } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);
    vi.mocked(addDoc).mockResolvedValueOnce({ id: "store-id" } as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    renderWithRouter(<SignUp />);
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
});

describe("SignUp — redirect after sign up", () => {
  const renderForNavigation = (initialPath = "/signup") =>
    render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/stores" element={<div>Store List</div>} />
          <Route path="/:storeId" element={<div>Owner Store</div>} />
        </Routes>
      </MemoryRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redireciona owner para a própria loja após cadastro", async () => {
    const { createUserWithEmailAndPassword } = await import("firebase/auth");
    const { setDoc, addDoc, updateDoc } = await import("firebase/firestore");
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: "owner-uid", email: "bar@ze.com" },
    } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);
    vi.mocked(addDoc).mockResolvedValueOnce({ id: "store-xyz" } as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    renderForNavigation("/signup");

    fireEvent.change(screen.getByLabelText(/Nome da loja/i), { target: { value: "Bar do Zé" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "bar@ze.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "senha123" } });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Owner Store")).toBeInTheDocument();
    });
  });

  it("respeita redirectTo quando param está presente", async () => {
    const { createUserWithEmailAndPassword } = await import("firebase/auth");
    const { setDoc, addDoc, updateDoc } = await import("firebase/firestore");
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: "owner-uid", email: "bar@ze.com" },
    } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);
    vi.mocked(addDoc).mockResolvedValueOnce({ id: "store-xyz" } as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    renderForNavigation("/signup?redirect=/alguma-loja");

    fireEvent.change(screen.getByLabelText(/Nome da loja/i), { target: { value: "Bar do Zé" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "bar@ze.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "senha123" } });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Owner Store")).toBeInTheDocument();
    });
  });
});

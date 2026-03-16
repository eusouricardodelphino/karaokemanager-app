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
    expect(screen.getByPlaceholderText(/Nome do cantor/i)).toBeInTheDocument();
  });

  it("shows singer form with email and password fields by default", () => {
    renderWithRouter(<SignUp />);
    expect(screen.getByPlaceholderText(/Nome do cantor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByText(/Já tem uma conta\?/i)).toBeInTheDocument();
  });

  it("submit button is disabled when singer form is empty", () => {
    renderWithRouter(<SignUp />);
    const submitBtn = screen.getByTestId("submit-button");
    expect(submitBtn).toBeDisabled();
  });

  it("submit button enables when singer form is filled", async () => {
    renderWithRouter(<SignUp />);
    fireEvent.change(screen.getByPlaceholderText(/Nome do cantor/i), { target: { value: "João Silva" } });
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
    fireEvent.change(screen.getByPlaceholderText(/Nome do cantor/i), { target: { value: "João Silva" } });
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
});

describe("SignUp — redirect after singer sign up", () => {
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

  it("redireciona singer para /stores após cadastro sem redirectTo", async () => {
    const { createUserWithEmailAndPassword } = await import("firebase/auth");
    const { setDoc } = await import("firebase/firestore");
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: "singer-uid", email: "joao@email.com" },
    } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    renderForNavigation("/signup");

    fireEvent.change(screen.getByPlaceholderText(/Nome do cantor/i), { target: { value: "João" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "joao@email.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "senha123" } });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Store List")).toBeInTheDocument();
    });
  });

  it("respeita redirectTo ao invés de /stores quando param está presente", async () => {
    const { createUserWithEmailAndPassword } = await import("firebase/auth");
    const { setDoc } = await import("firebase/firestore");
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: "singer-uid", email: "joao@email.com" },
    } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    renderForNavigation("/signup?redirect=/alguma-loja");

    fireEvent.change(screen.getByPlaceholderText(/Nome do cantor/i), { target: { value: "João" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "joao@email.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "senha123" } });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Owner Store")).toBeInTheDocument();
    });
  });

  it("owner ainda é redirecionado para a própria loja após cadastro", async () => {
    const { createUserWithEmailAndPassword } = await import("firebase/auth");
    const { setDoc, addDoc, updateDoc } = await import("firebase/firestore");
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: "owner-uid", email: "bar@ze.com" },
    } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);
    vi.mocked(addDoc).mockResolvedValueOnce({ id: "store-xyz" } as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    renderForNavigation("/signup");

    fireEvent.click(screen.getByRole("button", { name: /Sou uma loja/i }));
    fireEvent.change(screen.getByLabelText(/Nome da loja/i), { target: { value: "Bar do Zé" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "bar@ze.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "senha123" } });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Owner Store")).toBeInTheDocument();
    });
  });
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import * as authFunctions from "firebase/auth";
import * as firestoreFunctions from "firebase/firestore";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ user: null, isAuthenticated: false, isLoading: false, logout: vi.fn() }),
}));

vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>();
  return {
    ...actual,
    signInWithEmailAndPassword: vi.fn(),
  };
});

vi.mock("@/firebase", () => ({
  auth: {},
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
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

  it("link 'Criar conta' aponta para /signup", () => {
    renderWithRouter(<Login />);
    const link = screen.getByRole("link", { name: /Criar conta/i });
    expect(link).toHaveAttribute("href", "/signup");
  });
});

describe("Login — redirect after sign in", () => {
  const renderForNavigation = (initialPath = "/login") =>
    render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/stores" element={<div>Store List</div>} />
          <Route path="/:storeId" element={<div>Owner Store</div>} />
        </Routes>
      </MemoryRouter>
    );

  const fillAndSubmit = () => {
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "user@test.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /^Entrar$/i }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authFunctions.signInWithEmailAndPassword).mockResolvedValue({
      user: { uid: "uid-1" },
    } as any);
  });

  it("redireciona singer (sem storeId) para /stores quando não há redirectTo", async () => {
    vi.mocked(firestoreFunctions.getDoc).mockResolvedValue({
      data: () => ({ role: "singer" }),
    } as any);

    renderForNavigation("/login");
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText("Store List")).toBeInTheDocument();
    });
  });

  it("redireciona owner (com storeId) para a própria loja quando não há redirectTo", async () => {
    vi.mocked(firestoreFunctions.getDoc).mockResolvedValue({
      data: () => ({ role: "owner", storeId: "my-store" }),
    } as any);

    renderForNavigation("/login");
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText("Owner Store")).toBeInTheDocument();
    });
  });

  it("respeita o redirectTo independente do role", async () => {
    vi.mocked(firestoreFunctions.getDoc).mockResolvedValue({
      data: () => ({ role: "singer" }),
    } as any);

    renderForNavigation("/login?redirect=/alguma-loja");
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText("Owner Store")).toBeInTheDocument();
    });
  });
});

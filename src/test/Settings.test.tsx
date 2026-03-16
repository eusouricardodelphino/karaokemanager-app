import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Settings from "../pages/Settings";
import { ThemeProvider } from "../contexts/ThemeContext";
import * as useCurrentUserModule from "../hooks/useCurrentUser";
import * as useFirebaseModule from "../hooks/firebaseContext";
import * as storeService from "../services/storeService";

vi.mock("@/components/Navigation", () => ({
  default: () => <nav data-testid="navigation" />,
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/hooks/firebaseContext", () => ({
  useFirebase: vi.fn(),
}));

vi.mock("@/services/storeService", () => ({
  getStore: vi.fn(),
  updateStore: vi.fn(),
  getStores: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

const singerUser = { id: "u1", name: "Singer", role: "singer" as const };
const ownerUser  = { id: "u2", name: "Owner", role: "owner" as const, storeId: "store-1" };

const renderSettings = () =>
  render(
    <BrowserRouter>
      <ThemeProvider>
        <Settings />
      </ThemeProvider>
    </BrowserRouter>
  );

describe("Settings Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: singerUser, isLoading: false, isAuthenticated: true, logout: vi.fn(),
    });
    vi.mocked(useFirebaseModule.useFirebase).mockReturnValue({ db: {} as any });
  });

  it("renders the settings page correctly", () => {
    renderSettings();
    expect(screen.getByRole("heading", { name: /Configurações/i })).toBeInTheDocument();
    expect(screen.getByText(/Aparência/i)).toBeInTheDocument();
    expect(screen.getByText(/Sobre/i)).toBeInTheDocument();
    expect(screen.getByText(/Versão 1.0.0/i)).toBeInTheDocument();
    expect(screen.getByTestId("navigation")).toBeInTheDocument();
  });

  it("displays the light and dark theme options", () => {
    renderSettings();
    expect(screen.getByRole("button", { name: /Claro/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Escuro/i })).toBeInTheDocument();
  });

  it("switches to dark theme when Escuro button is clicked", () => {
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: /Escuro/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("switches to light theme when Claro button is clicked", () => {
    localStorage.setItem("theme", "dark");
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: /Claro/i }));
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("does not show store profile card for non-owners", () => {
    renderSettings();
    expect(screen.queryByText(/Perfil da Loja/i)).not.toBeInTheDocument();
  });
});

describe("Settings — Store Profile Card", () => {
  const mockStore = {
    id: "store-1",
    name: "Bar do Zé",
    address: "Rua das Flores, 123",
    cnpj: "12.345.678/0001-90",
    phones: [{ ddd: "11", number: "999999999", whatsapp: true }],
    ownerId: "u2",
    active: true,
    createdAt: "2024-01-01",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: ownerUser, isLoading: false, isAuthenticated: true, logout: vi.fn(),
    });
    vi.mocked(useFirebaseModule.useFirebase).mockReturnValue({ db: {} as any });
    vi.mocked(storeService.getStore).mockResolvedValue(mockStore as any);
    vi.mocked(storeService.updateStore).mockResolvedValue(undefined);
  });

  it("shows store profile card for owners", async () => {
    renderSettings();
    expect(await screen.findByText(/Perfil da Loja/i)).toBeInTheDocument();
  });

  it("loads and displays existing store data", async () => {
    renderSettings();
    expect(await screen.findByDisplayValue("Bar do Zé")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Rua das Flores, 123")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12.345.678/0001-90")).toBeInTheDocument();
    expect(screen.getByDisplayValue("999999999")).toBeInTheDocument();
  });

  it("adds a new phone entry when clicking Adicionar", async () => {
    renderSettings();
    await screen.findByText(/Perfil da Loja/i);
    const before = screen.getAllByPlaceholderText("99999-9999").length;
    fireEvent.click(screen.getByRole("button", { name: /Adicionar/i }));
    expect(screen.getAllByPlaceholderText("99999-9999").length).toBe(before + 1);
  });

  it("removes a phone entry when clicking the trash icon", async () => {
    renderSettings();
    await screen.findByText(/Perfil da Loja/i);
    fireEvent.click(screen.getByRole("button", { name: /Remover telefone/i }));
    expect(screen.queryByDisplayValue("999999999")).not.toBeInTheDocument();
  });

  it("calls updateStore with correct data on save", async () => {
    renderSettings();
    await screen.findByDisplayValue("Bar do Zé");

    fireEvent.change(screen.getByDisplayValue("Bar do Zé"), {
      target: { value: "Bar do João" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/i }));

    await waitFor(() => {
      expect(storeService.updateStore).toHaveBeenCalledWith(
        expect.anything(),
        "store-1",
        expect.objectContaining({ name: "Bar do João" })
      );
    });
  });

  it("blocks save and does not call updateStore when name is empty", async () => {
    renderSettings();
    await screen.findByDisplayValue("Bar do Zé");

    fireEvent.change(screen.getByDisplayValue("Bar do Zé"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/i }));

    await waitFor(() => {
      expect(storeService.updateStore).not.toHaveBeenCalled();
    });
  });
});

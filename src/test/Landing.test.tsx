import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Landing from "../pages/Landing";
import * as storeService from "../services/storeService";
import * as useFirebaseModule from "../hooks/firebaseContext";

vi.mock("@/hooks/firebaseContext", () => ({
  useFirebase: vi.fn(),
}));

vi.mock("@/services/storeService", () => ({
  getStoreByCode: vi.fn(),
}));

const renderLanding = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/scan" element={<div>Scan Page</div>} />
        <Route path="/:storeId" element={<div>Store Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("Landing Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFirebaseModule.useFirebase).mockReturnValue({ db: {} as any });
  });

  it("renders heading and code input", () => {
    renderLanding();
    expect(screen.getByText(/KARAOKE MANAGER/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Código do Bar/i)).toBeInTheDocument();
  });

  it("submit button is disabled when code is shorter than 3 chars", () => {
    renderLanding();
    fireEvent.change(screen.getByPlaceholderText(/Código do Bar/i), { target: { value: "AB" } });
    expect(screen.getByRole("button", { name: /ACESSAR FILA/i })).toBeDisabled();
  });

  it("submit button enables when code has 3+ chars", () => {
    renderLanding();
    fireEvent.change(screen.getByPlaceholderText(/Código do Bar/i), { target: { value: "123" } });
    expect(screen.getByRole("button", { name: /ACESSAR FILA/i })).not.toBeDisabled();
  });

  it("navigates to store page on valid code", async () => {
    vi.mocked(storeService.getStoreByCode).mockResolvedValueOnce({
      id: "store-1", name: "Bar do Rock", active: true,
    } as any);
    renderLanding();
    fireEvent.change(screen.getByPlaceholderText(/Código do Bar/i), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: /ACESSAR FILA/i }));
    await waitFor(() => expect(screen.getByText("Store Page")).toBeInTheDocument());
  });

  it("shows error message when code is not found", async () => {
    vi.mocked(storeService.getStoreByCode).mockResolvedValueOnce(null);
    renderLanding();
    fireEvent.change(screen.getByPlaceholderText(/Código do Bar/i), { target: { value: "999" } });
    fireEvent.click(screen.getByRole("button", { name: /ACESSAR FILA/i }));
    await waitFor(() =>
      expect(screen.getByText(/Código não encontrado/i)).toBeInTheDocument()
    );
  });

  it("shows error message when getStoreByCode throws", async () => {
    vi.mocked(storeService.getStoreByCode).mockRejectedValueOnce(new Error("network"));
    renderLanding();
    fireEvent.change(screen.getByPlaceholderText(/Código do Bar/i), { target: { value: "999" } });
    fireEvent.click(screen.getByRole("button", { name: /ACESSAR FILA/i }));
    await waitFor(() =>
      expect(screen.getByText(/Erro ao buscar/i)).toBeInTheDocument()
    );
  });

  it("clears error when user types again", async () => {
    vi.mocked(storeService.getStoreByCode).mockResolvedValueOnce(null);
    renderLanding();
    const input = screen.getByPlaceholderText(/Código do Bar/i);
    fireEvent.change(input, { target: { value: "999" } });
    fireEvent.click(screen.getByRole("button", { name: /ACESSAR FILA/i }));
    await screen.findByText(/Código não encontrado/i);
    fireEvent.change(input, { target: { value: "998" } });
    expect(screen.queryByText(/Código não encontrado/i)).not.toBeInTheDocument();
  });

  it("navigates to /scan when scan button is clicked", async () => {
    renderLanding();
    fireEvent.click(screen.getByRole("button", { name: /ESCANEAR QR CODE/i }));
    await waitFor(() => expect(screen.getByText("Scan Page")).toBeInTheDocument());
  });

  it("has a link to /login", () => {
    renderLanding();
    expect(screen.getByRole("link", { name: /Sou Dono de Bar/i })).toHaveAttribute("href", "/login");
  });
});

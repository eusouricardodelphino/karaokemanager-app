import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import * as queueService from "../services/queueService";
import * as useCurrentUserModule from "../hooks/useCurrentUser";
import * as useFirebaseModule from "../hooks/firebaseContext";

vi.mock("@/components/Navigation", () => ({ default: () => <nav data-testid="nav" /> }));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

vi.mock("@/services/queueService", () => ({
  subscribeToQueue: vi.fn(() => vi.fn()),
  subscribeToOnStageSinger: vi.fn(() => vi.fn()),
  isStageEngaged: vi.fn(),
  putSingerOnStage: vi.fn(),
  markSingerAsAlreadySang: vi.fn(),
  removeSingerFromStage: vi.fn(),
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/hooks/firebaseContext", () => ({
  useFirebase: vi.fn(),
}));

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={["/restaurant-1"]}>
      <Routes>
        <Route path="/:restaurantId" element={<Home />} />
      </Routes>
    </MemoryRouter>
  );

describe("Home Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFirebaseModule.useFirebase).mockReturnValue({ db: {} as any });
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      logout: vi.fn(),
    });
    vi.mocked(queueService.subscribeToQueue).mockImplementation((_db, _id, listener) => {
      listener([]); // empty queue by default
      return vi.fn();
    });
    vi.mocked(queueService.subscribeToOnStageSinger).mockImplementation((_db, _id, listener) => {
      listener(null); // nobody on stage
      return vi.fn();
    });
  });

  it("renders the stage and queue cards", () => {
    renderHome();
    expect(screen.getByText(/No Palco Agora/i)).toBeInTheDocument();
    // "Fila" appears in the card title alongside the count e.g. "Fila (0)"
    expect(screen.getByText(/Fila \(/i)).toBeInTheDocument();
  });

  it("shows empty state when queue is empty", () => {
    renderHome();
    expect(screen.getByText(/Fila vazia/i)).toBeInTheDocument();
    expect(screen.getByText(/Palco vazio/i)).toBeInTheDocument();
  });

  it("shows singer on stage when currentSinger is set", () => {
    vi.mocked(queueService.subscribeToOnStageSinger).mockImplementation((_db, _id, listener) => {
      listener({ id: "s1", name: "Maria", song: "Bohemian Rhapsody", nameSearch: "maria", alreadySang: false, visitDate: "01.01.24", addedAt: new Date(), restaurantId: "r1" });
      return vi.fn();
    });

    renderHome();
    expect(screen.getByText("Maria")).toBeInTheDocument();
    expect(screen.getByText(/Bohemian Rhapsody/i)).toBeInTheDocument();
  });

  it("shows queue items when queue has singers", () => {
    vi.mocked(queueService.subscribeToQueue).mockImplementation((_db, _id, listener) => {
      listener([
        { id: "q1", name: "João", song: "Yesterday", nameSearch: "joao", alreadySang: false, visitDate: "01.01.24", addedAt: new Date(), restaurantId: "r1" },
      ]);
      return vi.fn();
    });

    renderHome();
    expect(screen.getByText("João")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });

  it("shows admin buttons when user is admin and there is a singer on stage", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: { id: "u1", name: "Admin", isAdmin: true, createdAt: "" },
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
    vi.mocked(queueService.subscribeToOnStageSinger).mockImplementation((_db, _id, listener) => {
      listener({ id: "s1", name: "Pedro", song: "Let It Be", nameSearch: "pedro", alreadySang: false, visitDate: "01.01.24", addedAt: new Date(), restaurantId: "r1" });
      return vi.fn();
    });

    renderHome();
    expect(screen.getByRole("button", { name: /Finalizar Performance/i })).toBeInTheDocument();
  });

  it("shows 'Próximo' button when user is admin and queue is not empty", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: { id: "u1", name: "Admin", isAdmin: true, createdAt: "" },
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
    vi.mocked(queueService.subscribeToQueue).mockImplementation((_db, _id, listener) => {
      listener([{ id: "q1", name: "Ana", song: "Summer", nameSearch: "ana", alreadySang: false, visitDate: "01.01.24", addedAt: new Date(), restaurantId: "r1" }]);
      return vi.fn();
    });

    renderHome();
    expect(screen.getByRole("button", { name: /Próximo/i })).toBeInTheDocument();
  });
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import * as queueService from "../services/queueService";
import * as sessionService from "../services/sessionService";
import * as useCurrentUserModule from "../hooks/useCurrentUser";
import * as useFirebaseModule from "../hooks/firebaseContext";
import type { QueueItem } from "../types/queue";
import type { SessionSnapshot } from "../types/session";

vi.mock("@/components/Navigation", () => ({ default: () => <nav data-testid="nav" /> }));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

vi.mock("@/services/queueService", () => ({
  subscribeToQueue: vi.fn(() => vi.fn()),
  subscribeToOnStageSinger: vi.fn(() => vi.fn()),
  isStageEngaged: vi.fn(),
  putSingerOnStage: vi.fn(),
  markSingerAsAlreadySangById: vi.fn(),
  removeSingerFromStage: vi.fn(),
}));

vi.mock("@/services/sessionService", () => ({
  subscribeToActiveSession: vi.fn(() => vi.fn()),
  openSession: vi.fn(),
  closeSession: vi.fn(),
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/hooks/firebaseContext", () => ({
  useFirebase: vi.fn(),
}));

const makeItem = (overrides: Partial<QueueItem> = {}): QueueItem => ({
  id: "q1",
  name: "Ana",
  song: "Summer",
  nameSearch: "ana",
  alreadySang: false,
  visitDate: "01.01.24",
  addedAt: new Date(),
  ...overrides,
});

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={["/restaurant-1"]}>
      <Routes>
        <Route path="/:restaurantId" element={<Home />} />
      </Routes>
    </MemoryRouter>
  );

const mockAdmin = () =>
  vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
    user: { id: "u1", name: "Admin", role: "owner", createdAt: "" },
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
  });

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
      listener([]);
      return vi.fn();
    });
    vi.mocked(queueService.subscribeToOnStageSinger).mockImplementation((_db, _id, listener) => {
      listener(null);
      return vi.fn();
    });
  });

  it("renders the stage and queue cards", () => {
    renderHome();
    expect(screen.getByText(/No Palco Agora/i)).toBeInTheDocument();
    expect(screen.getByText(/Fila \(/i)).toBeInTheDocument();
  });

  it("shows empty state when queue is empty", () => {
    renderHome();
    expect(screen.getByText(/Fila vazia/i)).toBeInTheDocument();
    expect(screen.getByText(/Palco vazio/i)).toBeInTheDocument();
  });

  it("shows singer on stage when currentSinger is set", () => {
    vi.mocked(queueService.subscribeToOnStageSinger).mockImplementation((_db, _id, listener) => {
      listener(makeItem({ id: "s1", name: "Maria", song: "Bohemian Rhapsody", nameSearch: "maria" }));
      return vi.fn();
    });

    renderHome();
    expect(screen.getByText("Maria")).toBeInTheDocument();
    expect(screen.getByText(/Bohemian Rhapsody/i)).toBeInTheDocument();
  });

  it("shows queue items when queue has singers", () => {
    vi.mocked(queueService.subscribeToQueue).mockImplementation((_db, _id, listener) => {
      listener([makeItem({ id: "q1", name: "João", song: "Yesterday", nameSearch: "joao" })]);
      return vi.fn();
    });

    renderHome();
    expect(screen.getByText("João")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });

  it("shows admin buttons when user is admin and there is a singer on stage", () => {
    mockAdmin();
    vi.mocked(queueService.subscribeToOnStageSinger).mockImplementation((_db, _id, listener) => {
      listener(makeItem({ id: "s1", name: "Pedro", song: "Let It Be", nameSearch: "pedro" }));
      return vi.fn();
    });

    renderHome();
    expect(screen.getByRole("button", { name: /Finalizar Performance/i })).toBeInTheDocument();
  });

  it("shows 'Próximo' button when user is admin and queue is not empty", () => {
    mockAdmin();
    vi.mocked(queueService.subscribeToQueue).mockImplementation((_db, _id, listener) => {
      listener([makeItem()]);
      return vi.fn();
    });

    renderHome();
    expect(screen.getByRole("button", { name: /Próximo/i })).toBeInTheDocument();
  });

  it("calls putSingerOnStage and markSingerAsAlreadySangById when stage is free", async () => {
    mockAdmin();
    vi.mocked(queueService.subscribeToQueue).mockImplementation((_db, _id, listener) => {
      listener([makeItem({ id: "q1", name: "Ana", song: "Summer" })]);
      return vi.fn();
    });
    vi.mocked(queueService.isStageEngaged).mockResolvedValue(false);
    vi.mocked(queueService.putSingerOnStage).mockResolvedValue(undefined);
    vi.mocked(queueService.markSingerAsAlreadySangById).mockResolvedValue(undefined);

    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /Próximo/i }));

    await waitFor(() => {
      expect(queueService.putSingerOnStage).toHaveBeenCalled();
      expect(queueService.markSingerAsAlreadySangById).toHaveBeenCalledWith(
        expect.anything(), "restaurant-1", "q1"
      );
    });
  });

  it("does not call putSingerOnStage when stage is engaged", async () => {
    mockAdmin();
    vi.mocked(queueService.subscribeToQueue).mockImplementation((_db, _id, listener) => {
      listener([makeItem()]);
      return vi.fn();
    });
    vi.mocked(queueService.isStageEngaged).mockResolvedValue(true);

    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /Próximo/i }));

    await waitFor(() => {
      expect(queueService.isStageEngaged).toHaveBeenCalled();
      expect(queueService.putSingerOnStage).not.toHaveBeenCalled();
    });
  });

  it("calls removeSingerFromStage when 'Finalizar Performance' is clicked", async () => {
    mockAdmin();
    vi.mocked(queueService.subscribeToOnStageSinger).mockImplementation((_db, _id, listener) => {
      listener(makeItem({ id: "s1", name: "Pedro", song: "Let It Be", nameSearch: "pedro" }));
      return vi.fn();
    });
    vi.mocked(queueService.removeSingerFromStage).mockResolvedValue(undefined);

    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /Finalizar Performance/i }));

    await waitFor(() => {
      expect(queueService.removeSingerFromStage).toHaveBeenCalledWith(
        expect.anything(), "restaurant-1"
      );
    });
  });
});

const makeSession = (overrides: Partial<SessionSnapshot> = {}): SessionSnapshot => ({
  id: "2026-03-13",
  date: "2026-03-13",
  status: "open",
  openedAt: { toMillis: () => Date.now() } as any,
  openedBy: "u1",
  ...overrides,
});

describe("Home — Session Controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFirebaseModule.useFirebase).mockReturnValue({ db: {} as any });
    vi.mocked(queueService.subscribeToQueue).mockImplementation((_db, _id, listener) => {
      listener([]);
      return vi.fn();
    });
    vi.mocked(queueService.subscribeToOnStageSinger).mockImplementation((_db, _id, listener) => {
      listener(null);
      return vi.fn();
    });
  });

  it("shows 'Abrir Sessão' button for owner when session is closed", () => {
    mockAdmin();
    vi.mocked(sessionService.subscribeToActiveSession).mockImplementation((_db, _id, listener) => {
      listener(null);
      return vi.fn();
    });

    renderHome();
    expect(screen.getByRole("button", { name: /Abrir Sessão/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Encerrar Sessão/i })).not.toBeInTheDocument();
  });

  it("shows 'Encerrar Sessão' button for owner when session is open", () => {
    mockAdmin();
    vi.mocked(sessionService.subscribeToActiveSession).mockImplementation((_db, _id, listener) => {
      listener(makeSession());
      return vi.fn();
    });

    renderHome();
    expect(screen.getByRole("button", { name: /Encerrar Sessão/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Abrir Sessão/i })).not.toBeInTheDocument();
  });

  it("does not show session controls for non-owner users", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: { id: "u2", name: "Singer", role: "singer", createdAt: "" },
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
    vi.mocked(sessionService.subscribeToActiveSession).mockImplementation((_db, _id, listener) => {
      listener(null);
      return vi.fn();
    });

    renderHome();
    expect(screen.queryByRole("button", { name: /Abrir Sessão/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Encerrar Sessão/i })).not.toBeInTheDocument();
  });

  it("shows closed session banner when no active session", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      logout: vi.fn(),
    });
    vi.mocked(sessionService.subscribeToActiveSession).mockImplementation((_db, _id, listener) => {
      listener(null);
      return vi.fn();
    });

    renderHome();
    expect(screen.getByText(/A fila ainda não foi aberta/i)).toBeInTheDocument();
  });

  it("hides closed session banner when session is open", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      logout: vi.fn(),
    });
    vi.mocked(sessionService.subscribeToActiveSession).mockImplementation((_db, _id, listener) => {
      listener(makeSession());
      return vi.fn();
    });

    renderHome();
    expect(screen.queryByText(/A fila ainda não foi aberta/i)).not.toBeInTheDocument();
  });

  it("calls openSession with correct args when 'Abrir Sessão' is clicked", async () => {
    mockAdmin();
    vi.mocked(sessionService.subscribeToActiveSession).mockImplementation((_db, _id, listener) => {
      listener(null);
      return vi.fn();
    });
    vi.mocked(sessionService.openSession).mockResolvedValue(undefined);

    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /Abrir Sessão/i }));

    await waitFor(() => {
      expect(sessionService.openSession).toHaveBeenCalledWith(expect.anything(), "restaurant-1", "u1");
    });
  });

  it("calls removeSingerFromStage then closeSession when 'Encerrar Sessão' is clicked", async () => {
    mockAdmin();
    vi.mocked(sessionService.subscribeToActiveSession).mockImplementation((_db, _id, listener) => {
      listener(makeSession());
      return vi.fn();
    });
    vi.mocked(queueService.removeSingerFromStage).mockResolvedValue(undefined);
    vi.mocked(sessionService.closeSession).mockResolvedValue(undefined);

    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /Encerrar Sessão/i }));

    await waitFor(() => {
      expect(queueService.removeSingerFromStage).toHaveBeenCalledWith(expect.anything(), "restaurant-1");
      expect(sessionService.closeSession).toHaveBeenCalledWith(
        expect.anything(), "restaurant-1", "2026-03-13", "u1"
      );
    });
  });

  it("calls removeSingerFromStage before closeSession (order matters)", async () => {
    mockAdmin();
    vi.mocked(sessionService.subscribeToActiveSession).mockImplementation((_db, _id, listener) => {
      listener(makeSession());
      return vi.fn();
    });

    const callOrder: string[] = [];
    vi.mocked(queueService.removeSingerFromStage).mockImplementation(async () => {
      callOrder.push("removeSingerFromStage");
    });
    vi.mocked(sessionService.closeSession).mockImplementation(async () => {
      callOrder.push("closeSession");
    });

    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /Encerrar Sessão/i }));

    await waitFor(() => expect(callOrder).toHaveLength(2));
    expect(callOrder).toEqual(["removeSingerFromStage", "closeSession"]);
  });
});

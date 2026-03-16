import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AddToQueue from "../pages/AddToQueue";
import * as queueService from "../services/queueService";
import * as sessionService from "../services/sessionService";
import * as useFirebaseModule from "../hooks/firebaseContext";
import * as useCurrentUserModule from "../hooks/useCurrentUser";
import { toast } from "@/hooks/use-toast";

vi.mock("@/components/Navigation", () => ({ default: () => <nav data-testid="nav" /> }));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

vi.mock("@/services/queueService", () => ({
  addSingerToQueue: vi.fn(),
  findSingerInQueue: vi.fn(),
}));

vi.mock("@/services/sessionService", () => ({
  getActiveSession: vi.fn(),
}));

vi.mock("@/hooks/firebaseContext", () => ({
  useFirebase: vi.fn(),
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    doc: vi.fn(() => "mock-store-ref"),
    getDoc: vi.fn().mockResolvedValue({ exists: () => true }),
  };
});

const renderAddToQueue = async () => {
  const result = render(
    <MemoryRouter initialEntries={["/restaurant-1/add"]}>
      <Routes>
        <Route path="/:storeId/add" element={<AddToQueue />} />
        <Route path="/:storeId" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
  // Wait for storeExists check to resolve before interacting with the form
  await screen.findByRole("button", { name: /Adicionar à Fila/i });
  return result;
};

const openSessionSnapshot = {
  id: "2026-03-13", date: "2026-03-13", status: "open" as const,
  openedAt: { toMillis: () => Date.now() } as any, openedBy: "uid-owner",
};

describe("AddToQueue Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFirebaseModule.useFirebase).mockReturnValue({ db: {} as any });
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: { id: "uid-1", name: "Carlos Souza", role: "singer" },
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });
    // Default: session is open so existing tests can reach queue logic
    vi.mocked(sessionService.getActiveSession).mockResolvedValue(openSessionSnapshot);
  });

  it("renders the form fields correctly", async () => {
    await renderAddToQueue();
    expect(document.getElementById("name")).toBeInTheDocument();
    expect(document.getElementById("song")).toBeInTheDocument();
    expect(document.getElementById("band")).toBeInTheDocument();
    expect(document.getElementById("link")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Adicionar à Fila/i })).toBeInTheDocument();
  });

  it("name field is pre-filled with Google user name and is read-only for singer", async () => {
    await renderAddToQueue();
    const nameInput = document.getElementById("name") as HTMLInputElement;
    expect(nameInput.value).toBe("Carlos Souza");
    expect(nameInput).toHaveAttribute("readonly");
  });

  it("name field is editable for owner role", async () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: { id: "uid-2", name: "Owner User", role: "owner" },
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });
    await renderAddToQueue();
    const nameInput = document.getElementById("name") as HTMLInputElement;
    expect(nameInput).not.toHaveAttribute("readonly");
    fireEvent.change(nameInput, { target: { value: "Custom Singer Name" } });
    expect(nameInput.value).toBe("Custom Singer Name");
  });

  it("name field is editable for staff role", async () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: { id: "uid-3", name: "Staff User", role: "staff" },
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });
    await renderAddToQueue();
    const nameInput = document.getElementById("name") as HTMLInputElement;
    expect(nameInput).not.toHaveAttribute("readonly");
  });

  it("does NOT submit when song is empty", async () => {
    await renderAddToQueue();
    fireEvent.click(screen.getByRole("button", { name: /Adicionar à Fila/i }));
    await waitFor(() => {
      expect(queueService.addSingerToQueue).not.toHaveBeenCalled();
    });
  });

  it("name field is empty when singer has no name in profile", async () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: { id: "uid-1", name: undefined, role: "singer" },
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });
    await renderAddToQueue();
    const nameInput = document.getElementById("name") as HTMLInputElement;
    expect(nameInput.value).toBe("");
  });

  it("prevents adding to queue when singer is already in queue", async () => {
    vi.mocked(queueService.findSingerInQueue).mockResolvedValueOnce({ empty: false } as any);

    await renderAddToQueue();

    fireEvent.change(document.getElementById("song")!, { target: { value: "Yesterday" } });

    fireEvent.click(screen.getByRole("button", { name: /Adicionar à Fila/i }));

    await waitFor(() => {
      expect(queueService.findSingerInQueue).toHaveBeenCalled();
      expect(queueService.addSingerToQueue).not.toHaveBeenCalled();
    });
  });

  it("adds singer to queue successfully and clears form", async () => {
    vi.mocked(queueService.findSingerInQueue).mockResolvedValueOnce({ empty: true } as any);
    vi.mocked(queueService.addSingerToQueue).mockResolvedValueOnce(undefined);

    await renderAddToQueue();

    fireEvent.change(document.getElementById("song")!, { target: { value: "Bohemian Rhapsody" } });

    fireEvent.click(screen.getByRole("button", { name: /Adicionar à Fila/i }));

    await waitFor(() => {
      expect(queueService.addSingerToQueue).toHaveBeenCalledWith(
        expect.anything(),
        "restaurant-1",
        expect.objectContaining({
          name: "Carlos Souza",
          song: "Bohemian Rhapsody",
          alreadySang: false,
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
  });
});

describe("AddToQueue — Session Gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFirebaseModule.useFirebase).mockReturnValue({ db: {} as any });
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValue({
      user: { id: "uid-1", name: "Carlos Souza", role: "singer" },
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });
  });

  it("blocks submission and shows toast when there is no active session", async () => {
    vi.mocked(sessionService.getActiveSession).mockResolvedValueOnce(null);

    await renderAddToQueue();
    fireEvent.change(document.getElementById("song")!, { target: { value: "Yesterday" } });
    fireEvent.click(screen.getByRole("button", { name: /Adicionar à Fila/i }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Fila fechada", variant: "destructive" })
      );
      expect(queueService.addSingerToQueue).not.toHaveBeenCalled();
      expect(queueService.findSingerInQueue).not.toHaveBeenCalled();
    });
  });

  it("blocks submission and shows toast when session is closed", async () => {
    vi.mocked(sessionService.getActiveSession).mockResolvedValueOnce({
      id: "2026-03-13", date: "2026-03-13", status: "closed",
      openedAt: { toMillis: () => Date.now() } as any, openedBy: "uid-owner",
    });

    await renderAddToQueue();
    fireEvent.change(document.getElementById("song")!, { target: { value: "Yesterday" } });
    fireEvent.click(screen.getByRole("button", { name: /Adicionar à Fila/i }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Fila fechada", variant: "destructive" })
      );
      expect(queueService.addSingerToQueue).not.toHaveBeenCalled();
    });
  });

  it("proceeds normally when session is open", async () => {
    vi.mocked(sessionService.getActiveSession).mockResolvedValueOnce({
      id: "2026-03-13", date: "2026-03-13", status: "open",
      openedAt: { toMillis: () => Date.now() } as any, openedBy: "uid-owner",
    });
    vi.mocked(queueService.findSingerInQueue).mockResolvedValueOnce({ empty: true } as any);
    vi.mocked(queueService.addSingerToQueue).mockResolvedValueOnce(undefined);

    await renderAddToQueue();
    fireEvent.change(document.getElementById("song")!, { target: { value: "Yesterday" } });
    fireEvent.click(screen.getByRole("button", { name: /Adicionar à Fila/i }));

    await waitFor(() => {
      expect(queueService.findSingerInQueue).toHaveBeenCalled();
      expect(queueService.addSingerToQueue).toHaveBeenCalled();
    });
  });

  it("calls getActiveSession with storeId from route params", async () => {
    vi.mocked(sessionService.getActiveSession).mockResolvedValueOnce(null);

    await renderAddToQueue();
    fireEvent.change(document.getElementById("song")!, { target: { value: "Yesterday" } });
    fireEvent.click(screen.getByRole("button", { name: /Adicionar à Fila/i }));

    await waitFor(() => {
      expect(sessionService.getActiveSession).toHaveBeenCalledWith(expect.anything(), "restaurant-1");
    });
  });

  it("toast shows the exact error message and description when no active session", async () => {
    vi.mocked(sessionService.getActiveSession).mockResolvedValueOnce(null);

    await renderAddToQueue();
    fireEvent.change(document.getElementById("song")!, { target: { value: "Yesterday" } });
    fireEvent.click(screen.getByRole("button", { name: /Adicionar à Fila/i }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "Fila fechada",
        description: "A sessão ainda não foi aberta. Aguarde o início do show.",
        variant: "destructive",
      });
    });
  });

  it("shows 'Fila fechada' toast when getActiveSession throws (e.g. permission-denied)", async () => {
    vi.mocked(sessionService.getActiveSession).mockRejectedValueOnce(
      new Error("permission-denied")
    );

    await renderAddToQueue();
    fireEvent.change(document.getElementById("song")!, { target: { value: "Yesterday" } });
    fireEvent.click(screen.getByRole("button", { name: /Adicionar à Fila/i }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "Fila fechada",
        description: "A sessão ainda não foi aberta. Aguarde o início do show.",
        variant: "destructive",
      });
      expect(queueService.addSingerToQueue).not.toHaveBeenCalled();
      expect(queueService.findSingerInQueue).not.toHaveBeenCalled();
    });
  });
});

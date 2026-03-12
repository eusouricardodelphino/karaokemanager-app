import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AddToQueue from "../pages/AddToQueue";
import * as queueService from "../services/queueService";
import * as useFirebaseModule from "../hooks/firebaseContext";
import * as useCurrentUserModule from "../hooks/useCurrentUser";

vi.mock("@/components/Navigation", () => ({ default: () => <nav data-testid="nav" /> }));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

vi.mock("@/services/queueService", () => ({
  addSingerToQueue: vi.fn(),
  findSingerInQueue: vi.fn(),
}));

vi.mock("@/hooks/firebaseContext", () => ({
  useFirebase: vi.fn(),
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/firebase", () => ({
  auth: { currentUser: { displayName: "Auth Fallback Name" } },
  db: {},
}));

const renderAddToQueue = () =>
  render(
    <MemoryRouter initialEntries={["/restaurant-1/add"]}>
      <Routes>
        <Route path="/:restaurantId/add" element={<AddToQueue />} />
        <Route path="/:restaurantId" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );

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
  });

  it("renders the form fields correctly", () => {
    renderAddToQueue();
    expect(document.getElementById("name")).toBeInTheDocument();
    expect(document.getElementById("song")).toBeInTheDocument();
    expect(document.getElementById("band")).toBeInTheDocument();
    expect(document.getElementById("link")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Adicionar à Fila/i })).toBeInTheDocument();
  });

  it("name field is pre-filled with Google user name and is read-only for singer", () => {
    renderAddToQueue();
    const nameInput = document.getElementById("name") as HTMLInputElement;
    expect(nameInput.value).toBe("Carlos Souza");
    expect(nameInput).toHaveAttribute("readonly");
  });

  it("name field is editable for owner role", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValueOnce({
      user: { id: "uid-2", name: "Owner User", role: "owner" },
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });
    renderAddToQueue();
    const nameInput = document.getElementById("name") as HTMLInputElement;
    expect(nameInput).not.toHaveAttribute("readonly");
    fireEvent.change(nameInput, { target: { value: "Custom Singer Name" } });
    expect(nameInput.value).toBe("Custom Singer Name");
  });

  it("name field is editable for staff role", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValueOnce({
      user: { id: "uid-3", name: "Staff User", role: "staff" },
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });
    renderAddToQueue();
    const nameInput = document.getElementById("name") as HTMLInputElement;
    expect(nameInput).not.toHaveAttribute("readonly");
  });

  it("does NOT submit when song is empty", async () => {
    renderAddToQueue();
    fireEvent.click(screen.getByRole("button", { name: /Adicionar à Fila/i }));
    await waitFor(() => {
      expect(queueService.addSingerToQueue).not.toHaveBeenCalled();
    });
  });

  it("falls back to auth.currentUser.displayName when user has no name", () => {
    vi.mocked(useCurrentUserModule.useCurrentUser).mockReturnValueOnce({
      user: { id: "uid-1", name: undefined, role: "singer" },
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });
    renderAddToQueue();
    const nameInput = document.getElementById("name") as HTMLInputElement;
    expect(nameInput.value).toBe("Auth Fallback Name");
  });

  it("prevents adding to queue when singer is already in queue", async () => {
    vi.mocked(queueService.findSingerInQueue).mockResolvedValueOnce({ empty: false } as any);

    renderAddToQueue();

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

    renderAddToQueue();

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

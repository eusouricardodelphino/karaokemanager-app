import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AddToQueue from "../pages/AddToQueue";
import * as queueService from "../services/queueService";
import * as useFirebaseModule from "../hooks/firebaseContext";

vi.mock("@/components/Navigation", () => ({ default: () => <nav data-testid="nav" /> }));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

vi.mock("@/services/queueService", () => ({
  addSingerToQueue: vi.fn(),
  findSingerInQueue: vi.fn(),
}));

vi.mock("@/hooks/firebaseContext", () => ({
  useFirebase: vi.fn(),
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
  });

  it("renders the form fields correctly", () => {
    renderAddToQueue();
    expect(document.getElementById("name")).toBeInTheDocument();
    expect(document.getElementById("surname")).toBeInTheDocument();
    expect(document.getElementById("song")).toBeInTheDocument();
    expect(document.getElementById("band")).toBeInTheDocument();
    expect(document.getElementById("link")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Adicionar à Fila/i })).toBeInTheDocument();
  });

  it("does NOT submit when required fields are empty", async () => {
    renderAddToQueue();
    fireEvent.click(screen.getByRole("button", { name: /Adicionar à Fila/i }));
    await waitFor(() => {
      expect(queueService.addSingerToQueue).not.toHaveBeenCalled();
    });
  });

  it("prevents adding to queue when singer is already in queue", async () => {
    vi.mocked(queueService.findSingerInQueue).mockResolvedValueOnce({ empty: false } as any);

    renderAddToQueue();

    fireEvent.change(document.getElementById("name")!, { target: { value: "João" } });
    fireEvent.change(document.getElementById("surname")!, { target: { value: "Silva" } });
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

    fireEvent.change(document.getElementById("name")!, { target: { value: "Carlos" } });
    fireEvent.change(document.getElementById("surname")!, { target: { value: "Souza" } });
    fireEvent.change(document.getElementById("song")!, { target: { value: "Bohemian Rhapsody" } });

    fireEvent.click(screen.getByRole("button", { name: /Adicionar à Fila/i }));

    await waitFor(() => {
      expect(queueService.addSingerToQueue).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: "Carlos Souza",
          song: "Bohemian Rhapsody",
          alreadySang: false,
        })
      );
    });

    // After success, the page navigates away — verify the route changed to Home
    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
  });
});

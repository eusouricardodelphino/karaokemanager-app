import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import StoreList from "../pages/StoreList";
import * as storeService from "../services/storeService";
import * as useFirebaseModule from "../hooks/firebaseContext";

vi.mock("@/hooks/firebaseContext", () => ({
  useFirebase: vi.fn(),
}));

vi.mock("@/services/storeService", () => ({
  getStores: vi.fn(),
}));

const renderStoreList = () =>
  render(
    <MemoryRouter initialEntries={["/stores"]}>
      <Routes>
        <Route path="/stores" element={<StoreList />} />
        <Route path="/:storeId" element={<div>Store Page</div>} />
      </Routes>
    </MemoryRouter>
  );

const mockStores = [
  { id: "store-a", name: "Aurora Karaoke", active: true },
  { id: "store-b", name: "Blue Stage", active: true },
  { id: "store-c", name: "Cantina do Rock", active: true },
];

describe("StoreList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFirebaseModule.useFirebase).mockReturnValue({ db: {} as any });
  });

  it("shows loading state initially", () => {
    vi.mocked(storeService.getStores).mockReturnValue(new Promise(() => {}));
    renderStoreList();
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("renders stores after loading", async () => {
    vi.mocked(storeService.getStores).mockResolvedValue(mockStores as any);
    renderStoreList();
    expect(await screen.findByTestId("store-list")).toBeInTheDocument();
    expect(screen.getByText("Aurora Karaoke")).toBeInTheDocument();
    expect(screen.getByText("Blue Stage")).toBeInTheDocument();
    expect(screen.getByText("Cantina do Rock")).toBeInTheDocument();
  });

  it("renders stores in the order returned by the service (alphabetical)", async () => {
    vi.mocked(storeService.getStores).mockResolvedValue(mockStores as any);
    renderStoreList();
    await screen.findByTestId("store-list");
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Aurora Karaoke");
    expect(items[1]).toHaveTextContent("Blue Stage");
    expect(items[2]).toHaveTextContent("Cantina do Rock");
  });

  it("each store links to /${store.id}", async () => {
    vi.mocked(storeService.getStores).mockResolvedValue(mockStores as any);
    renderStoreList();
    await screen.findByTestId("store-list");
    expect(screen.getByText("Aurora Karaoke").closest("a")).toHaveAttribute("href", "/store-a");
    expect(screen.getByText("Blue Stage").closest("a")).toHaveAttribute("href", "/store-b");
  });

  it("shows empty state when no active stores exist", async () => {
    vi.mocked(storeService.getStores).mockResolvedValue([]);
    renderStoreList();
    expect(await screen.findByTestId("empty")).toBeInTheDocument();
  });

  it("shows empty state when getStores throws", async () => {
    vi.mocked(storeService.getStores).mockRejectedValue(new Error("permission-denied"));
    renderStoreList();
    expect(await screen.findByTestId("empty")).toBeInTheDocument();
  });

  it("calls getStores once on mount", async () => {
    vi.mocked(storeService.getStores).mockResolvedValue(mockStores as any);
    renderStoreList();
    await screen.findByTestId("store-list");
    expect(storeService.getStores).toHaveBeenCalledTimes(1);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Firestore } from "firebase/firestore";
import * as firestoreFunctions from "firebase/firestore";
import {
  subscribeToQueue,
  subscribeToOnStageSinger,
  isStageEngaged,
  markSingerAsAlreadySang,
  removeSingerFromStage,
  putSingerOnStage,
  findSingerInQueue,
  addSingerToQueue,
  QueueItem,
} from "../services/queueService";

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    collection: vi.fn(() => "mock-collection"),
    query: vi.fn(() => "mock-query"),
    where: vi.fn(),
    orderBy: vi.fn(),
    onSnapshot: vi.fn(),
    getDocs: vi.fn(),
    doc: vi.fn(() => "mock-doc-ref"),
    updateDoc: vi.fn(),
    addDoc: vi.fn(),
  };
});

const mockDb = {} as Firestore;

const makeSinger = (overrides: Partial<QueueItem> = {}): QueueItem => ({
  id: "singer-1",
  name: "Test Singer",
  nameSearch: "test singer",
  song: "Test Song",
  alreadySang: false,
  visitDate: "2024-01-01",
  addedAt: new Date(),
  restaurantId: "restaurant-1",
  ...overrides,
});

describe("queueService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribeToQueue ─────────────────────────────────────────────────────

  it("subscribeToQueue: returns undefined when restaurantId is undefined", () => {
    const result = subscribeToQueue(mockDb, undefined, vi.fn());
    expect(result).toBeUndefined();
    expect(firestoreFunctions.onSnapshot).not.toHaveBeenCalled();
  });

  it("subscribeToQueue: calls onSnapshot and returns unsubscribe fn when restaurantId is provided", () => {
    const mockUnsub = vi.fn();
    vi.mocked(firestoreFunctions.onSnapshot).mockReturnValueOnce(mockUnsub as any);

    const listener = vi.fn();
    const result = subscribeToQueue(mockDb, "restaurant-1", listener);
    expect(firestoreFunctions.onSnapshot).toHaveBeenCalled();
    expect(result).toBe(mockUnsub);
  });

  it("subscribeToQueue: listener is called with mapped items from snapshot", () => {
    const fakeDoc = { id: "q1", data: () => ({ name: "Singer A", song: "Song A", nameSearch: "singer a", alreadySang: false, visitDate: "2024-01-01", addedAt: new Date(), restaurantId: "r1" }) };

    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_q, cb: any) => {
      cb({ docs: [fakeDoc] });
      return vi.fn();
    });

    const listener = vi.fn();
    subscribeToQueue(mockDb, "r1", listener);
    expect(listener).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: "q1", name: "Singer A" })]));
  });

  // ─── subscribeToOnStageSinger ───────────────────────────────────────────

  it("subscribeToOnStageSinger: returns undefined when restaurantId is undefined", () => {
    const result = subscribeToOnStageSinger(mockDb, undefined, vi.fn());
    expect(result).toBeUndefined();
  });

  it("subscribeToOnStageSinger: calls listener with null when snapshot is empty", () => {
    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_q, cb: any) => {
      cb({ docs: [] });
      return vi.fn();
    });

    const listener = vi.fn();
    subscribeToOnStageSinger(mockDb, "r1", listener);
    expect(listener).toHaveBeenCalledWith(null);
  });

  it("subscribeToOnStageSinger: calls listener with first singer when snapshot has docs", () => {
    const fakeDoc = { id: "s1", data: () => ({ name: "On Stage Singer", song: "Hit Song", nameSearch: "on stage singer", alreadySang: false, visitDate: "2024-01-01", addedAt: new Date(), restaurantId: "r1", onStage: true }) };

    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_q, cb: any) => {
      cb({ docs: [fakeDoc] });
      return vi.fn();
    });

    const listener = vi.fn();
    subscribeToOnStageSinger(mockDb, "r1", listener);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ id: "s1", name: "On Stage Singer" }));
  });

  // ─── isStageEngaged ───────────────────────────────────────────────────

  it("isStageEngaged: returns false when restaurantId is undefined", async () => {
    const result = await isStageEngaged(mockDb, undefined);
    expect(result).toBe(false);
    expect(firestoreFunctions.getDocs).not.toHaveBeenCalled();
  });

  it("isStageEngaged: returns true when snapshot is not empty", async () => {
    vi.mocked(firestoreFunctions.getDocs).mockResolvedValueOnce({ empty: false } as any);
    const result = await isStageEngaged(mockDb, "r1");
    expect(result).toBe(true);
  });

  it("isStageEngaged: returns false when snapshot is empty", async () => {
    vi.mocked(firestoreFunctions.getDocs).mockResolvedValueOnce({ empty: true } as any);
    const result = await isStageEngaged(mockDb, "r1");
    expect(result).toBe(false);
  });

  // ─── markSingerAsAlreadySang ─────────────────────────────────────────

  it("markSingerAsAlreadySang: does nothing when singer has no id", async () => {
    const singer = makeSinger({ id: undefined });
    await markSingerAsAlreadySang(mockDb, singer);
    expect(firestoreFunctions.updateDoc).not.toHaveBeenCalled();
  });

  it("markSingerAsAlreadySang: calls updateDoc with alreadySang true", async () => {
    vi.mocked(firestoreFunctions.updateDoc).mockResolvedValueOnce(undefined);
    const singer = makeSinger();
    await markSingerAsAlreadySang(mockDb, singer);
    expect(firestoreFunctions.updateDoc).toHaveBeenCalledWith("mock-doc-ref", { alreadySang: true });
  });

  // ─── removeSingerFromStage ───────────────────────────────────────────

  it("removeSingerFromStage: does nothing when singer has no id", async () => {
    await removeSingerFromStage(mockDb, makeSinger({ id: undefined }));
    expect(firestoreFunctions.updateDoc).not.toHaveBeenCalled();
  });

  it("removeSingerFromStage: calls updateDoc with onStage false", async () => {
    vi.mocked(firestoreFunctions.updateDoc).mockResolvedValueOnce(undefined);
    await removeSingerFromStage(mockDb, makeSinger());
    expect(firestoreFunctions.updateDoc).toHaveBeenCalledWith("mock-doc-ref", { onStage: false });
  });

  // ─── putSingerOnStage ────────────────────────────────────────────────

  it("putSingerOnStage: calls addDoc with onStage true and without id", async () => {
    vi.mocked(firestoreFunctions.addDoc).mockResolvedValueOnce(undefined as any);
    const singer = makeSinger();
    await putSingerOnStage(mockDb, singer);
    expect(firestoreFunctions.addDoc).toHaveBeenCalledWith(
      "mock-collection",
      expect.not.objectContaining({ id: "singer-1" })
    );
    expect(firestoreFunctions.addDoc).toHaveBeenCalledWith(
      "mock-collection",
      expect.objectContaining({ onStage: true })
    );
  });

  // ─── findSingerInQueue ──────────────────────────────────────────────

  it("findSingerInQueue: calls getDocs with fallback query when restaurantId is undefined", async () => {
    const mockSnapshot = { docs: [] };
    vi.mocked(firestoreFunctions.getDocs).mockResolvedValueOnce(mockSnapshot as any);

    await findSingerInQueue(mockDb, undefined, "test");
    expect(firestoreFunctions.getDocs).toHaveBeenCalled();
  });

  it("findSingerInQueue: calls getDocs with proper query when restaurantId exists", async () => {
    const mockSnapshot = { docs: [] };
    vi.mocked(firestoreFunctions.getDocs).mockResolvedValueOnce(mockSnapshot as any);

    const result = await findSingerInQueue(mockDb, "r1", "  Test Singer  ");
    expect(firestoreFunctions.getDocs).toHaveBeenCalled();
    expect(result).toBe(mockSnapshot);
  });

  // ─── addSingerToQueue ───────────────────────────────────────────────

  it("addSingerToQueue: calls addDoc with the queue item", async () => {
    vi.mocked(firestoreFunctions.addDoc).mockResolvedValueOnce(undefined as any);
    const singer = makeSinger();
    await addSingerToQueue(mockDb, singer);
    expect(firestoreFunctions.addDoc).toHaveBeenCalledWith("mock-collection", singer);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Firestore } from "firebase/firestore";
import * as firestoreFunctions from "firebase/firestore";
import {
  subscribeToQueue,
  subscribeToOnStageSinger,
  isStageEngaged,
  markSingerAsAlreadySangById,
  removeSingerFromStage,
  putSingerOnStage,
  findSingerInQueue,
  addSingerToQueue,
} from "../services/queueService";
import type { QueueItem } from "../types/queue";

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    collection: vi.fn(() => "mock-collection"),
    query: vi.fn(() => "mock-query"),
    where: vi.fn(),
    orderBy: vi.fn(),
    onSnapshot: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    doc: vi.fn(() => "mock-doc-ref"),
    updateDoc: vi.fn(),
    addDoc: vi.fn(),
    setDoc: vi.fn(),
    serverTimestamp: vi.fn(() => "mock-server-timestamp"),
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
  addedAt: new Date("2024-01-01T00:00:00Z"),
  ...overrides,
});

describe("queueService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribeToQueue ─────────────────────────────────────────────────────

  it("subscribeToQueue: returns undefined when storeId is undefined", () => {
    const result = subscribeToQueue(mockDb, undefined, vi.fn());
    expect(result).toBeUndefined();
    expect(firestoreFunctions.onSnapshot).not.toHaveBeenCalled();
  });

  it("subscribeToQueue: calls onSnapshot and returns unsubscribe fn when storeId is provided", () => {
    const mockUnsub = vi.fn();
    vi.mocked(firestoreFunctions.onSnapshot).mockReturnValueOnce(mockUnsub as any);

    const listener = vi.fn();
    const result = subscribeToQueue(mockDb, "store-1", listener);
    expect(firestoreFunctions.onSnapshot).toHaveBeenCalled();
    expect(result).toBe(mockUnsub);
  });

  it("subscribeToQueue: listener is called with mapped items from snapshot", () => {
    const fakeDoc = {
      id: "q1",
      data: () => ({
        name: "Singer A",
        song: "Song A",
        nameSearch: "singer a",
        alreadySang: false,
        visitDate: "2024-01-01",
        addedAt: new Date(),
      }),
    };

    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_q, cb: any) => {
      cb({ docs: [fakeDoc] });
      return vi.fn();
    });

    const listener = vi.fn();
    subscribeToQueue(mockDb, "store-1", listener);
    expect(listener).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "q1", name: "Singer A" }),
      ])
    );
  });

  // ─── subscribeToOnStageSinger ───────────────────────────────────────────

  it("subscribeToOnStageSinger: returns undefined when storeId is undefined", () => {
    const result = subscribeToOnStageSinger(mockDb, undefined, vi.fn());
    expect(result).toBeUndefined();
  });

  it("subscribeToOnStageSinger: calls listener with null when snapshot does not exist", () => {
    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_ref, cb: any) => {
      cb({ exists: () => false });
      return vi.fn();
    });

    const listener = vi.fn();
    subscribeToOnStageSinger(mockDb, "store-1", listener);
    expect(listener).toHaveBeenCalledWith(null);
  });

  it("subscribeToOnStageSinger: calls listener with null when stage status is empty", () => {
    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_ref, cb: any) => {
      cb({ exists: () => true, id: "current", data: () => ({ status: "empty", name: null }) });
      return vi.fn();
    });

    const listener = vi.fn();
    subscribeToOnStageSinger(mockDb, "store-1", listener);
    expect(listener).toHaveBeenCalledWith(null);
  });

  it("subscribeToOnStageSinger: calls listener with singer data when stage is active", () => {
    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_ref, cb: any) => {
      cb({
        exists: () => true,
        id: "current",
        data: () => ({
          name: "Stage Singer",
          song: "Hit Song",
          band: "Band X",
          link: "https://youtube.com/xyz",
          visitDate: "2024-01-01",
          addedAt: { toDate: () => new Date() },
          status: "singing",
        }),
      });
      return vi.fn();
    });

    const listener = vi.fn();
    subscribeToOnStageSinger(mockDb, "store-1", listener);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Stage Singer", song: "Hit Song" })
    );
  });

  // ─── isStageEngaged ───────────────────────────────────────────────────

  it("isStageEngaged: returns false when storeId is undefined", async () => {
    const result = await isStageEngaged(mockDb, undefined);
    expect(result).toBe(false);
    expect(firestoreFunctions.getDoc).not.toHaveBeenCalled();
  });

  it("isStageEngaged: returns true when stage status is singing", async () => {
    vi.mocked(firestoreFunctions.getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ status: "singing" }),
    } as any);
    const result = await isStageEngaged(mockDb, "store-1");
    expect(result).toBe(true);
  });

  it("isStageEngaged: returns false when stage status is empty", async () => {
    vi.mocked(firestoreFunctions.getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ status: "empty" }),
    } as any);
    const result = await isStageEngaged(mockDb, "store-1");
    expect(result).toBe(false);
  });

  it("isStageEngaged: returns false when snapshot does not exist", async () => {
    vi.mocked(firestoreFunctions.getDoc).mockResolvedValueOnce({
      exists: () => false,
    } as any);
    const result = await isStageEngaged(mockDb, "store-1");
    expect(result).toBe(false);
  });

  // ─── markSingerAsAlreadySangById ─────────────────────────────────────────

  it("markSingerAsAlreadySangById: calls updateDoc with alreadySang true", async () => {
    vi.mocked(firestoreFunctions.updateDoc).mockResolvedValueOnce(undefined);
    await markSingerAsAlreadySangById(mockDb, "store-1", "queue-item-id");
    expect(firestoreFunctions.updateDoc).toHaveBeenCalledWith(
      "mock-doc-ref",
      { alreadySang: true }
    );
  });

  // ─── removeSingerFromStage ───────────────────────────────────────────────

  it("removeSingerFromStage: calls setDoc with empty stage data", async () => {
    vi.mocked(firestoreFunctions.setDoc).mockResolvedValueOnce(undefined);
    await removeSingerFromStage(mockDb, "store-1");
    expect(firestoreFunctions.setDoc).toHaveBeenCalledWith(
      "mock-doc-ref",
      expect.objectContaining({ status: "empty", name: null })
    );
  });

  // ─── putSingerOnStage ────────────────────────────────────────────────────

  it("putSingerOnStage: calls setDoc with singer data and status singing", async () => {
    vi.mocked(firestoreFunctions.setDoc).mockResolvedValueOnce(undefined);
    const singer = makeSinger();
    await putSingerOnStage(mockDb, "store-1", singer);
    expect(firestoreFunctions.setDoc).toHaveBeenCalledWith(
      "mock-doc-ref",
      expect.objectContaining({ name: "Test Singer", song: "Test Song", status: "singing" })
    );
  });

  it("putSingerOnStage: uses null for band and link when not provided", async () => {
    vi.mocked(firestoreFunctions.setDoc).mockResolvedValueOnce(undefined);
    const singer = makeSinger({ band: undefined, link: undefined });
    await putSingerOnStage(mockDb, "store-1", singer);
    expect(firestoreFunctions.setDoc).toHaveBeenCalledWith(
      "mock-doc-ref",
      expect.objectContaining({ band: null, link: null })
    );
  });

  // ─── findSingerInQueue ──────────────────────────────────────────────

  it("findSingerInQueue: returns null without calling getDocs when storeId is undefined", async () => {
    const result = await findSingerInQueue(mockDb, undefined, "uid-123");
    expect(result).toBeNull();
    expect(firestoreFunctions.getDocs).not.toHaveBeenCalled();
  });

  it("findSingerInQueue: calls getDocs with proper query when storeId exists", async () => {
    const mockSnapshot = { empty: false, docs: [] };
    vi.mocked(firestoreFunctions.getDocs).mockResolvedValueOnce(mockSnapshot as any);

    const result = await findSingerInQueue(mockDb, "store-1", "uid-123");
    expect(firestoreFunctions.getDocs).toHaveBeenCalled();
    expect(result).toBe(mockSnapshot);
  });

  it("findSingerInQueue: queries by userId field", async () => {
    const mockSnapshot = { empty: false, docs: [] };
    vi.mocked(firestoreFunctions.getDocs).mockResolvedValueOnce(mockSnapshot as any);

    await findSingerInQueue(mockDb, "store-1", "uid-abc");
    expect(firestoreFunctions.where).toHaveBeenCalledWith(
      "userId",
      "==",
      "uid-abc"
    );
  });

  // ─── addSingerToQueue ───────────────────────────────────────────────

  it("addSingerToQueue: calls addDoc with storeId and queue item", async () => {
    vi.mocked(firestoreFunctions.addDoc).mockResolvedValueOnce(undefined as any);
    const singer = makeSinger();
    await addSingerToQueue(mockDb, "store-1", singer);
    expect(firestoreFunctions.addDoc).toHaveBeenCalledWith("mock-collection", singer);
  });
});

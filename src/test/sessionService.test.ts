import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Firestore } from "firebase/firestore";
import * as firestoreFunctions from "firebase/firestore";
import {
  openSession,
  closeSession,
  getActiveSession,
  subscribeToActiveSession,
} from "../services/sessionService";

vi.mock("@/firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    doc: vi.fn(() => "mock-session-ref"),
    getDoc: vi.fn(),
    onSnapshot: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    serverTimestamp: vi.fn(() => "mock-server-timestamp"),
  };
});

const mockDb = {} as Firestore;
const STORE_ID = "store-1";
const TODAY = new Date().toISOString().slice(0, 10);

const makeOpenSnap = (overrides: Record<string, unknown> = {}) => ({
  id: TODAY,
  exists: () => true,
  data: () => ({
    date: TODAY,
    status: "open",
    openedAt: { toMillis: () => Date.now() },
    openedBy: "uid-owner",
    closedAt: null,
    closedBy: null,
    ...overrides,
  }),
});

describe("openSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls setDoc (not updateDoc) with status 'open' and correct fields", async () => {
    vi.mocked(firestoreFunctions.setDoc).mockResolvedValue(undefined);

    await openSession(mockDb, STORE_ID, "uid-owner");

    expect(firestoreFunctions.setDoc).toHaveBeenCalledOnce();
    expect(firestoreFunctions.updateDoc).not.toHaveBeenCalled();

    const [, payload] = vi.mocked(firestoreFunctions.setDoc).mock.calls[0];
    expect(payload).toMatchObject({
      date: TODAY,
      status: "open",
      openedBy: "uid-owner",
      openedAt: "mock-server-timestamp",
    });
  });

  it("uses today's date as document ID", async () => {
    vi.mocked(firestoreFunctions.setDoc).mockResolvedValue(undefined);
    await openSession(mockDb, STORE_ID, "uid-owner");

    expect(firestoreFunctions.doc).toHaveBeenCalledWith(
      mockDb,
      expect.stringContaining(TODAY)
    );
  });
});

describe("closeSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls updateDoc (not setDoc) with status 'closed' and closedBy", async () => {
    vi.mocked(firestoreFunctions.updateDoc).mockResolvedValue(undefined);

    await closeSession(mockDb, STORE_ID, TODAY, "uid-owner");

    expect(firestoreFunctions.updateDoc).toHaveBeenCalledOnce();
    expect(firestoreFunctions.setDoc).not.toHaveBeenCalled();

    const [, payload] = vi.mocked(firestoreFunctions.updateDoc).mock.calls[0];
    expect(payload).toMatchObject({
      status: "closed",
      closedBy: "uid-owner",
      closedAt: "mock-server-timestamp",
    });
  });

  it("uses the provided dateId in the doc path", async () => {
    vi.mocked(firestoreFunctions.updateDoc).mockResolvedValue(undefined);
    await closeSession(mockDb, STORE_ID, "2025-06-15", "uid-owner");

    expect(firestoreFunctions.doc).toHaveBeenCalledWith(
      mockDb,
      expect.stringContaining("2025-06-15")
    );
  });
});

describe("getActiveSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null without calling getDoc when storeId is undefined", async () => {
    const result = await getActiveSession(mockDb, undefined);

    expect(result).toBeNull();
    expect(firestoreFunctions.getDoc).not.toHaveBeenCalled();
  });

  it("returns null when snapshot does not exist", async () => {
    vi.mocked(firestoreFunctions.getDoc).mockResolvedValue({
      exists: () => false,
      data: () => ({}),
    } as any);

    const result = await getActiveSession(mockDb, STORE_ID);
    expect(result).toBeNull();
  });

  it("returns null when session status is 'closed'", async () => {
    vi.mocked(firestoreFunctions.getDoc).mockResolvedValue(
      makeOpenSnap({ status: "closed" }) as any
    );

    const result = await getActiveSession(mockDb, STORE_ID);
    expect(result).toBeNull();
  });

  it("returns SessionSnapshot when session is open", async () => {
    vi.mocked(firestoreFunctions.getDoc).mockResolvedValue(makeOpenSnap() as any);

    const result = await getActiveSession(mockDb, STORE_ID);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(TODAY);
    expect(result?.status).toBe("open");
    expect(result?.openedBy).toBe("uid-owner");
  });
});

describe("subscribeToActiveSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns void and does not call onSnapshot when storeId is undefined", () => {
    const listener = vi.fn();
    const result = subscribeToActiveSession(mockDb, undefined, listener);

    expect(result).toBeUndefined();
    expect(firestoreFunctions.onSnapshot).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
  });

  it("calls listener with null when snapshot does not exist", () => {
    const listener = vi.fn();
    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_ref, cb: any) => {
      cb({ exists: () => false, data: () => ({}) });
      return vi.fn();
    });

    subscribeToActiveSession(mockDb, STORE_ID, listener);
    expect(listener).toHaveBeenCalledWith(null);
  });

  it("calls listener with null when session is closed", () => {
    const listener = vi.fn();
    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_ref, cb: any) => {
      cb(makeOpenSnap({ status: "closed" }));
      return vi.fn();
    });

    subscribeToActiveSession(mockDb, STORE_ID, listener);
    expect(listener).toHaveBeenCalledWith(null);
  });

  it("calls listener with SessionSnapshot when session is open", () => {
    const listener = vi.fn();
    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_ref, cb: any) => {
      cb(makeOpenSnap());
      return vi.fn();
    });

    subscribeToActiveSession(mockDb, STORE_ID, listener);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ id: TODAY, status: "open", openedBy: "uid-owner" })
    );
  });

  it("returns the unsubscribe function from onSnapshot", () => {
    const unsubscribe = vi.fn();
    vi.mocked(firestoreFunctions.onSnapshot).mockImplementation((_ref, cb: any) => {
      cb({ exists: () => false, data: () => ({}) });
      return unsubscribe;
    });

    const result = subscribeToActiveSession(mockDb, STORE_ID, vi.fn());
    expect(result).toBe(unsubscribe);
  });
});

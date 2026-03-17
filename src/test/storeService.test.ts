import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Firestore } from "firebase/firestore";
import * as firestoreFunctions from "firebase/firestore";
import {
  getStore,
  updateStore,
  getStoreByCode,
  getStoreCodes,
  getStores,
} from "../services/storeService";

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    doc: vi.fn(() => "mock-doc-ref"),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    updateDoc: vi.fn(),
    collection: vi.fn(() => "mock-collection-ref"),
    query: vi.fn(() => "mock-query-ref"),
    where: vi.fn(() => "mock-where-constraint"),
    limit: vi.fn(() => "mock-limit-constraint"),
    orderBy: vi.fn(() => "mock-orderby-constraint"),
    deleteField: vi.fn(() => "mock-delete-field-sentinel"),
  };
});

const mockDb = {} as Firestore;

// ---------------------------------------------------------------------------
// getStore
// ---------------------------------------------------------------------------

describe("storeService - getStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when the document does not exist", async () => {
    vi.mocked(firestoreFunctions.getDoc).mockResolvedValueOnce({
      exists: () => false,
    } as any);

    const result = await getStore(mockDb, "store-999");

    expect(firestoreFunctions.doc).toHaveBeenCalledWith(mockDb, "stores", "store-999");
    expect(firestoreFunctions.getDoc).toHaveBeenCalledWith("mock-doc-ref");
    expect(result).toBeNull();
  });

  it("returns the store with id merged from snapshot when the document exists", async () => {
    vi.mocked(firestoreFunctions.getDoc).mockResolvedValueOnce({
      exists: () => true,
      id: "store-123",
      data: () => ({
        name: "Karaoke Bar",
        code: "42",
        ownerId: "uid-1",
        active: true,
        createdAt: "2024-01-01",
      }),
    } as any);

    const result = await getStore(mockDb, "store-123");

    expect(result).toEqual({
      id: "store-123",
      name: "Karaoke Bar",
      code: "42",
      ownerId: "uid-1",
      active: true,
      createdAt: "2024-01-01",
    });
  });
});

// ---------------------------------------------------------------------------
// updateStore
// ---------------------------------------------------------------------------

describe("storeService - updateStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls updateDoc with defined values passed through unchanged", async () => {
    vi.mocked(firestoreFunctions.updateDoc).mockResolvedValueOnce(undefined);

    await updateStore(mockDb, "store-123", {
      name: "New Name",
      address: "Rua A, 1",
      phones: [],
      cnpj: "00.000.000/0001-00",
    });

    expect(firestoreFunctions.doc).toHaveBeenCalledWith(mockDb, "stores", "store-123");
    expect(firestoreFunctions.updateDoc).toHaveBeenCalledWith("mock-doc-ref", {
      name: "New Name",
      address: "Rua A, 1",
      phones: [],
      cnpj: "00.000.000/0001-00",
    });
  });

  it("replaces undefined values with deleteField() sentinel in the payload", async () => {
    vi.mocked(firestoreFunctions.updateDoc).mockResolvedValueOnce(undefined);

    await updateStore(mockDb, "store-123", {
      name: "New Name",
      address: undefined as any,
      phones: undefined as any,
      cnpj: undefined as any,
    });

    expect(firestoreFunctions.deleteField).toHaveBeenCalled();
    const callArg = vi.mocked(firestoreFunctions.updateDoc).mock.calls[0][1] as Record<
      string,
      unknown
    >;
    expect(callArg.name).toBe("New Name");
    expect(callArg.address).toBe("mock-delete-field-sentinel");
    expect(callArg.phones).toBe("mock-delete-field-sentinel");
    expect(callArg.cnpj).toBe("mock-delete-field-sentinel");
  });
});

// ---------------------------------------------------------------------------
// getStoreByCode
// ---------------------------------------------------------------------------

describe("storeService - getStoreByCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no store matches the code", async () => {
    vi.mocked(firestoreFunctions.getDocs).mockResolvedValueOnce({
      empty: true,
      docs: [],
    } as any);

    const result = await getStoreByCode(mockDb, "000");

    expect(firestoreFunctions.collection).toHaveBeenCalledWith(mockDb, "stores");
    expect(firestoreFunctions.where).toHaveBeenCalledWith("code", "==", "000");
    expect(firestoreFunctions.where).toHaveBeenCalledWith("active", "==", true);
    expect(firestoreFunctions.limit).toHaveBeenCalledWith(1);
    expect(firestoreFunctions.query).toHaveBeenCalledWith(
      "mock-collection-ref",
      "mock-where-constraint",
      "mock-where-constraint",
      "mock-limit-constraint"
    );
    expect(result).toBeNull();
  });

  it("returns the matched store when a document is found", async () => {
    vi.mocked(firestoreFunctions.getDocs).mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "store-abc",
          data: () => ({
            name: "Bar do Zé",
            code: "421",
            ownerId: "uid-2",
            active: true,
            createdAt: "2024-06-01",
          }),
        },
      ],
    } as any);

    const result = await getStoreByCode(mockDb, "421");

    expect(result).toEqual({
      id: "store-abc",
      name: "Bar do Zé",
      code: "421",
      ownerId: "uid-2",
      active: true,
      createdAt: "2024-06-01",
    });
  });
});

// ---------------------------------------------------------------------------
// getStoreCodes
// ---------------------------------------------------------------------------

describe("storeService - getStoreCodes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array when the collection is empty", async () => {
    vi.mocked(firestoreFunctions.getDocs).mockResolvedValueOnce({
      docs: [],
    } as any);

    const result = await getStoreCodes(mockDb);

    expect(firestoreFunctions.collection).toHaveBeenCalledWith(mockDb, "stores");
    expect(result).toEqual([]);
  });

  it("returns only string codes, filtering out undefined and empty-string entries", async () => {
    vi.mocked(firestoreFunctions.getDocs).mockResolvedValueOnce({
      docs: [
        { data: () => ({ code: "111" }) },
        { data: () => ({ code: "222" }) },
        { data: () => ({}) },             // no code field → undefined
        { data: () => ({ code: "" }) },   // empty string → filtered out
        { data: () => ({ code: 999 }) },  // number → filtered out (not typeof string)
      ],
    } as any);

    const result = await getStoreCodes(mockDb);

    expect(result).toEqual(["111", "222"]);
  });
});

// ---------------------------------------------------------------------------
// getStores
// ---------------------------------------------------------------------------

describe("storeService - getStores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array when the collection has no documents", async () => {
    vi.mocked(firestoreFunctions.getDocs).mockResolvedValueOnce({
      docs: [],
    } as any);

    const result = await getStores(mockDb);

    expect(firestoreFunctions.collection).toHaveBeenCalledWith(mockDb, "stores");
    expect(firestoreFunctions.orderBy).toHaveBeenCalledWith("name", "asc");
    expect(firestoreFunctions.query).toHaveBeenCalledWith(
      "mock-collection-ref",
      "mock-orderby-constraint"
    );
    expect(result).toEqual([]);
  });

  it("returns only stores where active is true, mapped with their id", async () => {
    vi.mocked(firestoreFunctions.getDocs).mockResolvedValueOnce({
      docs: [
        {
          id: "store-1",
          data: () => ({
            name: "Alpha Bar",
            code: "100",
            ownerId: "uid-10",
            active: true,
            createdAt: "2024-01-01",
          }),
        },
        {
          id: "store-2",
          data: () => ({
            name: "Beta Bar",
            code: "200",
            ownerId: "uid-20",
            active: false,
            createdAt: "2024-02-01",
          }),
        },
        {
          id: "store-3",
          data: () => ({
            name: "Gamma Bar",
            code: "300",
            ownerId: "uid-30",
            active: true,
            createdAt: "2024-03-01",
          }),
        },
      ],
    } as any);

    const result = await getStores(mockDb);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(
      expect.objectContaining({ id: "store-1", name: "Alpha Bar", active: true })
    );
    expect(result[1]).toEqual(
      expect.objectContaining({ id: "store-3", name: "Gamma Bar", active: true })
    );
    // inactive store must not be present
    expect(result.find((s) => s.id === "store-2")).toBeUndefined();
  });
});

import { collection, deleteField, doc, getDoc, getDocs, orderBy, query, updateDoc, Firestore } from "firebase/firestore";
import type { Store } from "@/types/store";

export const getStore = async (db: Firestore, storeId: string): Promise<Store | null> => {
  const snap = await getDoc(doc(db, "stores", storeId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Store;
};

type StoreUpdate = Pick<Store, "name" | "address" | "phones" | "cnpj">;

export const updateStore = async (db: Firestore, storeId: string, data: StoreUpdate): Promise<void> => {
  const payload: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    payload[key] = val === undefined ? deleteField() : val;
  }
  await updateDoc(doc(db, "stores", storeId), payload);
};

export const getStores = async (db: Firestore): Promise<Store[]> => {
  const q = query(collection(db, "stores"), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as Store))
    .filter((s) => s.active);
};

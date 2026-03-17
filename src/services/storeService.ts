import { collection, deleteField, doc, getDoc, getDocs, limit, orderBy, query, updateDoc, where, Firestore } from "firebase/firestore";
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

/** Busca uma loja ativa pelo código único de 3 a 6 dígitos. Retorna null se não encontrada. */
export const getStoreByCode = async (db: Firestore, code: string): Promise<Store | null> => {
  const q = query(
    collection(db, "stores"),
    where("code", "==", code),
    where("active", "==", true),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as Store;
};

/** Retorna todos os códigos de loja cadastrados (ativos ou não) para verificação de unicidade. */
export const getStoreCodes = async (db: Firestore): Promise<string[]> => {
  const snapshot = await getDocs(collection(db, "stores"));
  return snapshot.docs
    .map((d) => d.data().code as string | undefined)
    .filter((c): c is string => typeof c === "string" && c.length > 0);
};

export const getStores = async (db: Firestore): Promise<Store[]> => {
  const q = query(collection(db, "stores"), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as Store))
    .filter((s) => s.active);
};

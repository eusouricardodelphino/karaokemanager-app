import { collection, getDocs, orderBy, query, Firestore } from "firebase/firestore";
import type { Store } from "@/types/store";

export const getStores = async (db: Firestore): Promise<Store[]> => {
  const q = query(collection(db, "stores"), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as Store))
    .filter((s) => s.active);
};

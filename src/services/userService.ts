import {
  collection,
  onSnapshot,
  query,
  where,
  Firestore,
} from "firebase/firestore";
import type { AppUser } from "@/types/user";

type Unsubscribe = () => void;

/**
 * Inscreve em tempo real no documento do usuário na coleção "users"
 * (documento cujo campo id coincide com o uid do Auth).
 */
export const subscribeToUser = (
  db: Firestore,
  uid: string,
  listener: (user: AppUser | null) => void
): Unsubscribe => {
  const q = query(
    collection(db, "users"),
    where("id", "==", uid)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        listener(null);
        return;
      }
      const doc = snapshot.docs[0];
      listener({
        id: doc.id,
        ...doc.data(),
      } as AppUser);
    },
    () => listener(null)
  );

  return unsubscribe;
};

import {
  doc,
  onSnapshot,
  Firestore,
} from "firebase/firestore";
import type { AppUser } from "@/types/user";

type Unsubscribe = () => void;

/**
 * Inscreve em tempo real no documento do usuário na coleção "users".
 * Lê diretamente por ID de documento (users/{uid}) para satisfazer as
 * regras de segurança do Firestore que protegem por path variable {userId}.
 */
export const subscribeToUser = (
  db: Firestore,
  uid: string,
  listener: (user: AppUser | null) => void
): Unsubscribe => {
  const docRef = doc(db, "users", uid);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        listener(null);
        return;
      }
      listener({
        id: snapshot.id,
        ...snapshot.data(),
      } as AppUser);
    },
    () => listener(null)
  );
};

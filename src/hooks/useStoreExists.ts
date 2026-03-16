import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

/**
 * Verifica se um documento existe na coleção "stores".
 * Retorna null enquanto carrega, true se existir e false se não existir.
 * Em caso de erro de permissão (usuário não autenticado), assume true e
 * deixa a própria página lidar com a autenticação.
 */
export function useStoreExists(storeId: string | undefined): boolean | null {
  const [storeExists, setStoreExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (!storeId) {
      setStoreExists(false);
      return;
    }
    getDoc(doc(db, "stores", storeId))
      .then((snap) => setStoreExists(snap.exists()))
      .catch(() => setStoreExists(true));
  }, [storeId]);

  return storeExists;
}

import { useEffect, useState } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { TrialGuard } from "@/components/TrialGuard";
import { isOwner } from "@/types/user";
import NotFound from "@/pages/NotFound";

export function OwnerLayout() {
  const { user, isLoading } = useCurrentUser();
  const { storeId } = useParams();
  const [storeExists, setStoreExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (!storeId) {
      setStoreExists(false);
      return;
    }
    getDoc(doc(db, "stores", storeId))
      .then((snap) => {
        setStoreExists(snap.exists());
      })
      .catch(() => {
        // Se não tiver permissão para ler (ex: usuário não autenticado),
        // assume que a loja existe e deixa a própria página lidar com auth.
        setStoreExists(true);
      });
  }, [storeId]);

  if (isLoading || storeExists === null) return null;

  if (!storeExists) return <NotFound />;

  if (isOwner(user) && user?.storeId && storeId && storeId !== user.storeId) {
    return <Navigate to={`/${user.storeId}`} replace />;
  }

  if (isOwner(user)) {
    return (
      <TrialGuard storeId={user?.storeId}>
        <Outlet />
      </TrialGuard>
    );
  }

  return <Outlet />;
}

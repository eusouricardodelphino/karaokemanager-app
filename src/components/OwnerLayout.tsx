import { Navigate, Outlet, useParams } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useStoreExists } from "@/hooks/useStoreExists";
import { TrialGuard } from "@/components/TrialGuard";
import { isOwner } from "@/types/user";
import NotFound from "@/pages/NotFound";

export function OwnerLayout() {
  const { user, isLoading } = useCurrentUser();
  const { storeId } = useParams();
  const storeExists = useStoreExists(storeId);

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

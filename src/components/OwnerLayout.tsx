import { Navigate, Outlet, useParams } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { TrialGuard } from "@/components/TrialGuard";
import { isOwner } from "@/types/user";

export function OwnerLayout() {
  const { user, isLoading } = useCurrentUser();
  const { restaurantId } = useParams();

  if (isLoading) return null;

  if (isOwner(user) && user?.storeId && restaurantId && restaurantId !== user.storeId) {
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

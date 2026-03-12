import { Outlet } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { TrialGuard } from "@/components/TrialGuard";
import { isOwner } from "@/types/user";

export function OwnerLayout() {
  const { user } = useCurrentUser();

  if (isOwner(user)) {
    return (
      <TrialGuard storeId={user?.storeId}>
        <Outlet />
      </TrialGuard>
    );
  }

  return <Outlet />;
}

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useCurrentUser();
  const location = useLocation();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return <Outlet />;
}

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function SuspendedGuard({ children }: { children: React.ReactNode }) {
  const { appUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && appUser?.isSuspended && location.pathname !== "/suspended") {
      navigate("/suspended");
    }
  }, [appUser, loading, location.pathname, navigate]);

  return <>{children}</>;
}

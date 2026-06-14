import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBusiness } from "@/context/BusinessContext";
import { useAuth } from "@/lib/AuthContext";

export function useOnboardingGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoadingAuth } = useAuth();
  const { currentBusiness, loading: businessLoading } = useBusiness();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoadingAuth || businessLoading || !user) return;
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, [isLoadingAuth, businessLoading, user]);

  useEffect(() => {
    if (!ready) return;
    const onOnboarding = location.pathname === "/onboarding";
    if (!currentBusiness) {
      if (!onOnboarding) {
        navigate("/onboarding", { replace: true });
      }
    } else {
      if (onOnboarding) {
        navigate("/", { replace: true });
      }
    }
  }, [ready, currentBusiness, location.pathname]);
}

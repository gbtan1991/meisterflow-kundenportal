import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBusiness } from "@/context/BusinessContext";
import { useAuth } from "@/lib/AuthContext";

export function useOnboardingGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoadingAuth } = useAuth();
  const { currentBusiness, loading: businessLoading } = useBusiness();

  useEffect(() => {
    if (isLoadingAuth || businessLoading || !user) return;
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
  }, [currentBusiness, businessLoading, isLoadingAuth, user, location.pathname]);
}

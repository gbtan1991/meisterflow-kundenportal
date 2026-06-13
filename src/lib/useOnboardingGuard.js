import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

export function useOnboardingGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoadingAuth } = useAuth();

  const { data: firmen = [], isLoading: firmenLoading } = useQuery({
    queryKey: ["firma", user?.id],
    queryFn: () =>
      supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .limit(1)
        .then(({ data }) => data ?? []),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (isLoadingAuth || firmenLoading || !user) return;
    const firma = firmen[0];
    const onOnboarding = location.pathname === "/onboarding";

    if (!firma || !firma.onboarding_abgeschlossen) {
      if (!onOnboarding) {
        navigate("/onboarding", { replace: true });
      }
    } else {
      if (onOnboarding) {
        navigate("/", { replace: true });
      }
    }
  }, [firmen, firmenLoading, isLoadingAuth, user, location.pathname]);
}

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useOnboardingGuard() {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: firmen = [], isLoading: firmenLoading } = useQuery({
    queryKey: ["firma", user?.id],
    queryFn: () => base44.entities.Firma.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (userLoading || firmenLoading || !user) return;

    const firma = firmen[0];
    const onOnboarding = location.pathname === "/onboarding";

    // Kein Firma-Datensatz ODER Onboarding noch nicht abgeschlossen → weiterleiten
    if (!firma || !firma.onboarding_abgeschlossen) {
      if (!onOnboarding) {
        navigate("/onboarding", { replace: true });
      }
    } else {
      // Onboarding abgeschlossen aber noch auf /onboarding → zur Übersicht
      if (onOnboarding) {
        navigate("/", { replace: true });
      }
    }
  }, [firmen, firmenLoading, userLoading, user, location.pathname]);
}
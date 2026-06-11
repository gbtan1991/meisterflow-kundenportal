import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/lib/AuthContext";

import GoogleProfilKarte from "@/components/bewertungen/GoogleProfilKarte";
import BewertungssystemKarte from "@/components/bewertungen/BewertungssystemKarte";
import BewertungAnfordernDialog from "@/components/bewertungen/BewertungAnfordernDialog";
import BewertungsanfragenListe from "@/components/bewertungen/BewertungsanfragenListe";
import NeuesteBewertungen from "@/components/bewertungen/NeuesteBewertungen";
import BewertungsUebersicht from "@/components/bewertungen/BewertungsUebersicht";

export default function Bewertungen() {
  const [anfordernOpen, setAnfordernOpen] = useState(false);
  const { user } = useAuth();

  const { data: bewertungen = [] } = useQuery({
    queryKey: ["bewertungen"],
    queryFn: () => base44.entities.Bewertung.list("-created_date", 500),
  });

  const { data: firmen = [] } = useQuery({
    queryKey: ["firma"],
    queryFn: () => base44.entities.Firma.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });
  const firma = firmen[0] || null;

  const erhaltene = bewertungen.filter(b => b.sterne && (b.status === "erhalten" || b.status === "beantwortet"));
  const durchschnitt = erhaltene.length
    ? (erhaltene.reduce((s, b) => s + b.sterne, 0) / erhaltene.length).toFixed(1)
    : "–";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bewertungen"
        subtitle={`${erhaltene.length} Bewertungen · Durchschnitt ${durchschnitt} ★`}
      >
        <Button onClick={() => setAnfordernOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Bewertung anfordern
        </Button>
      </PageHeader>

      {/* Bereich 1 – Google Unternehmensprofil */}
      <GoogleProfilKarte firma={firma} bewertungen={bewertungen} />

      {/* Bereich 2 – Bewertungssystem */}
      <BewertungssystemKarte firma={firma} bewertungen={bewertungen} />

      {/* Bereich 6 – Übersicht */}
      <BewertungsUebersicht bewertungen={bewertungen} />

      {/* Bereich 4 – Anfragen */}
      <BewertungsanfragenListe anfragen={bewertungen} />

      {/* Bereich 5 – Neueste Bewertungen */}
      <NeuesteBewertungen bewertungen={bewertungen} firma={firma} />

      {/* Dialog Bereich 3 */}
      <BewertungAnfordernDialog open={anfordernOpen} onOpenChange={setAnfordernOpen} />
    </div>
  );
}
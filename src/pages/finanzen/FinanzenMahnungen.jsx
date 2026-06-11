import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCHF, formatDatum } from "@/lib/format";
import { AlertTriangle, Building2, CalendarDays } from "lucide-react";
import { differenceInDays } from "date-fns";

function getMahnstufe(faelligAm) {
  if (!faelligAm) return { stufe: 0, label: "–", color: "text-muted-foreground" };
  const tage = differenceInDays(new Date(), new Date(faelligAm));
  if (tage < 7) return { stufe: 0, label: "Keine Mahnung", color: "text-muted-foreground" };
  if (tage < 14) return { stufe: 1, label: "1. Mahnung", color: "text-amber-600" };
  if (tage < 30) return { stufe: 2, label: "2. Mahnung", color: "text-orange-600" };
  return { stufe: 3, label: "Letzte Mahnung", color: "text-red-600" };
}

export default function FinanzenMahnungen() {
  const { data: rechnungen = [] } = useQuery({
    queryKey: ["rechnungen"],
    queryFn: () => base44.entities.Rechnung.list("-created_date", 500),
  });

  const faellig = rechnungen
    .filter((r) => ["offen", "ueberfaellig"].includes(r.status))
    .map((r) => ({ ...r, mahnstufe: getMahnstufe(r.faellig_am) }))
    .filter((r) => r.mahnstufe.stufe > 0)
    .sort((a, b) => b.mahnstufe.stufe - a.mahnstufe.stufe);

  const gesamtBetrag = faellig.reduce((s, r) => s + (r.betrag || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "1. Mahnung", count: faellig.filter((r) => r.mahnstufe.stufe === 1).length, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "2. Mahnung", count: faellig.filter((r) => r.mahnstufe.stufe === 2).length, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Letzte Mahnung", count: faellig.filter((r) => r.mahnstufe.stufe === 3).length, color: "text-red-600", bg: "bg-red-50" },
        ].map((k) => (
          <Card key={k.label} className="p-4 text-center">
            <div className={`text-2xl font-heading font-extrabold ${k.color}`}>{k.count}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-sm">Mahnungsübersicht</h3>
          <span className="text-sm font-semibold text-red-600">{formatCHF(gesamtBetrag)} ausstehend</span>
        </div>
        {faellig.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Keine offenen Mahnungen. 🎉</p>
        ) : (
          <div className="space-y-3">
            {faellig.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-4 h-4 ${r.mahnstufe.color}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{r.kunde_name || r.titel}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <CalendarDays className="w-3 h-3" />
                      Fällig am {formatDatum(r.faellig_am)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-heading font-bold text-sm">{formatCHF(r.betrag)}</div>
                  <span className={`text-xs font-medium ${r.mahnstufe.color}`}>{r.mahnstufe.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 border-dashed border-2 border-muted-foreground/20">
        <div className="text-center py-4">
          <div className="text-sm font-semibold text-muted-foreground mb-1">Automatische Mahnungen</div>
          <p className="text-xs text-muted-foreground">Automatischer Mahnungsversand per E-Mail wird in Kürze verfügbar sein.</p>
        </div>
      </Card>
    </div>
  );
}
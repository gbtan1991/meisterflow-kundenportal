import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { formatCHF, formatDatum } from "@/lib/format";
import { CheckCircle2, Building2 } from "lucide-react";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, format } from "date-fns";

export default function FinanzenZahlungen() {
  const { data: rechnungen = [] } = useQuery({
    queryKey: ["rechnungen"],
    queryFn: () => base44.entities.Rechnung.list("-created_date", 500),
  });

  const bezahlt = rechnungen.filter((r) => r.status === "bezahlt");

  const today = format(startOfDay(new Date()), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date()), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const yearStart = format(startOfYear(new Date()), "yyyy-MM-dd");

  const sumBy = (from) => bezahlt
    .filter((r) => (r.datum || "") >= from)
    .reduce((s, r) => s + (r.betrag || 0), 0);

  const kpis = [
    { label: "Heute", value: formatCHF(sumBy(today)) },
    { label: "Diese Woche", value: formatCHF(sumBy(weekStart)) },
    { label: "Dieser Monat", value: formatCHF(sumBy(monthStart)) },
    { label: "Dieses Jahr", value: formatCHF(sumBy(yearStart)) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5 text-center">
            <div className="font-heading font-extrabold text-xl text-foreground">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="font-heading font-bold text-sm mb-4">Zahlungseingang</h3>
        {bezahlt.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Noch keine Zahlungen vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {bezahlt.slice(0, 20).map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{r.kunde_name || r.titel}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{r.nummer} · {formatDatum(r.datum)}</div>
                  </div>
                </div>
                <span className="font-heading font-bold text-sm text-emerald-700">{formatCHF(r.betrag)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 border-dashed border-2 border-muted-foreground/20">
        <div className="text-center py-4">
          <div className="text-sm font-semibold text-muted-foreground mb-1">Online-Zahlungen (TWINT, Kreditkarte)</div>
          <p className="text-xs text-muted-foreground">Detaillierte Zahlungsart-Auswertung folgt mit der Stripe-Integration.</p>
        </div>
      </Card>
    </div>
  );
}
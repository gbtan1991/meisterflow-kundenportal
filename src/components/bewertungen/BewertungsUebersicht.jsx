import React from "react";
import { Card } from "@/components/ui/card";
import { Star, TrendingUp, Calendar, Clock } from "lucide-react";
import { formatDatum } from "@/lib/format";
import { format, startOfMonth } from "date-fns";

export default function BewertungsUebersicht({ bewertungen }) {
  const erhaltene = bewertungen.filter(b => b.sterne && (b.status === "erhalten" || b.status === "beantwortet"));
  const durchschnitt = erhaltene.length
    ? (erhaltene.reduce((s, b) => s + b.sterne, 0) / erhaltene.length).toFixed(1)
    : "–";

  const diesesMonat = erhaltene.filter(b => {
    const d = b.bewertungs_datum || b.created_date;
    return d && new Date(d) >= startOfMonth(new Date());
  }).length;

  const letzte = [...erhaltene].sort((a, b) =>
    new Date(b.bewertungs_datum || b.created_date) - new Date(a.bewertungs_datum || a.created_date)
  )[0];

  const stats = [
    { icon: Star, label: "Durchschnitt", value: durchschnitt, sub: "von 5 Sternen", color: "text-amber-500", bg: "bg-amber-50" },
    { icon: TrendingUp, label: "Bewertungen gesamt", value: erhaltene.length, sub: "erhalten", color: "text-blue-500", bg: "bg-blue-50" },
    { icon: Calendar, label: "Diesen Monat", value: diesesMonat, sub: format(new Date(), "MMMM yyyy"), color: "text-emerald-500", bg: "bg-emerald-50" },
    { icon: Clock, label: "Letzte erhalten", value: letzte ? formatDatum(letzte.bewertungs_datum || letzte.created_date) : "–", sub: letzte?.kunde_name || "", color: "text-violet-500", bg: "bg-violet-50" },
  ];

  return (
    <div>
      <h2 className="font-heading font-bold text-lg text-foreground mb-4">Bewertungsübersicht</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="p-4">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            {s.sub && <div className="text-xs text-muted-foreground/70 mt-0.5 truncate">{s.sub}</div>}
          </Card>
        ))}
      </div>
    </div>
  );
}
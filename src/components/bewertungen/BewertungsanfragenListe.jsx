import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Calendar, Bell, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatDatum } from "@/lib/format";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const STATUS_CONFIG = {
  angefragt:           { label: "Angefragt",            color: "bg-slate-100 text-slate-600",    icon: Clock },
  erinnerung_gesendet: { label: "Erinnerung gesendet",  color: "bg-amber-50 text-amber-600",     icon: Bell },
  erhalten:            { label: "Bewertung erhalten",   color: "bg-emerald-50 text-emerald-600", icon: CheckCircle2 },
  keine_antwort:       { label: "Keine Antwort",        color: "bg-red-50 text-red-500",         icon: XCircle },
  beantwortet:         { label: "Beantwortet",          color: "bg-blue-50 text-blue-600",       icon: CheckCircle2 },
};

const FILTER_TABS = [
  { key: "alle", label: "Alle" },
  { key: "offen", label: "Offen" },
  { key: "erhalten", label: "Erhalten" },
  { key: "keine_antwort", label: "Keine Antwort" },
];

const isOffen = (s) => s === "angefragt" || s === "erinnerung_gesendet";

export default function BewertungsanfragenListe({ anfragen }) {
  const [filter, setFilter] = useState("alle");
  const qc = useQueryClient();

  const update = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Bewertung.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bewertungen"] }),
  });

  const gefiltert = anfragen.filter(b => {
    if (filter === "alle") return true;
    if (filter === "offen") return isOffen(b.status);
    if (filter === "erhalten") return b.status === "erhalten";
    if (filter === "keine_antwort") return b.status === "keine_antwort";
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-heading font-bold text-lg text-foreground">Bewertungsanfragen</h2>
        <div className="flex gap-1 flex-wrap">
          {FILTER_TABS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {gefiltert.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-sm">Keine Anfragen gefunden.</Card>
      ) : (
        <div className="space-y-2">
          {gefiltert.map(b => {
            const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.angefragt;
            const Icon = cfg.icon;
            return (
              <Card key={b.id} className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Kunde</div>
                      <div className="font-medium text-foreground truncate flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        {b.kunde_name || b.name || "–"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Versanddatum</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        {b.versand_datum ? formatDatum(b.versand_datum) : formatDatum(b.created_date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Plattform</div>
                      <div className="text-foreground capitalize">{b.plattform === "google" ? "Google" : b.plattform || "Google"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Status</div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </div>
                  </div>
                  <Select value={b.status} onValueChange={status => update.mutate({ id: b.id, data: { status } })}>
                    <SelectTrigger className="w-44 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                        <SelectItem key={v} value={v}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
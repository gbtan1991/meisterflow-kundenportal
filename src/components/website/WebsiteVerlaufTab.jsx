import React from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, RotateCcw, HelpCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const STATUS_CONFIG = {
  offen:          { label: "Offen",          color: "text-slate-500",   icon: Clock },
  geplant:        { label: "Geplant",         color: "text-blue-500",    icon: RotateCcw },
  in_bearbeitung: { label: "In Bearbeitung",  color: "text-amber-500",   icon: RotateCcw },
  rueckfrage:     { label: "Rückfrage",       color: "text-violet-500",  icon: HelpCircle },
  erledigt:       { label: "Erledigt",        color: "text-emerald-500", icon: CheckCircle2 },
  abgelehnt:      { label: "Abgelehnt",       color: "text-red-400",     icon: AlertCircle },
};

const TYP_LABELS = {
  anpassung: "Anpassung",
  neues_element: "Neues Element",
  fehler: "Fehler melden",
  sonstiges: "Sonstiges",
};

export default function WebsiteVerlaufTab({ anfragen }) {
  const sortiert = [...anfragen].sort((a, b) =>
    new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date)
  );

  if (sortiert.length === 0) {
    return (
      <Card className="p-10 text-center text-muted-foreground text-sm">
        Noch keine Änderungen vorhanden.
      </Card>
    );
  }

  return (
    <div className="space-y-1">
      {sortiert.map((a, i) => {
        const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.offen;
        const Icon = cfg.icon;
        const datum = a.updated_date || a.created_date;
        return (
          <div key={a.id} className="flex gap-4">
            {/* Timeline Linie */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              {i < sortiert.length - 1 && (
                <div className="w-px flex-1 bg-border mt-1" />
              )}
            </div>
            {/* Inhalt */}
            <div className={`pb-6 flex-1 ${i === sortiert.length - 1 ? "pb-0" : ""}`}>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <span className="font-medium text-foreground text-sm">{a.titel}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {TYP_LABELS[a.typ] || a.typ}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {datum ? format(new Date(datum), "dd. MMM yyyy", { locale: de }) : "–"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
              </div>
              {a.beschreibung && (
                <p className="text-sm text-muted-foreground mt-1">{a.beschreibung}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
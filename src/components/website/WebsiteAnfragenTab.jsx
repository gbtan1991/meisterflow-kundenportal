import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, CheckCircle2, AlertCircle, RotateCcw, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const TYP_LABELS = {
  anpassung: "Anpassung",
  neues_element: "Neues Element",
  fehler: "Fehler melden",
  sonstiges: "Sonstiges",
};

const PRIO_LABELS = {
  niedrig: "Niedrig",
  mittel: "Mittel",
  hoch: "Hoch",
};

const STATUS_CONFIG = {
  offen:         { label: "Offen",          color: "bg-slate-100 text-slate-600",    icon: Clock },
  geplant:       { label: "Geplant",         color: "bg-blue-50 text-blue-600",       icon: RotateCcw },
  in_bearbeitung:{ label: "In Bearbeitung",  color: "bg-amber-50 text-amber-600",     icon: RotateCcw },
  rueckfrage:    { label: "Rückfrage",       color: "bg-violet-50 text-violet-600",   icon: HelpCircle },
  erledigt:      { label: "Erledigt",        color: "bg-emerald-50 text-emerald-600", icon: CheckCircle2 },
  abgelehnt:     { label: "Abgelehnt",       color: "bg-red-50 text-red-500",         icon: AlertCircle },
};

const FILTER_TABS = [
  { key: "alle", label: "Alle" },
  { key: "offen", label: "Offen" },
  { key: "in_bearbeitung", label: "In Bearbeitung" },
  { key: "erledigt", label: "Erledigt" },
];

export default function WebsiteAnfragenTab({ anfragen, onNeu }) {
  const [filter, setFilter] = React.useState("alle");

  const gefiltert = filter === "alle" ? anfragen : anfragen.filter(a => a.status === filter);

  return (
    <div>
      {/* Filter + Neu-Button */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {FILTER_TABS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
              {f.key !== "alle" && (
                <span className="ml-1.5 opacity-70">
                  {anfragen.filter(a => a.status === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={onNeu}>
          <Plus className="w-4 h-4 mr-1" /> Neue Anfrage
        </Button>
      </div>

      {gefiltert.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground text-sm">
          Keine Anfragen in dieser Kategorie.
        </Card>
      ) : (
        <div className="space-y-3">
          {gefiltert.map((a) => {
            const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.offen;
            const Icon = cfg.icon;
            return (
              <Card key={a.id} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-foreground">{a.titel}</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground font-medium">
                        {TYP_LABELS[a.typ] || a.typ}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        a.prioritaet === "hoch" ? "bg-red-50 text-red-600" :
                        a.prioritaet === "mittel" ? "bg-amber-50 text-amber-600" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {PRIO_LABELS[a.prioritaet]}
                      </span>
                    </div>
                    {a.beschreibung && (
                      <p className="text-sm text-muted-foreground">{a.beschreibung}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span>Erstellt: {a.created_date ? format(new Date(a.created_date), "dd. MMM yyyy", { locale: de }) : "–"}</span>
                      {a.updated_date && (
                        <span>Aktualisiert: {format(new Date(a.updated_date), "dd. MMM yyyy", { locale: de })}</span>
                      )}
                      {a.screenshot_url && (
                        <a href={a.screenshot_url} target="_blank" rel="noopener noreferrer"
                          className="text-primary hover:underline">
                          Screenshot ansehen
                        </a>
                      )}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium whitespace-nowrap ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
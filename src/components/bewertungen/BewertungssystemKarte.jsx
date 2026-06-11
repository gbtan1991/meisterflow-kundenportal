import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, XCircle, Bell, Zap, Send, TrendingUp, BarChart2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startOfMonth } from "date-fns";

export default function BewertungssystemKarte({ firma, bewertungen = [] }) {
  const qc = useQueryClient();
  const systemAktiv = !!firma?.google_verbunden;

  const updateFirma = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Firma.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["firma"] }),
  });

  const toggleSystem = () => {
    if (!firma?.id) return;
    updateFirma.mutate({ id: firma.id, data: { google_verbunden: !systemAktiv } });
  };

  // Statistiken berechnen
  const monatsBeginn = startOfMonth(new Date());
  const versendetDiesenMonat = bewertungen.filter(b => {
    const d = b.versand_datum ? new Date(b.versand_datum) : new Date(b.created_date);
    return d >= monatsBeginn;
  }).length;

  const erhaltenDiesenMonat = bewertungen.filter(b => {
    const d = b.versand_datum ? new Date(b.versand_datum) : new Date(b.created_date);
    return d >= monatsBeginn && (b.status === "erhalten" || b.status === "beantwortet");
  }).length;

  const erfolgsquote = versendetDiesenMonat > 0
    ? Math.round((erhaltenDiesenMonat / versendetDiesenMonat) * 100)
    : 0;

  return (
    <Card className="p-6">
      {/* Header mit Toggle */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <h2 className="font-heading font-bold text-lg text-foreground">Bewertungssystem</h2>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${systemAktiv ? "text-emerald-600" : "text-slate-400"}`}>
            {systemAktiv ? "Aktiv" : "Nicht aktiv"}
          </span>
          <Switch checked={systemAktiv} onCheckedChange={toggleSystem} />
        </div>
      </div>

      {/* Bewertungslink + Automatische Anfragen Status */}
      <div className="space-y-0 mb-5 rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5 text-sm">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">Automatische Bewertungsanfragen</span>
          </div>
          <span className={`flex items-center gap-1 text-xs font-medium ${systemAktiv ? "text-emerald-600" : "text-slate-400"}`}>
            {systemAktiv ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {systemAktiv ? "Aktiv" : "Nicht aktiv"}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-2.5 text-sm">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">Erinnerungen</span>
          </div>
          <span className={`flex items-center gap-1 text-xs font-medium ${systemAktiv ? "text-emerald-600" : "text-slate-400"}`}>
            {systemAktiv ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {systemAktiv ? "Aktiv" : "Nicht aktiv"}
          </span>
        </div>
      </div>

      {/* Statistiken Automatische Anfragen */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Automatische Anfragen</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{versendetDiesenMonat}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Versendet diesen Monat</div>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">{erhaltenDiesenMonat}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Bewertungen erhalten</div>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-primary">{erfolgsquote}%</div>
            <div className="text-xs text-muted-foreground mt-0.5">Erfolgsquote</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
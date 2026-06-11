import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCHF } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, startOfMonth, subMonths } from "date-fns";
import { de } from "date-fns/locale";

export default function FinanzenBerichte() {
  const [zeitraum, setZeitraum] = useState("12");

  const { data: rechnungen = [] } = useQuery({
    queryKey: ["rechnungen"],
    queryFn: () => base44.entities.Rechnung.list("-created_date", 500),
  });

  const monate = parseInt(zeitraum);
  const chartData = Array.from({ length: monate }, (_, i) => {
    const d = subMonths(new Date(), monate - 1 - i);
    const monthKey = format(d, "yyyy-MM");
    const betrag = rechnungen
      .filter((r) => r.status === "bezahlt" && (r.datum || "").startsWith(monthKey))
      .reduce((s, r) => s + (r.betrag || 0), 0);
    return { monat: format(d, monate > 6 ? "MMM" : "MMMM", { locale: de }), betrag };
  });

  // Top Kunden
  const kundenMap = {};
  rechnungen.filter((r) => r.status === "bezahlt").forEach((r) => {
    const name = r.kunde_name || "Unbekannt";
    kundenMap[name] = (kundenMap[name] || 0) + (r.betrag || 0);
  });
  const topKunden = Object.entries(kundenMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Offene Forderungen nach Alter
  const offen = rechnungen.filter((r) => ["offen", "ueberfaellig"].includes(r.status));
  const bis30 = offen.filter((r) => {
    const tage = r.faellig_am ? (new Date() - new Date(r.faellig_am)) / 86400000 : 0;
    return tage <= 30;
  }).reduce((s, r) => s + (r.betrag || 0), 0);
  const bis60 = offen.filter((r) => {
    const tage = r.faellig_am ? (new Date() - new Date(r.faellig_am)) / 86400000 : 0;
    return tage > 30 && tage <= 60;
  }).reduce((s, r) => s + (r.betrag || 0), 0);
  const ueber60 = offen.filter((r) => {
    const tage = r.faellig_am ? (new Date() - new Date(r.faellig_am)) / 86400000 : 0;
    return tage > 60;
  }).reduce((s, r) => s + (r.betrag || 0), 0);

  return (
    <div className="space-y-6">
      {/* Umsatz Chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold">Umsatz</h3>
          <div className="flex gap-1.5">
            {["3", "6", "12"].map((z) => (
              <Button key={z} variant={zeitraum === z ? "default" : "outline"} size="sm" onClick={() => setZeitraum(z)}>
                {z} Monate
              </Button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <XAxis dataKey="monat" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip formatter={(v) => formatCHF(v)} />
            <Bar dataKey="betrag" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill="hsl(var(--primary))" fillOpacity={0.7 + (i / chartData.length) * 0.3} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Kunden */}
        <Card className="p-5">
          <h3 className="font-heading font-bold text-sm mb-4">Top Kunden</h3>
          {topKunden.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Daten vorhanden.</p>
          ) : (
            <div className="space-y-3">
              {topKunden.map(([name, betrag], i) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}.</span>
                    <span className="text-sm">{name}</span>
                  </div>
                  <span className="font-heading font-bold text-sm">{formatCHF(betrag)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Offene Forderungen */}
        <Card className="p-5">
          <h3 className="font-heading font-bold text-sm mb-4">Offene Forderungen nach Alter</h3>
          <div className="space-y-3">
            {[
              { label: "0–30 Tage", betrag: bis30, color: "bg-amber-400" },
              { label: "30–60 Tage", betrag: bis60, color: "bg-orange-500" },
              { label: "60+ Tage", betrag: ueber60, color: "bg-red-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="font-heading font-bold text-sm">{formatCHF(item.betrag)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
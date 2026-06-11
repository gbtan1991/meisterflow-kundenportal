import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { formatCHF } from "@/lib/format";
import { TrendingUp, Clock, AlertTriangle, CreditCard, ArrowDownCircle, Percent, CheckCircle2, Receipt, Send, Bell, ThumbsUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfMonth } from "date-fns";
import { de } from "date-fns/locale";

export default function FinanzenDashboard() {
  const { data: rechnungen = [] } = useQuery({
    queryKey: ["rechnungen"],
    queryFn: () => base44.entities.Rechnung.list("-created_date", 500),
  });
  const { data: offerten = [] } = useQuery({
    queryKey: ["offerten"],
    queryFn: () => base44.entities.Offerte.list("-created_date", 100),
  });

  const monatsumsatz = rechnungen
    .filter((r) => r.status === "bezahlt" && r.datum >= format(startOfMonth(new Date()), "yyyy-MM-dd"))
    .reduce((s, r) => s + (r.betrag || 0), 0);

  const offeneRechnungen = rechnungen.filter((r) => r.status === "offen");
  const offenerBetrag = offeneRechnungen.reduce((s, r) => s + (r.betrag || 0), 0);

  const ueberfaellig = rechnungen.filter((r) => r.status === "ueberfaellig");
  const ueberfaelligBetrag = ueberfaellig.reduce((s, r) => s + (r.betrag || 0), 0);

  const onlineBezahlt = rechnungen
    .filter((r) => r.status === "bezahlt")
    .reduce((s, r) => s + (r.betrag || 0), 0);

  // Build last 12 months chart data
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const d = subDays(new Date(), (11 - i) * 30);
    const monthKey = format(d, "yyyy-MM");
    const betrag = rechnungen
      .filter((r) => r.status === "bezahlt" && (r.datum || "").startsWith(monthKey))
      .reduce((s, r) => s + (r.betrag || 0), 0);
    return { monat: format(d, "MMM", { locale: de }), betrag };
  });

  const recentActivities = [
    ...rechnungen.filter((r) => r.status === "bezahlt").slice(0, 2).map((r) => ({
      icon: CheckCircle2, color: "text-emerald-600", label: `Rechnung bezahlt – ${r.kunde_name || r.nummer}`, datum: r.datum,
    })),
    ...offerten.filter((o) => o.status === "akzeptiert").slice(0, 2).map((o) => ({
      icon: ThumbsUp, color: "text-primary", label: `Offerte akzeptiert – ${o.kunde_name || o.nummer}`, datum: o.datum,
    })),
  ]
    .sort((a, b) => (b.datum || "").localeCompare(a.datum || ""))
    .slice(0, 5);

  const kpis = [
    { label: "Monatsumsatz", value: formatCHF(monatsumsatz), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Offene Rechnungen", value: formatCHF(offenerBetrag), sub: `${offeneRechnungen.length} Rechnungen`, icon: Clock, color: "text-primary", bg: "bg-primary/10" },
    { label: "Überfällig", value: formatCHF(ueberfaelligBetrag), sub: `${ueberfaellig.length} Rechnungen`, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
    { label: "Gesamt bezahlt", value: formatCHF(onlineBezahlt), icon: CreditCard, color: "text-violet-600", bg: "bg-violet-50" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                <p className="font-heading font-extrabold text-xl text-foreground">{k.value}</p>
                {k.sub && <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>}
              </div>
              <div className={`p-2 rounded-lg ${k.bg}`}>
                <k.icon className={`w-5 h-5 ${k.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-heading font-bold text-sm mb-4">Umsatz – letzte 12 Monate</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="umsatz" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="monat" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v) => formatCHF(v)} />
              <Area type="monotone" dataKey="betrag" stroke="hsl(var(--primary))" fill="url(#umsatz)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-heading font-bold text-sm mb-4">Letzte Aktivitäten</h3>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Aktivitäten vorhanden.</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`mt-0.5 p-1 rounded-full bg-muted`}>
                    <a.icon className={`w-3.5 h-3.5 ${a.color}`} />
                  </div>
                  <div>
                    <p className="text-sm">{a.label}</p>
                    {a.datum && <p className="text-xs text-muted-foreground">{a.datum}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
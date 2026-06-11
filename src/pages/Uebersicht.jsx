import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Inbox, CalendarDays, FileText, Receipt, Star, ArrowUpRight, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

const useList = (key, entity) =>
  useQuery({
    queryKey: [key],
    queryFn: () => base44.entities[entity].list("-created_date", 200),
    initialData: [],
  });

export default function Uebersicht() {
  const navigate = useNavigate();
  const { data: anfragen } = useList("anfragen", "Anfrage");
  const { data: termine } = useList("termine", "Termin");
  const { data: offerten } = useList("offerten", "Offerte");
  const { data: rechnungen } = useList("rechnungen", "Rechnung");
  const { data: bewertungen } = useList("bewertungen", "Bewertung");

  const handleActivityClick = (id, art) => {
    const [type, actualId] = [id[0], id.substring(1)];
    const routes = {
      a: `/anfragen?id=${actualId}`,
      t: `/termine?id=${actualId}`,
      o: `/offerten?id=${actualId}`,
      r: `/rechnungen?id=${actualId}`,
      b: `/bewertungen?id=${actualId}`,
    };
    if (routes[type]) navigate(routes[type]);
  };

  const stats = [
    { label: "Neue Anfragen", value: anfragen.filter((a) => a.status === "neu").length, icon: Inbox, to: "/anfragen", color: "bg-blue-50 text-blue-600" },
    { label: "Offene Termine", value: termine.filter((t) => ["geplant", "bestaetigt"].includes(t.status)).length, icon: CalendarDays, to: "/termine", color: "bg-sky-50 text-sky-600" },
    { label: "Offene Offerten", value: offerten.filter((o) => ["entwurf", "gesendet"].includes(o.status)).length, icon: FileText, to: "/offerten", color: "bg-violet-50 text-violet-600" },
    { label: "Offene Rechnungen", value: rechnungen.filter((r) => ["offen", "ueberfaellig"].includes(r.status)).length, icon: Receipt, to: "/rechnungen", color: "bg-amber-50 text-amber-600" },
    { label: "Neue Bewertungen", value: bewertungen.filter((b) => b.status === "erhalten").length, icon: Star, to: "/bewertungen", color: "bg-emerald-50 text-emerald-600" },
  ];

  const aktivitaeten = [
    ...anfragen.map((a) => ({ id: `a${a.id}`, icon: Inbox, color: "bg-blue-50 text-blue-600", text: a.betreff, sub: a.kunde_name, status: a.status, date: a.created_date, art: "Anfrage" })),
    ...termine.map((t) => ({ id: `t${t.id}`, icon: CalendarDays, color: "bg-sky-50 text-sky-600", text: t.titel, sub: t.kunde_name, status: t.status, date: t.created_date, art: "Termin" })),
    ...offerten.map((o) => ({ id: `o${o.id}`, icon: FileText, color: "bg-violet-50 text-violet-600", text: o.titel || o.nummer, sub: o.kunde_name, status: o.status, date: o.created_date, art: "Offerte" })),
    ...rechnungen.map((r) => ({ id: `r${r.id}`, icon: Receipt, color: "bg-amber-50 text-amber-600", text: r.titel || r.nummer, sub: r.kunde_name, status: r.status, date: r.created_date, art: "Rechnung" })),
    ...bewertungen.map((b) => ({ id: `b${b.id}`, icon: Star, color: "bg-emerald-50 text-emerald-600", text: "Bewertung", sub: b.kunde_name, status: b.status, date: b.created_date, art: "Bewertung" })),
  ]
    .sort((x, y) => new Date(y.date) - new Date(x.date))
    .slice(0, 8);

  return (
    <div>
      <PageHeader title="Übersicht" subtitle="Willkommen zurück – hier ist der aktuelle Stand Ihres Betriebs" />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, to, color }) => (
          <Link key={label} to={to}>
            <Card className="p-5 hover:shadow-md transition-shadow group h-full">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-4">
                <div className="font-heading text-3xl font-extrabold text-foreground">{value}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="font-heading font-bold text-foreground">Letzte Aktivitäten</h2>
        </div>
        <div className="divide-y divide-border">
          {aktivitaeten.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">Noch keine Aktivitäten vorhanden.</p>
          )}
          {aktivitaeten.map(({ id, icon: Icon, color, text, sub, status, date, art }) => (
            <button
              key={id}
              onClick={() => handleActivityClick(id, art)}
              className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors text-left cursor-pointer"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  <span className="text-muted-foreground font-normal">{art}:</span> {text}
                </p>
                <p className="text-xs text-muted-foreground truncate">{sub}</p>
              </div>
              <StatusBadge status={status} />
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                {date ? formatDistanceToNow(new Date(date), { addSuffix: true, locale: de }) : ""}
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
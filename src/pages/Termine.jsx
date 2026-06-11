import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import TerminDialog from "@/components/forms/TerminDialog";
import TerminEditDialog from "@/components/forms/TerminEditDialog";
import OfferteDialog from "@/components/forms/OfferteDialog";
import { Plus, Building2, MapPin, Bell, BellOff, Trash2, FileText } from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek, isPast, parseISO, startOfDay, getISOWeek } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState as useLocalState } from "react";

const GCalIcon = () => (
  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Kalender" className="w-4 h-4 object-contain" />
);
const OutlookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="3" fill="#0078D4"/>
    <path d="M13 5h7.5A.5.5 0 0 1 21 5.5v13a.5.5 0 0 1-.5.5H13V5z" fill="#106EBE"/>
    <path d="M13 5v14H3.5A.5.5 0 0 1 3 18.5v-13A.5.5 0 0 1 3.5 5H13z" fill="#0078D4"/>
    <rect x="14" y="8" width="6" height="1.2" rx="0.4" fill="white" opacity="0.9"/>
    <rect x="14" y="10.4" width="6" height="1.2" rx="0.4" fill="white" opacity="0.9"/>
    <rect x="14" y="12.8" width="6" height="1.2" rx="0.4" fill="white" opacity="0.9"/>
    <rect x="14" y="15.2" width="4" height="1.2" rx="0.4" fill="white" opacity="0.9"/>
    <ellipse cx="8" cy="12" rx="3" ry="3.5" fill="white" opacity="0.95"/>
    <ellipse cx="8" cy="12" rx="2" ry="2.5" fill="#0078D4"/>
  </svg>
);

const STATUS_LABELS = {
  geplant: "Geplant",
  bestaetigt: "Bestätigt",
  abgeschlossen: "Abgeschlossen",
  abgesagt: "Abgesagt",
};

function datumTitel(d) {
  const date = parseISO(d);
  if (isToday(date)) return "Heute";
  if (isTomorrow(date)) return "Morgen";
  return format(date, "EEEE, dd. MMMM yyyy", { locale: de });
}

function istVergangen(datum, status) {
  if (status === "abgeschlossen" || status === "abgesagt") return true;
  const d = parseISO(datum);
  return isPast(startOfDay(d)) && !isToday(d);
}

export default function Termine() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTermin, setEditTermin] = useState(null);
  const [offertePrefill, setOffertePrefill] = useState(null);
  const qc = useQueryClient();

  const { data: termine = [] } = useQuery({
    queryKey: ["termine"],
    queryFn: () => base44.entities.Termin.list("-created_date", 500),
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Termin.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["termine"] }),
  });
  const remove = useMutation({
    mutationFn: (id) => base44.entities.Termin.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["termine"] }),
  });

  // Zukünftige/heutige aufsteigend (nächster zuerst), vergangene danach absteigend (letzter zuerst)
  const sortiert = [...termine].sort((a, b) => {
    const aVerg = istVergangen(a.datum, a.status);
    const bVerg = istVergangen(b.datum, b.status);
    if (aVerg !== bVerg) return aVerg ? 1 : -1; // vergangene nach unten
    const keyA = `${a.datum} ${a.uhrzeit || ""}`;
    const keyB = `${b.datum} ${b.uhrzeit || ""}`;
    // zukünftige: aufsteigend (nächster zuerst); vergangene: absteigend (letzter zuerst)
    return aVerg ? keyB.localeCompare(keyA) : keyA.localeCompare(keyB);
  });

  const gruppen = sortiert.reduce((acc, t) => {
    (acc[t.datum] = acc[t.datum] || []).push(t);
    return acc;
  }, {});

  // Mini-Zusammenfassung
  const heute = termine.filter((t) => isToday(parseISO(t.datum))).length;
  const dieseWoche = termine.filter((t) => isThisWeek(parseISO(t.datum), { locale: de }) && !isToday(parseISO(t.datum))).length;
  const naechsteWoche = termine.filter((t) => {
    const d = parseISO(t.datum);
    const now = new Date();
    return getISOWeek(d) === getISOWeek(now) + 1 && d.getFullYear() === now.getFullYear();
  }).length;

  const handleOfferteErstellen = (t) => {
    setOffertePrefill({
      kunde_id: t.kunde_id || "",
      kunde_name: t.kunde_name || "",
      titel: t.titel || "",
    });
  };

  return (
    <div>
      <PageHeader title="Termine">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => base44.connectors.connectAppUser("6a2a68df83a79531c222b4a6").then(url => window.open(url, "_blank"))}>
          <GCalIcon /> Google Kalender
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => base44.connectors.connectAppUser("6a2a5b27725e857800ca8e5d").then(url => window.open(url, "_blank"))}>
          <OutlookIcon /> Outlook
        </Button>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Neuer Termin
        </Button>
      </PageHeader>

      {/* Mini-Zusammenfassung */}
      <div className="flex gap-4 mb-6 text-sm">
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{heute}</span> Heute
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{dieseWoche}</span> Diese Woche
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{naechsteWoche}</span> Nächste Woche
        </span>
      </div>

      <div className="space-y-7">
        {termine.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground text-sm">
            Noch keine Termine geplant.
          </Card>
        )}
        {Object.entries(gruppen).map(([datum, eintraege]) => {
          const istHeute = isToday(parseISO(datum));
          return (
            <div key={datum}>
              {/* Datumsüberschrift – heute blau hervorheben */}
              <div className={cn(
                "flex items-center gap-3 mb-3",
                istHeute && "text-primary"
              )}>
                {istHeute && <div className="w-1 h-5 rounded-full bg-primary" />}
                <h2 className={cn(
                  "font-heading font-bold text-sm uppercase tracking-wide",
                  istHeute ? "text-primary" : "text-foreground"
                )}>
                  {datumTitel(datum)}
                </h2>
                {istHeute && (
                  <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Heute
                  </span>
                )}
              </div>

              <div className={cn(
                "space-y-3",
                istHeute && "pl-4 border-l-2 border-primary/30"
              )}>
                {eintraege.map((t) => {
                  const vergangen = istVergangen(t.datum, t.status);
                  return (
                    <Card
                      key={t.id}
                      className={cn(
                        "p-5 hover:shadow-md transition-all cursor-pointer",
                        vergangen && "opacity-50"
                      )}
                      onClick={() => setEditTermin(t)}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="w-14 shrink-0 text-center">
                            <div className={cn(
                              "font-heading font-extrabold",
                              vergangen ? "text-muted-foreground" : "text-foreground"
                            )}>
                              {t.uhrzeit || "–"}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {t.dauer_minuten ? `${t.dauer_minuten} Min.` : ""}
                            </div>
                          </div>
                          <div className="w-px self-stretch bg-border" />
                          <div className="min-w-0 space-y-1">
                            <p className={cn(
                              "font-semibold",
                              vergangen ? "text-muted-foreground" : "text-foreground"
                            )}>{t.titel}</p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              {t.kunde_name && (
                                <span className="flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5" /> {t.kunde_name}
                                </span>
                              )}
                              {t.ort && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5" /> {t.ort}
                                </span>
                              )}
                            </div>
                            {t.notizen && (
                              <p className="text-xs text-muted-foreground">{t.notizen}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Offerte erstellen Schnell-Aktion */}
                          {t.kunde_id && !vergangen && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1.5"
                              onClick={() => handleOfferteErstellen(t)}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Offerte
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t.erinnerung ? "Erinnerung aktiv" : "Keine Erinnerung"}
                            className={t.erinnerung ? "text-primary" : "text-muted-foreground"}
                            onClick={() => update.mutate({ id: t.id, data: { erinnerung: !t.erinnerung } })}
                          >
                            {t.erinnerung ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                          </Button>
                          <Select
                            value={t.status}
                            onValueChange={(status) => update.mutate({ id: t.id, data: { status } })}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                                <SelectItem key={v} value={v}>{l}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => remove.mutate(t.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <TerminDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <TerminEditDialog
        termin={editTermin}
        open={!!editTermin}
        onOpenChange={(o) => { if (!o) setEditTermin(null); }}
      />
      <OfferteDialog
        open={!!offertePrefill}
        onOpenChange={(o) => { if (!o) setOffertePrefill(null); }}
        prefill={offertePrefill || {}}
      />
    </div>
  );
}
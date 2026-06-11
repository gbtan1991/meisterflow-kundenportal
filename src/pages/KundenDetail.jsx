import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import { kundeName, formatDatum, formatCHF } from "@/lib/format";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Inbox,
  CalendarDays,
  FileText,
  Receipt,
  Star,
  StickyNote,
  TrendingUp,
} from "lucide-react";
import {
  AnfrageDetailDialog,
  TerminDetailDialog,
  OfferteDetailDialog,
  RechnungDetailDialog,
  BewertungDetailDialog,
} from "@/components/DetailDialog";

function HistorieSektion({ titel, icon: Icon, eintraege, leerText, onKlick }) {
  return (
    <Card>
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="font-heading font-bold text-sm text-foreground">{titel}</h3>
        <span className="text-xs text-muted-foreground ml-auto">{eintraege.length}</span>
      </div>
      <div className="divide-y divide-border">
        {eintraege.length === 0 && (
          <p className="px-5 py-4 text-sm text-muted-foreground">{leerText}</p>
        )}
        {eintraege.map((e) => (
          <button
            key={e.id}
            onClick={() => onKlick(e.raw)}
            className="w-full px-5 py-3 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors text-left"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{e.text}</p>
              {e.sub && <p className="text-xs text-muted-foreground">{e.sub}</p>}
            </div>
            <StatusBadge status={e.status} />
          </button>
        ))}
      </div>
    </Card>
  );
}

export default function KundenDetail() {
  const { id } = useParams();

  const [dialog, setDialog] = useState({ typ: null, item: null });
  const schliessen = () => setDialog({ typ: null, item: null });

  const { data: kunden = [] } = useQuery({
    queryKey: ["kunde", id],
    queryFn: () => base44.entities.Kunde.filter({ id }),
  });
  const kunde = kunden[0];

  const useFiltered = (key, entity) =>
    useQuery({
      queryKey: [key, id],
      queryFn: () => base44.entities[entity].filter({ kunde_id: id }, "-created_date", 50),
      initialData: [],
    });

  const { data: anfragen } = useFiltered("kunde-anfragen", "Anfrage");
  const { data: termine } = useFiltered("kunde-termine", "Termin");
  const { data: offerten } = useFiltered("kunde-offerten", "Offerte");
  const { data: rechnungen } = useFiltered("kunde-rechnungen", "Rechnung");
  const { data: bewertungen } = useFiltered("kunde-bewertungen", "Bewertung");

  // Umsatz = Summe aller bezahlten Rechnungen + akzeptierte Offerten (einmalig)
  const umsatz = rechnungen
    .filter((r) => r.status === "bezahlt")
    .reduce((sum, r) => sum + (r.betrag || 0), 0);

  if (!kunde) {
    return <div className="text-sm text-muted-foreground">Kunde wird geladen…</div>;
  }

  return (
    <div>
      <Link
        to="/kunden"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Zurück zur Kundenübersicht
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center font-heading font-extrabold text-lg">
          {kundeName(kunde).slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
              {kundeName(kunde)}
            </h1>
            <StatusBadge status={kunde.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kunde seit {formatDatum(kunde.created_date)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="space-y-5">
          {/* Kontaktinformationen */}
          <Card className="p-5">
            <h3 className="font-heading font-bold text-sm text-foreground mb-4">
              Kontaktinformationen
            </h3>
            <div className="space-y-3 text-sm">
              {(kunde.vorname || kunde.nachname) && (
                <p className="font-medium text-foreground">
                  {kunde.vorname} {kunde.nachname}
                </p>
              )}
              {kunde.email && (
                <p className="flex items-center gap-2.5 text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary" /> {kunde.email}
                </p>
              )}
              {kunde.telefon && (
                <p className="flex items-center gap-2.5 text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary" /> {kunde.telefon}
                </p>
              )}
              {(kunde.adresse || kunde.ort) && (
                <p className="flex items-center gap-2.5 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  {kunde.adresse}{kunde.adresse ? ", " : ""}{kunde.plz} {kunde.ort}
                </p>
              )}
            </div>
          </Card>

          {/* Notizen */}
          {kunde.notizen && (
            <Card className="p-5">
              <h3 className="font-heading font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-primary" /> Notizen
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{kunde.notizen}</p>
            </Card>
          )}

          {/* Umsatz */}
          <Card className="p-5">
            <h3 className="font-heading font-bold text-sm text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Umsatz
            </h3>
            <p className="text-2xl font-extrabold font-heading text-foreground">
              {formatCHF(umsatz)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {rechnungen.filter((r) => r.status === "bezahlt").length} bezahlte Rechnung{rechnungen.filter((r) => r.status === "bezahlt").length !== 1 ? "en" : ""}
            </p>
          </Card>
        </div>

        {/* Historien */}
        <div className="lg:col-span-2 space-y-5">
          <HistorieSektion
            titel="Anfragen"
            icon={Inbox}
            leerText="Keine Anfragen vorhanden."
            onKlick={(item) => setDialog({ typ: "anfrage", item })}
            eintraege={anfragen.map((a) => ({ id: a.id, raw: a, text: a.betreff, sub: formatDatum(a.created_date), status: a.status }))}
          />
          <HistorieSektion
            titel="Termine"
            icon={CalendarDays}
            leerText="Keine Termine vorhanden."
            onKlick={(item) => setDialog({ typ: "termin", item })}
            eintraege={termine.map((t) => ({ id: t.id, raw: t, text: t.titel, sub: `${formatDatum(t.datum)} · ${t.uhrzeit || ""}`, status: t.status }))}
          />
          <HistorieSektion
            titel="Offerten"
            icon={FileText}
            leerText="Keine Offerten vorhanden."
            onKlick={(item) => setDialog({ typ: "offerte", item })}
            eintraege={offerten.map((o) => ({ id: o.id, raw: o, text: `${o.nummer} – ${o.titel || ""}`, sub: `${formatDatum(o.datum)} · ${formatCHF(o.betrag_einmalig)} + ${formatCHF(o.betrag_monatlich)}/Mt.`, status: o.status }))}
          />
          <HistorieSektion
            titel="Rechnungen"
            icon={Receipt}
            leerText="Keine Rechnungen vorhanden."
            onKlick={(item) => setDialog({ typ: "rechnung", item })}
            eintraege={rechnungen.map((r) => ({ id: r.id, raw: r, text: `${r.nummer} – ${r.titel || ""}`, sub: `${formatDatum(r.datum)} · ${formatCHF(r.betrag)}`, status: r.status }))}
          />
          <HistorieSektion
            titel="Bewertungen"
            icon={Star}
            leerText="Keine Bewertungen vorhanden."
            onKlick={(item) => setDialog({ typ: "bewertung", item })}
            eintraege={bewertungen.map((b) => ({ id: b.id, raw: b, text: b.sterne ? `${"★".repeat(b.sterne)}${"☆".repeat(5 - b.sterne)}` : "Bewertung angefragt", sub: b.kommentar, status: b.status }))}
          />
        </div>
      </div>

      {/* Detail Dialoge */}
      <AnfrageDetailDialog
        anfrage={dialog.typ === "anfrage" ? dialog.item : null}
        open={dialog.typ === "anfrage"}
        onOpenChange={schliessen}
      />
      <TerminDetailDialog
        termin={dialog.typ === "termin" ? dialog.item : null}
        open={dialog.typ === "termin"}
        onOpenChange={schliessen}
      />
      <OfferteDetailDialog
        offerte={dialog.typ === "offerte" ? dialog.item : null}
        open={dialog.typ === "offerte"}
        onOpenChange={schliessen}
      />
      <RechnungDetailDialog
        rechnung={dialog.typ === "rechnung" ? dialog.item : null}
        open={dialog.typ === "rechnung"}
        onOpenChange={schliessen}
      />
      <BewertungDetailDialog
        bewertung={dialog.typ === "bewertung" ? dialog.item : null}
        open={dialog.typ === "bewertung"}
        onOpenChange={schliessen}
      />
    </div>
  );
}
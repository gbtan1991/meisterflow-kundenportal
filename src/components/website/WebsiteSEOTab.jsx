import React from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, BarChart2, Search, Building2 } from "lucide-react";

const VerbindungsKarte = ({ icon: Icon, titel, beschreibung, verbunden, hinweis }) => (
  <Card className="p-5">
    <div className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${verbunden ? "bg-emerald-50" : "bg-slate-100"}`}>
        <Icon className={`w-5 h-5 ${verbunden ? "text-emerald-600" : "text-slate-400"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground">{titel}</span>
          {verbunden ? (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verbunden
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
              <XCircle className="w-3.5 h-3.5" /> Nicht verbunden
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{beschreibung}</p>
        {!verbunden && hinweis && (
          <p className="text-xs text-muted-foreground mt-2 bg-muted rounded-lg px-3 py-2">{hinweis}</p>
        )}
      </div>
    </div>
  </Card>
);

export default function WebsiteSEOTab({ firma }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-1">SEO & Sichtbarkeit</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Verbinden Sie Ihre Google-Dienste, um Ihre Online-Sichtbarkeit zu messen und zu verbessern.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <VerbindungsKarte
            icon={Building2}
            titel="Google Unternehmensprofil"
            beschreibung="Ihr Profil in Google Maps und der Google-Suche."
            verbunden={!!firma?.google_verbunden}
            hinweis="Verbinden Sie Ihr Google-Konto unter Firma → Einstellungen."
          />
          <VerbindungsKarte
            icon={BarChart2}
            titel="Google Analytics"
            beschreibung="Besucher-Statistiken und Nutzerverhalten auf Ihrer Website."
            verbunden={!!firma?.hat_google_analytics}
            hinweis="Google Analytics wird durch Ihr MeisterFlow-Team eingerichtet."
          />
          <VerbindungsKarte
            icon={Search}
            titel="Google Search Console"
            beschreibung="Suchranking, Klicks und indexierte Seiten."
            verbunden={!!firma?.hat_search_console}
            hinweis="Die Search Console wird durch Ihr MeisterFlow-Team eingerichtet."
          />
        </div>
      </div>

      <Card className="p-5 bg-accent/40 border-accent">
        <p className="text-sm text-accent-foreground font-medium mb-1">Möchten Sie etwas ändern?</p>
        <p className="text-sm text-muted-foreground">
          Für Änderungen an SEO-Einstellungen, Google-Verbindungen oder Weiteres erstellen Sie eine Änderungsanfrage im Tab <strong>Änderungsanfragen</strong>.
        </p>
      </Card>
    </div>
  );
}
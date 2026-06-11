import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageSquare, Building2 } from "lucide-react";
import { formatDatum } from "@/lib/format";
import Sterne from "./Sterne";

const PLATTFORM_LABEL = { google: "Google", facebook: "Facebook", trustpilot: "Trustpilot", intern: "Intern" };

export default function NeuesteBewertungen({ bewertungen, firma }) {
  const neueste = bewertungen
    .filter(b => b.sterne && (b.status === "erhalten" || b.status === "beantwortet"))
    .sort((a, b) => new Date(b.bewertungs_datum || b.created_date) - new Date(a.bewertungs_datum || a.created_date))
    .slice(0, 10);

  return (
    <div>
      <h2 className="font-heading font-bold text-lg text-foreground mb-4">Neueste Bewertungen</h2>
      {neueste.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-sm">Noch keine Bewertungen erhalten.</Card>
      ) : (
        <div className="space-y-3">
          {neueste.map(b => (
            <Card key={b.id} className="p-5">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Sterne anzahl={b.sterne} />
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      {PLATTFORM_LABEL[b.plattform || b.typ] || "Google"}
                    </span>
                  </div>
                  {b.kunde_name && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5" /> {b.kunde_name}
                    </div>
                  )}
                  {b.kommentar && (
                    <p className="text-sm text-foreground italic">«{b.kommentar}»</p>
                  )}
                  {b.antwort && (
                    <div className="mt-2 pl-3 border-l-2 border-primary/30">
                      <p className="text-xs text-muted-foreground font-medium mb-0.5">Ihre Antwort:</p>
                      <p className="text-sm text-muted-foreground">{b.antwort}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDatum(b.bewertungs_datum || b.created_date)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {firma?.google_bewertungslink && (
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <a href={firma.google_bewertungslink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  {b.antwort && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
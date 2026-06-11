import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, CheckCircle2, XCircle, QrCode } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Sterne from "./Sterne";

export default function GoogleProfilKarte({ firma, bewertungen }) {
  const { toast } = useToast();

  const googleBewertungen = bewertungen.filter(b => (b.plattform === "google" || b.typ === "google") && b.sterne);
  const durchschnitt = googleBewertungen.length
    ? (googleBewertungen.reduce((s, b) => s + b.sterne, 0) / googleBewertungen.length).toFixed(1)
    : null;

  const letzteErhaltene = bewertungen
    .filter(b => (b.plattform === "google" || b.typ === "google") && (b.status === "erhalten" || b.status === "beantwortet"))
    .sort((a, b) => new Date(b.bewertungs_datum || b.created_date) - new Date(a.bewertungs_datum || a.created_date))[0];

  const bewertungsLink = firma?.google_bewertungslink || "";
  const verbunden = !!firma?.google_verbunden;

  const copyLink = () => {
    if (!bewertungsLink) return;
    navigator.clipboard.writeText(bewertungsLink);
    toast({ title: "Link kopiert!" });
  };

  const downloadQr = () => {
    if (!bewertungsLink) return;
    const encoded = encodeURIComponent(bewertungsLink);
    // Swiss QR Code Generator (qrcode.swiss / API)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}&format=png`;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = "google-bewertung-qr.png";
    a.target = "_blank";
    a.click();
    toast({ title: "QR-Code wird heruntergeladen" });
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#4285F4]/10 flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <h2 className="font-heading font-bold text-lg text-foreground">Google Unternehmensprofil</h2>
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-medium ${verbunden ? "text-emerald-600" : "text-slate-400"}`}>
            {verbunden ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {verbunden ? "Verbunden" : "Nicht verbunden"}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {bewertungsLink && (
            <Button variant="outline" size="sm" asChild>
              <a href={bewertungsLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1.5" /> Profil öffnen
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={copyLink} disabled={!bewertungsLink}>
            <Copy className="w-4 h-4 mr-1.5" /> Link kopieren
          </Button>
          <Button variant="outline" size="sm" onClick={downloadQr} disabled={!bewertungsLink}>
            <QrCode className="w-4 h-4 mr-1.5" /> QR-Code
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-foreground">{durchschnitt ?? "–"}</div>
          <div className="flex justify-center mt-1">
            <Sterne anzahl={Math.round(parseFloat(durchschnitt) || 0)} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">Ø Bewertung</div>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-foreground">{googleBewertungen.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Bewertungen</div>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 text-center col-span-2">
          <div className="text-xs text-muted-foreground mb-2">Letzte Bewertung</div>
          {letzteErhaltene ? (
            <>
              <Sterne anzahl={letzteErhaltene.sterne} />
              {letzteErhaltene.kunde_name && (
                <div className="text-sm font-medium text-foreground mt-1 truncate">{letzteErhaltene.kunde_name}</div>
              )}
              {letzteErhaltene.kommentar && (
                <div className="text-xs text-muted-foreground italic mt-1 line-clamp-2">«{letzteErhaltene.kommentar}»</div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">–</div>
          )}
        </div>
      </div>
    </Card>
  );
}
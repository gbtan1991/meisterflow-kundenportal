import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Link } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function BewertungslinkKarte({ firma }) {
  const { toast } = useToast();
  const link = firma?.google_bewertungslink || "";

  const copy = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast({ title: "Bewertungslink kopiert!" });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Link className="w-4 h-4 text-primary" />
        </div>
        <h2 className="font-heading font-bold text-lg text-foreground">Ihr Bewertungslink</h2>
      </div>
      {link ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
            <span className="text-sm text-foreground truncate flex-1 font-mono">{link}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={copy}>
              <Copy className="w-4 h-4 mr-1.5" /> Link kopieren
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <a href={link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1.5" /> Link öffnen
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Kein Bewertungslink hinterlegt. Bitte ergänzen Sie diesen unter <strong>Firma → Einstellungen</strong>.
        </p>
      )}
    </Card>
  );
}
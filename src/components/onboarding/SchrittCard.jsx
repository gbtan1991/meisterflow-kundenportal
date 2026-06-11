import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

export default function SchrittCard({
  titel,
  untertitel,
  icon: Icon,
  kinder,
  onWeiter,
  onZurueck,
  weiterText = "Weiter",
  weiterDisabled = false,
  saving = false,
  ueberspringen = false,
  onUeberspringen,
}) {
  return (
    <Card className="shadow-lg">
      <div className="p-6 md:p-8 border-b border-border">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
              {titel}
            </h2>
            {untertitel && (
              <p className="text-muted-foreground mt-1">{untertitel}</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-5">{kinder}</div>

      <div className="px-6 md:px-8 pb-6 md:pb-8 flex items-center justify-between gap-3">
        <div>
          {onZurueck && (
            <Button type="button" variant="outline" onClick={onZurueck}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Zurück
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {ueberspringen && (
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground"
              onClick={onUeberspringen}
            >
              Überspringen
            </Button>
          )}
          <Button
            onClick={onWeiter}
            disabled={weiterDisabled || saving}
            className="min-w-[120px]"
          >
            {saving ? "Speichern…" : weiterText}
            {!saving && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}
import React from "react";
import { cn } from "@/lib/utils";

const BLAU = "bg-blue-50 text-blue-700 border-blue-200";
const GRUEN = "bg-emerald-50 text-emerald-700 border-emerald-200";
const GELB = "bg-amber-50 text-amber-700 border-amber-200";
const ROT = "bg-red-50 text-red-600 border-red-200";
const GRAU = "bg-slate-100 text-slate-500 border-slate-200";
const VIOLETT = "bg-violet-50 text-violet-700 border-violet-200";

export const STATUS_CONFIG = {
  neu: { label: "Neu", className: BLAU },
  in_bearbeitung: { label: "In Bearbeitung", className: GELB },
  offeriert: { label: "Offeriert", className: VIOLETT },
  gewonnen: { label: "Gewonnen", className: GRUEN },
  verloren: { label: "Verloren", className: GRAU },
  geplant: { label: "Geplant", className: BLAU },
  bestaetigt: { label: "Bestätigt", className: GRUEN },
  abgeschlossen: { label: "Abgeschlossen", className: GRAU },
  abgesagt: { label: "Abgesagt", className: ROT },
  angefragt: { label: "Angefragt", className: GELB },
  erhalten: { label: "Erhalten", className: GRUEN },
  beantwortet: { label: "Beantwortet", className: BLAU },
  entwurf: { label: "Entwurf", className: GRAU },
  gesendet: { label: "Gesendet", className: BLAU },
  akzeptiert: { label: "Akzeptiert", className: GRUEN },
  abgelehnt: { label: "Abgelehnt", className: ROT },
  offen: { label: "Offen", className: GELB },
  bezahlt: { label: "Bezahlt", className: GRUEN },
  ueberfaellig: { label: "Überfällig", className: ROT },
  storniert: { label: "Storniert", className: GRAU },
  aktiv: { label: "Aktiv", className: GRUEN },
  inaktiv: { label: "Inaktiv", className: GRAU },
};

export default function StatusBadge({ status, className }) {
  const cfg = STATUS_CONFIG[status] || { label: status, className: GRAU };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        cfg.className,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}
import { format } from "date-fns";

export const formatCHF = (n) =>
  `CHF ${(n ?? 0).toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDatum = (d) => (d ? format(new Date(d), "dd.MM.yyyy") : "–");

export const kundeName = (k) =>
  k ? k.firma || `${k.vorname || ""} ${k.nachname || ""}`.trim() : "";
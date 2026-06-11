import React from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { formatCHF } from "@/lib/format";
import { isThisMonth } from "date-fns";

export default function OffertenOverview({ offerten }) {
  const openOfferten = offerten.filter(o => o.status !== "akzeptiert" && o.status !== "abgelehnt");
  const thisMonthOfferten = offerten.filter(o => isThisMonth(new Date(o.datum)));
  
  const openSum = openOfferten.reduce((sum, o) => sum + ((o.betrag_einmalig || 0) + (o.betrag_monatlich || 0)), 0);
  const acceptedThisMonth = thisMonthOfferten.filter(o => o.status === "akzeptiert").length;
  const sentThisMonth = thisMonthOfferten.filter(o => ["gesendet", "akzeptiert"].includes(o.status)).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Offene Offerten</p>
            <p className="text-lg font-bold text-foreground mt-1">{formatCHF(openSum)}</p>
            <p className="text-xs text-muted-foreground mt-1">{openOfferten.length} Offerte{openOfferten.length !== 1 ? "n" : ""}</p>
          </div>
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Diesen Monat versendet</p>
            <p className="text-lg font-bold text-foreground mt-1">{sentThisMonth}</p>
            <p className="text-xs text-muted-foreground mt-1">von {thisMonthOfferten.length}</p>
          </div>
          <Clock className="w-4 h-4 text-blue-500 shrink-0" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Akzeptiert d. M.</p>
            <p className="text-lg font-bold text-foreground mt-1">{acceptedThisMonth}</p>
            <p className="text-xs text-muted-foreground mt-1">Offerte{acceptedThisMonth !== 1 ? "n" : ""}</p>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        </div>
      </Card>
    </div>
  );
}
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import RechnungDialog from "@/components/forms/RechnungDialog";
import { formatCHF, formatDatum } from "@/lib/format";
import { Plus, Building2, CalendarDays, Trash2, Zap, FileDown, Mail, CreditCard, ExternalLink } from "lucide-react";
import { generateProfessionalRechnung } from "@/lib/generateProfessionalRechnung";
import EmailSendenDialog from "@/components/forms/EmailSendenDialog";

const STATUS_LABELS = {
  offen: "Offen",
  bezahlt: "Bezahlt",
  ueberfaellig: "Überfällig",
  storniert: "Storniert",
};

export default function Rechnungen() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("alle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emailRechnung, setEmailRechnung] = useState(null);
  const qc = useQueryClient();

  const { data: rechnungen = [] } = useQuery({
    queryKey: ["rechnungen"],
    queryFn: () => base44.entities.Rechnung.list("-created_date", 500),
  });

  const { data: firma } = useQuery({
    queryKey: ["firma"],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return null;
      const firmen = await base44.entities.Firma.filter({ user_id: user.id });
      return firmen[0];
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Rechnung.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rechnungen"] }),
  });
  const remove = useMutation({
    mutationFn: (id) => base44.entities.Rechnung.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rechnungen"] }),
  });

  const handleDownloadPDF = (rechnung) => {
    const doc = generateProfessionalRechnung(rechnung, firma);
    doc.save(`${rechnung.nummer}.pdf`);
  };

  const filtered = statusFilter === "alle" ? rechnungen : rechnungen.filter((r) => r.status === statusFilter);
  const offenerBetrag = rechnungen
    .filter((r) => ["offen", "ueberfaellig"].includes(r.status))
    .reduce((s, r) => s + (r.betrag || 0), 0);

  return (
    <div>
      <PageHeader
        title="Rechnungen"
        subtitle={`${rechnungen.length} Rechnungen · ${formatCHF(offenerBetrag)} offen`}
      >
        <div className="w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => navigate("/rechnungen/erstellen")} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-1.5" /> Neue Rechnung
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground text-sm">Keine Rechnungen gefunden.</Card>
        )}
        {filtered.map((r) => (
          <Card key={r.id} className="p-4 md:p-5 hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-3 md:gap-4">
              {/* Mobile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:hidden">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground">{r.nummer}</span>
                  <StatusBadge status={r.status} />
                </div>
                <span className="font-heading font-extrabold text-base text-foreground">
                  {formatCHF(r.betrag)}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="hidden md:flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm text-muted-foreground">{r.nummer}</span>
                    <StatusBadge status={r.status} />
                    {r.automatisch && (
                      <Badge variant="outline" className="font-normal text-primary border-primary/30">
                        <Zap className="w-3 h-3 mr-1" /> Automatisch
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-foreground text-sm md:text-base">
                    <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{r.kunde_name || r.titel}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-1 sm:gap-x-4 sm:gap-y-1 text-xs md:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 flex-shrink-0" /> {formatDatum(r.datum)}
                    </span>
                    <span>Fällig am {formatDatum(r.faellig_am)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-2 shrink-0">
                  <span className="font-heading font-extrabold text-lg text-foreground min-w-fit">
                    {formatCHF(r.betrag)}
                  </span>
                  <Select
                    value={r.status}
                    onValueChange={(status) => update.mutate({ id: r.id, data: { status } })}
                  >
                    <SelectTrigger className="w-32">
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
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => handleDownloadPDF(r)}
                    title="PDF herunterladen"
                  >
                    <FileDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => setEmailRechnung(r)}
                    title="Per E-Mail senden"
                  >
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-emerald-600"
                    title="Zahlungslink öffnen"
                    onClick={() => {
                      const link = firma?.stripe_zahlungslink;
                      if (link) {
                        window.open(link, "_blank");
                      } else {
                        window.open("https://dashboard.stripe.com/register", "_blank");
                      }
                    }}
                  >
                    <CreditCard className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => remove.mutate(r.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Mobile Actions */}
                <div className="md:hidden flex gap-2 pt-2 border-t">
                  <Select
                    value={r.status}
                    onValueChange={(status) => update.mutate({ id: r.id, data: { status } })}
                  >
                    <SelectTrigger className="flex-1 text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary h-8 w-8"
                    onClick={() => handleDownloadPDF(r)}
                    title="PDF"
                  >
                    <FileDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary h-8 w-8"
                    onClick={() => setEmailRechnung(r)}
                    title="E-Mail"
                  >
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-emerald-600 h-8 w-8"
                    title="Zahlungslink"
                    onClick={() => {
                      const link = firma?.stripe_zahlungslink;
                      if (link) {
                        window.open(link, "_blank");
                      } else {
                        window.open("https://dashboard.stripe.com/register", "_blank");
                      }
                    }}
                  >
                    <CreditCard className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                    onClick={() => remove.mutate(r.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>


      <EmailSendenDialog
        open={!!emailRechnung}
        onOpenChange={(o) => { if (!o) setEmailRechnung(null); }}
        empfaenger={emailRechnung?.kunde_name}
        betreff={`Rechnung ${emailRechnung?.nummer}`}
        nachricht={`Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie die Rechnung ${emailRechnung?.nummer}.\n\nMit freundlichen Grüssen`}
        pdfGenerator={emailRechnung ? () => generateProfessionalRechnung(emailRechnung, firma) : null}
        pdfFilename={emailRechnung ? `${emailRechnung.nummer}.pdf` : ""}
        dokumentTyp="Rechnung"
      />
    </div>
  );
}
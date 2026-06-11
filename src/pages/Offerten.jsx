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
import OfferteDialog from "@/components/forms/OfferteDialog";
import OffertenOverview from "@/components/offerten/OffertenOverview";
import { formatCHF, formatDatum } from "@/lib/format";
import { Plus, Building2, CalendarDays, CreditCard, Trash2, Receipt, FileText, Download, Mail } from "lucide-react";
import EmailSendenDialog from "@/components/forms/EmailSendenDialog";
import { format, addDays } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import OfferteEditDialog from "@/components/forms/OfferteEditDialog";
import PDFPreviewModal from "@/components/PDFPreviewModal";
import { generateProfessionalOfferte } from "@/lib/generateProfessionalOfferte";

const STATUS_LABELS = {
  entwurf: "Entwurf",
  gesendet: "Gesendet",
  akzeptiert: "Akzeptiert",
  abgelehnt: "Abgelehnt",
};

export default function Offerten() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("alle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOfferte, setEditOfferte] = useState(null);
  const [previewOfferte, setPreviewOfferte] = useState(null);
  const [emailOfferte, setEmailOfferte] = useState(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: firma } = useQuery({
    queryKey: ["firma"],
    queryFn: () => base44.entities.Firma.list("-created_date", 1),
  });

  const generateOffertePDF = (offerte) => {
    return generateProfessionalOfferte(offerte, firma?.[0]);
  };

  const downloadPDF = (offerte, e) => {
    e.stopPropagation();
    const doc = generateOffertePDF(offerte);
    doc.save(`Offerte-${offerte.nummer}.pdf`);
    toast({ title: "PDF heruntergeladen" });
  };

  const { data: offerten = [] } = useQuery({
    queryKey: ["offerten"],
    queryFn: () => base44.entities.Offerte.list("-created_date", 500),
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Offerte.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["offerten"] }),
  });
  const remove = useMutation({
    mutationFn: (id) => base44.entities.Offerte.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["offerten"] }),
  });
  const umwandeln = useMutation({
    mutationFn: async (o) => {
      const rechnungen = await base44.entities.Rechnung.list("-created_date", 500);
      const jahr = new Date().getFullYear();
      const nummer = `RE-${jahr}-${String(rechnungen.length + 1).padStart(4, "0")}`;
      return base44.entities.Rechnung.create({
        nummer,
        titel: o.titel,
        kunde_id: o.kunde_id,
        kunde_name: o.kunde_name,
        datum: format(new Date(), "yyyy-MM-dd"),
        faellig_am: format(addDays(new Date(), 30), "yyyy-MM-dd"),
        betrag: (o.betrag_einmalig || 0) + (o.betrag_monatlich || 0),
        status: "offen",
        automatisch: true,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rechnungen"] }),
  });

  const filtered = statusFilter === "alle" ? offerten : offerten.filter((o) => o.status === statusFilter);

  return (
    <div>
      <PageHeader title="Offerten" subtitle={`${offerten.length} Offerten insgesamt`}>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => navigate("/offerten/erstellen")}>
          <Plus className="w-4 h-4 mr-1.5" /> Neue Offerte
        </Button>
      </PageHeader>

      <OffertenOverview offerten={offerten} />

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground text-sm">Keine Offerten gefunden.</Card>
        )}
        {filtered.map((o) => (
          <Card key={o.id} className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setEditOfferte(o)}>
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-sm text-muted-foreground">{o.nummer}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  {o.kunde_name || o.titel}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" /> {formatDatum(o.datum)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" /> {formatCHF(o.betrag_einmalig)} + {formatCHF(o.betrag_monatlich)}/Mt.
                  </span>
                  {o.gueltig_bis && (
                    <span className="text-xs font-medium text-amber-600">
                      Gültig bis {formatDatum(o.gueltig_bis)}
                    </span>
                  )}
                </div>
                {o.leistungen?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {o.leistungen.slice(0, 4).map((l) => (
                      <Badge key={l} variant="outline" className="font-normal">{l}</Badge>
                    ))}
                    {o.leistungen.length > 4 && (
                      <Badge variant="outline" className="font-normal">+{o.leistungen.length - 4} weitere</Badge>
                    )}
                  </div>
                )}
                {o.notiz && (
                  <p className="text-xs text-muted-foreground italic">Notiz: {o.notiz}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 lg:items-end shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <Select
                    value={o.status}
                    onValueChange={(status) => update.mutate({ id: o.id, data: { status } })}
                  >
                    <SelectTrigger className="w-36">
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
                    className="text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); remove.mutate(o.id); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={(e) => { e.stopPropagation(); setPreviewOfferte(o); }} title="PDF öffnen">
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={(e) => downloadPDF(o, e)} title="PDF herunterladen">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); setEmailOfferte(o); }} title="Per E-Mail senden">
                    <Mail className="w-4 h-4" />
                  </Button>
                </div>
                {o.status === "akzeptiert" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    disabled={umwandeln.isPending}
                    onClick={(e) => { e.stopPropagation(); umwandeln.mutate(o); }}
                  >
                    <Receipt className="w-4 h-4 mr-1.5" /> In Rechnung umwandeln
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <OfferteDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <OfferteEditDialog
        offerte={editOfferte}
        open={!!editOfferte}
        onOpenChange={(o) => { if (!o) setEditOfferte(null); }}
      />
      <PDFPreviewModal
        open={!!previewOfferte}
        onOpenChange={(o) => { if (!o) setPreviewOfferte(null); }}
        pdfDoc={previewOfferte ? generateOffertePDF(previewOfferte) : null}
        filename={previewOfferte ? `Offerte-${previewOfferte.nummer}.pdf` : ""}
      />
      <EmailSendenDialog
        open={!!emailOfferte}
        onOpenChange={(o) => { if (!o) setEmailOfferte(null); }}
        empfaenger={emailOfferte?.kunde_name}
        betreff={`Offerte ${emailOfferte?.nummer}`}
        nachricht={`Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie die Offerte ${emailOfferte?.nummer}.\n\nMit freundlichen Grüssen`}
        pdfGenerator={emailOfferte ? () => generateOffertePDF(emailOfferte) : null}
        pdfFilename={emailOfferte ? `Offerte-${emailOfferte.nummer}.pdf` : ""}
        dokumentTyp="Offerte"
      />
    </div>
  );
}
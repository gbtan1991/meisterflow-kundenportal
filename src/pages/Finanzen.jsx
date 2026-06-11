import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { formatCHF, formatDatum } from "@/lib/format";
import {
  LayoutDashboard, FileText, Receipt, CreditCard, ArrowDownCircle,
  Bell, Percent, BarChart3, Package, Settings, Plus, Building2,
  CalendarDays, Trash2, Zap, FileDown, Mail, Download, ThumbsUp,
} from "lucide-react";
import { generateProfessionalRechnung } from "@/lib/generateProfessionalRechnung";
import { generateProfessionalOfferte } from "@/lib/generateProfessionalOfferte";
import EmailSendenDialog from "@/components/forms/EmailSendenDialog";
import RechnungDialog from "@/components/forms/RechnungDialog";
import OfferteDialog from "@/components/forms/OfferteDialog";
import OfferteEditDialog from "@/components/forms/OfferteEditDialog";
import PDFPreviewModal from "@/components/PDFPreviewModal";
import OffertenOverview from "@/components/offerten/OffertenOverview";
import FinanzenDashboard from "@/pages/finanzen/FinanzenDashboard";
import FinanzenMahnungen from "@/pages/finanzen/FinanzenMahnungen";
import FinanzenBerichte from "@/pages/finanzen/FinanzenBerichte";
import FinanzenZahlungen from "@/pages/finanzen/FinanzenZahlungen";
import FinanzenPlaceholder from "@/pages/finanzen/FinanzenPlaceholder";
import { format, addDays } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "offerten", label: "Offerten", icon: FileText },
  { id: "rechnungen", label: "Rechnungen", icon: Receipt },
  { id: "zahlungen", label: "Zahlungen", icon: CreditCard },
  { id: "mahnungen", label: "Mahnungen", icon: Bell },
  { id: "berichte", label: "Berichte", icon: BarChart3 },
  { id: "auszahlungen", label: "Auszahlungen", icon: ArrowDownCircle },
  { id: "gebuehren", label: "Gebühren", icon: Percent },
  { id: "abonnemente", label: "Abonnemente", icon: Package },
  { id: "einstellungen", label: "Einstellungen", icon: Settings },
];

const RECHNUNG_STATUS = { offen: "Offen", bezahlt: "Bezahlt", ueberfaellig: "Überfällig", storniert: "Storniert" };
const OFFERTE_STATUS = { entwurf: "Entwurf", gesendet: "Gesendet", akzeptiert: "Akzeptiert", abgelehnt: "Abgelehnt" };

export default function Finanzen() {
  const [tab, setTab] = useState("dashboard");
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Shared data
  const { data: firma } = useQuery({
    queryKey: ["firma"],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return null;
      const firmen = await base44.entities.Firma.filter({ user_id: user.id });
      return firmen[0];
    },
  });
  const { data: rechnungen = [] } = useQuery({
    queryKey: ["rechnungen"],
    queryFn: () => base44.entities.Rechnung.list("-created_date", 500),
  });
  const { data: offerten = [] } = useQuery({
    queryKey: ["offerten"],
    queryFn: () => base44.entities.Offerte.list("-created_date", 500),
  });

  // Rechnungen state
  const [statusFilterR, setStatusFilterR] = useState("alle");
  const [emailRechnung, setEmailRechnung] = useState(null);
  const [rechnungDialogOpen, setRechnungDialogOpen] = useState(false);

  // Offerten state
  const [statusFilterO, setStatusFilterO] = useState("alle");
  const [offerteDialogOpen, setOfferteDialogOpen] = useState(false);
  const [editOfferte, setEditOfferte] = useState(null);
  const [previewOfferte, setPreviewOfferte] = useState(null);
  const [emailOfferte, setEmailOfferte] = useState(null);

  // Mutations Rechnungen
  const updateR = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Rechnung.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rechnungen"] }),
  });
  const removeR = useMutation({
    mutationFn: (id) => base44.entities.Rechnung.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rechnungen"] }),
  });

  // Mutations Offerten
  const updateO = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Offerte.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["offerten"] }),
  });
  const removeO = useMutation({
    mutationFn: (id) => base44.entities.Offerte.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["offerten"] }),
  });
  const umwandeln = useMutation({
    mutationFn: async (o) => {
      const jahr = new Date().getFullYear();
      const nummer = `RE-${jahr}-${String(rechnungen.length + 1).padStart(4, "0")}`;
      return base44.entities.Rechnung.create({
        nummer, titel: o.titel, kunde_id: o.kunde_id, kunde_name: o.kunde_name,
        datum: format(new Date(), "yyyy-MM-dd"),
        faellig_am: format(addDays(new Date(), 30), "yyyy-MM-dd"),
        betrag: (o.betrag_einmalig || 0) + (o.betrag_monatlich || 0),
        status: "offen", automatisch: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rechnungen"] });
      toast({ title: "Rechnung erstellt", description: "Offerte wurde erfolgreich umgewandelt." });
    },
  });

  const handleDownloadPDF = (rechnung) => {
    const doc = generateProfessionalRechnung(rechnung, firma);
    doc.save(`${rechnung.nummer}.pdf`);
  };
  const generateOffertePDF = (offerte) => generateProfessionalOfferte(offerte, firma);
  const downloadOffertePDF = (offerte, e) => {
    e?.stopPropagation();
    const doc = generateOffertePDF(offerte);
    doc.save(`Offerte-${offerte.nummer}.pdf`);
    toast({ title: "PDF heruntergeladen" });
  };

  const filteredR = statusFilterR === "alle" ? rechnungen : rechnungen.filter((r) => r.status === statusFilterR);
  const filteredO = statusFilterO === "alle" ? offerten : offerten.filter((o) => o.status === statusFilterO);
  const offenerBetrag = rechnungen.filter((r) => ["offen", "ueberfaellig"].includes(r.status)).reduce((s, r) => s + (r.betrag || 0), 0);

  const renderTab = () => {
    switch (tab) {
      case "dashboard": return <FinanzenDashboard />;
      case "zahlungen": return <FinanzenZahlungen />;
      case "mahnungen": return <FinanzenMahnungen />;
      case "berichte": return <FinanzenBerichte />;

      case "offerten": return (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <Select value={statusFilterO} onValueChange={setStatusFilterO}>
              <SelectTrigger className="w-40 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle Status</SelectItem>
                {Object.entries(OFFERTE_STATUS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => navigate("/offerten/erstellen")}>
              <Plus className="w-4 h-4 mr-1.5" /> Neue Offerte
            </Button>
          </div>
          <OffertenOverview offerten={offerten} />
          <div className="space-y-3">
            {filteredO.length === 0 && <Card className="p-10 text-center text-muted-foreground text-sm">Keine Offerten gefunden.</Card>}
            {filteredO.map((o) => (
              <Card key={o.id} className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setEditOfferte(o)}>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm text-muted-foreground">{o.nummer}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <Building2 className="w-4 h-4 text-muted-foreground" />{o.kunde_name || o.titel}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{formatDatum(o.datum)}</span>
                      <span>{formatCHF(o.betrag_einmalig)} + {formatCHF(o.betrag_monatlich)}/Mt.</span>
                      {o.gueltig_bis && <span className="text-xs font-medium text-amber-600">Gültig bis {formatDatum(o.gueltig_bis)}</span>}
                    </div>
                    {o.leistungen?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {o.leistungen.slice(0, 4).map((l) => <Badge key={l} variant="outline" className="font-normal">{l}</Badge>)}
                        {o.leistungen.length > 4 && <Badge variant="outline" className="font-normal">+{o.leistungen.length - 4} weitere</Badge>}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 lg:items-end shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Select value={o.status} onValueChange={(status) => updateO.mutate({ id: o.id, data: { status } })}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(OFFERTE_STATUS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeO.mutate(o.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={(e) => { e.stopPropagation(); setPreviewOfferte(o); }}><FileText className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={(e) => downloadOffertePDF(o, e)}><Download className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); setEmailOfferte(o); }}><Mail className="w-4 h-4" /></Button>
                    </div>
                    {o.status === "akzeptiert" && (
                      <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" disabled={umwandeln.isPending} onClick={(e) => { e.stopPropagation(); umwandeln.mutate(o); }}>
                        <Receipt className="w-4 h-4 mr-1.5" /> In Rechnung umwandeln
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <OfferteDialog open={offerteDialogOpen} onOpenChange={setOfferteDialogOpen} />
          <OfferteEditDialog offerte={editOfferte} open={!!editOfferte} onOpenChange={(o) => { if (!o) setEditOfferte(null); }} />
          <PDFPreviewModal open={!!previewOfferte} onOpenChange={(o) => { if (!o) setPreviewOfferte(null); }} pdfDoc={previewOfferte ? generateOffertePDF(previewOfferte) : null} filename={previewOfferte ? `Offerte-${previewOfferte.nummer}.pdf` : ""} />
          <EmailSendenDialog open={!!emailOfferte} onOpenChange={(o) => { if (!o) setEmailOfferte(null); }} empfaenger={emailOfferte?.kunde_name} betreff={`Offerte ${emailOfferte?.nummer}`} nachricht={`Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie die Offerte ${emailOfferte?.nummer}.\n\nMit freundlichen Grüssen`} pdfGenerator={emailOfferte ? () => generateOffertePDF(emailOfferte) : null} pdfFilename={emailOfferte ? `Offerte-${emailOfferte.nummer}.pdf` : ""} dokumentTyp="Offerte" />
        </div>
      );

      case "rechnungen": return (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <Select value={statusFilterR} onValueChange={setStatusFilterR}>
              <SelectTrigger className="w-full sm:w-40 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle Status</SelectItem>
                {Object.entries(RECHNUNG_STATUS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => navigate("/rechnungen/erstellen")} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-1.5" /> Neue Rechnung
            </Button>
          </div>
          <div className="space-y-3">
            {filteredR.length === 0 && <Card className="p-10 text-center text-muted-foreground text-sm">Keine Rechnungen gefunden.</Card>}
            {filteredR.map((r) => (
              <Card key={r.id} className="p-4 md:p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm text-muted-foreground">{r.nummer}</span>
                      <StatusBadge status={r.status} />
                      {r.automatisch && <Badge variant="outline" className="font-normal text-primary border-primary/30"><Zap className="w-3 h-3 mr-1" />Automatisch</Badge>}
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-foreground text-sm md:text-base">
                      <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{r.kunde_name || r.titel}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 flex-shrink-0" />{formatDatum(r.datum)}</span>
                      <span>Fällig am {formatDatum(r.faellig_am)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-heading font-extrabold text-lg text-foreground min-w-fit">{formatCHF(r.betrag)}</span>
                    <Select value={r.status} onValueChange={(status) => updateR.mutate({ id: r.id, data: { status } })}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(RECHNUNG_STATUS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => handleDownloadPDF(r)} title="PDF"><FileDown className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => setEmailRechnung(r)} title="E-Mail"><Mail className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-emerald-600" title="Zahlungslink" onClick={() => { const link = firma?.stripe_zahlungslink; window.open(link || "https://dashboard.stripe.com/register", "_blank"); }}>
                      <CreditCard className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeR.mutate(r.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <RechnungDialog open={rechnungDialogOpen} onOpenChange={setRechnungDialogOpen} />
          <EmailSendenDialog open={!!emailRechnung} onOpenChange={(o) => { if (!o) setEmailRechnung(null); }} empfaenger={emailRechnung?.kunde_name} betreff={`Rechnung ${emailRechnung?.nummer}`} nachricht={`Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie die Rechnung ${emailRechnung?.nummer}.\n\nMit freundlichen Grüssen`} pdfGenerator={emailRechnung ? () => generateProfessionalRechnung(emailRechnung, firma) : null} pdfFilename={emailRechnung ? `${emailRechnung.nummer}.pdf` : ""} dokumentTyp="Rechnung" />
        </div>
      );

      case "auszahlungen": return <FinanzenPlaceholder titel="Auszahlungen" beschreibung="Verwalten Sie Ihre Auszahlungen und Bankkontodaten. Kommt bald." />;
      case "gebuehren": return <FinanzenPlaceholder titel="Gebühren" beschreibung="Übersicht über Plattform- und Transaktionsgebühren. Kommt bald." />;
      case "abonnemente": return <FinanzenPlaceholder titel="Abonnemente" beschreibung="Verwalten Sie Ihr MeisterFlow-Abo und Add-ons. Kommt bald." />;
      case "einstellungen": return <FinanzenPlaceholder titel="Finanz-Einstellungen" beschreibung="Zahlungsarten, Auszahlungskonto, Mahnungsregeln und Rechnungslayout. Kommt bald." />;
      default: return null;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">Finanzen</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {rechnungen.length} Rechnungen · {offerten.length} Offerten · {formatCHF(offenerBetrag)} offen
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="overflow-x-auto mb-6">
        <div className="flex gap-1 min-w-max border-b border-border pb-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {renderTab()}
    </div>
  );
}
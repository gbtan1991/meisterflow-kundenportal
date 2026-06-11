import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import FormDialog from "./FormDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import PDFPreviewModal from "@/components/PDFPreviewModal";
import { generateProfessionalOfferte } from "@/lib/generateProfessionalOfferte";

const STATUS_LABELS = {
  entwurf: "Entwurf",
  gesendet: "Gesendet",
  akzeptiert: "Akzeptiert",
  abgelehnt: "Abgelehnt",
};

const PROJEKTSTATUS_LABELS = {
  geplant: "Geplant",
  in_bearbeitung: "In Bearbeitung",
  abgeschlossen: "Abgeschlossen",
};

export default function OfferteEditDialog({ offerte, open, onOpenChange }) {
  const [form, setForm] = useState(offerte || {});
  const [errors, setErrors] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: firma } = useQuery({
    queryKey: ["firma"],
    queryFn: () => base44.entities.Firma.list("-created_date", 1),
  });

  const generateOffertePDF = (off) => {
    return generateProfessionalOfferte(off, firma?.[0]);
  };

  const openPreview = () => {
    setPreviewOpen(true);
  };

  const downloadPDF = () => {
    const doc = generateOffertePDF(form);
    doc.save(`Offerte-${form.nummer}.pdf`);
    toast({ title: "PDF heruntergeladen" });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.titel?.trim()) newErrors.titel = "Titel erforderlich";
    if (!form.betrag_einmalig && !form.betrag_monatlich) newErrors.betrag = "Mindestens ein Preis erforderlich";
    if (!form.leistungen || form.leistungen.length === 0) newErrors.leistungen = "Leistungen erforderlich";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const update = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Offerte.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offerten"] });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (offerte) {
      setForm(offerte);
    }
  }, [offerte]);

  const handleSave = () => {
    if (validateForm()) {
      update.mutate({ id: offerte.id, data: form });
    }
  };

  return (
    <FormDialog
      title="Offerte bearbeiten"
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSave}
      isLoading={update.isPending}
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={openPreview} className="flex-1">
            <FileText className="w-4 h-4 mr-1.5" /> Vorschau
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={downloadPDF} className="flex-1">
            <Download className="w-4 h-4 mr-1.5" /> Download
          </Button>
        </div>

        <div>
          <Label>Status</Label>
          <Select value={form.status || "entwurf"} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Gültig bis</Label>
          <Input
            type="date"
            value={form.gueltig_bis || ""}
            onChange={(e) => setForm({ ...form, gueltig_bis: e.target.value })}
          />
        </div>

        <div>
          <Label className={errors.leistungen ? "text-red-600" : ""}>Leistungen *</Label>
          <Textarea
            value={form.leistungen?.join(", ") || ""}
            onChange={(e) => setForm({ ...form, leistungen: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            placeholder="z. B. Website Erstellung, SEO Basis, Hosting"
            className={`min-h-20 ${errors.leistungen ? "border-red-500" : ""}`}
          />
          {errors.leistungen && <p className="text-xs text-red-600 mt-1">{errors.leistungen}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className={errors.betrag ? "text-red-600" : ""}>Einmalig (CHF) *</Label>
            <Input
              type="number"
              min="0"
              step="0.05"
              value={form.betrag_einmalig || ""}
              onChange={(e) => setForm({ ...form, betrag_einmalig: parseFloat(e.target.value) || 0 })}
              className={errors.betrag ? "border-red-500" : ""}
            />
          </div>
          <div>
            <Label>Monatlich (CHF)</Label>
            <Input
              type="number"
              min="0"
              step="0.05"
              value={form.betrag_monatlich || ""}
              onChange={(e) => setForm({ ...form, betrag_monatlich: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
        {errors.betrag && <p className="text-xs text-red-600">{errors.betrag}</p>}

        {form.status === "akzeptiert" && (
          <div>
            <Label>Projektstatus</Label>
            <Select value={form.projektstatus || "geplant"} onValueChange={(v) => setForm({ ...form, projektstatus: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROJEKTSTATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label>Notiz (optional)</Label>
          <Textarea
            placeholder="Interne Notiz zu dieser Offerte..."
            value={form.notiz || ""}
            onChange={(e) => setForm({ ...form, notiz: e.target.value })}
            className="min-h-20"
          />
        </div>
      </div>
      <PDFPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        pdfDoc={previewOpen ? generateOffertePDF(form) : null}
        filename={`Offerte-${form.nummer}.pdf`}
      />
    </FormDialog>
  );
}
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormDialog from "./FormDialog";
import KundeSelect from "./KundeSelect";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

const LEER = { titel: "", kunde_id: "", kunde_name: "", datum: format(new Date(), "yyyy-MM-dd"), betrag_einmalig: 0, betrag_monatlich: 0, status: "entwurf", leistungenText: "", gueltig_bis: "" };

export default function OfferteDialog({ open, onOpenChange, prefill = {} }) {
  const [form, setForm] = useState({ ...LEER, ...prefill });
  const [errors, setErrors] = useState({});
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: offerten = [] } = useQuery({
    queryKey: ["offerten"],
    queryFn: () => base44.entities.Offerte.list("-created_date", 500),
  });

  useEffect(() => {
    if (open) setForm({ ...LEER, ...prefill });
  }, [open]);

  const validateForm = () => {
    const newErrors = {};
    if (!form.titel?.trim()) newErrors.titel = "Titel erforderlich";
    if (!form.kunde_id) newErrors.kunde_id = "Kunde erforderlich";
    if (!form.datum) newErrors.datum = "Datum erforderlich";
    if (!form.betrag_einmalig && !form.betrag_monatlich) newErrors.betrag = "Mindestens ein Preis erforderlich";
    if (!form.leistungenText?.trim()) newErrors.leistungen = "Leistungen erforderlich";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const create = useMutation({
    mutationFn: (f) => {
      const jahr = new Date().getFullYear();
      const nummer = `MF-${jahr}-${String(offerten.length + 1).padStart(4, "0")}`;
      const { leistungenText, ...rest } = f;
      return base44.entities.Offerte.create({
        ...rest,
        nummer,
        leistungen: leistungenText.split(",").map((s) => s.trim()).filter(Boolean),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offerten"] });
      setForm(LEER);
      setErrors({});
      onOpenChange(false);
      toast({ title: "Offerte erstellt" });
    },
  });

  const handleSubmit = () => {
    if (validateForm()) {
      create.mutate(form);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Neue Offerte"
      saving={create.isPending}
      onSubmit={handleSubmit}
    >
      <div className="space-y-3">
        <div>
          <Label className={errors.kunde_id ? "text-red-600" : ""}>Kunde *</Label>
          <KundeSelect
            value={form.kunde_id}
            onChange={(kunde_id, kunde_name) => setForm({ ...form, kunde_id, kunde_name })}
          />
          {errors.kunde_id && <p className="text-xs text-red-600 mt-1">{errors.kunde_id}</p>}
        </div>

        <div>
          <Label className={errors.titel ? "text-red-600" : ""}>Titel *</Label>
          <Input
            value={form.titel}
            onChange={(e) => setForm({ ...form, titel: e.target.value })}
            placeholder="z. B. Website-Paket Komplett"
            className={errors.titel ? "border-red-500" : ""}
          />
          {errors.titel && <p className="text-xs text-red-600 mt-1">{errors.titel}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className={errors.datum ? "text-red-600" : ""}>Datum *</Label>
            <Input
              type="date"
              value={form.datum}
              onChange={(e) => setForm({ ...form, datum: e.target.value })}
              className={errors.datum ? "border-red-500" : ""}
            />
            {errors.datum && <p className="text-xs text-red-600 mt-1">{errors.datum}</p>}
          </div>
          <div>
            <Label>Gültig bis</Label>
            <Input
              type="date"
              value={form.gueltig_bis || ""}
              onChange={(e) => setForm({ ...form, gueltig_bis: e.target.value })}
            />
          </div>
          <div className="col-span-1"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className={errors.betrag ? "text-red-600" : ""}>Einmalig (CHF) *</Label>
            <Input
              type="number"
              min="0"
              step="0.05"
              value={form.betrag_einmalig}
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
              value={form.betrag_monatlich}
              onChange={(e) => setForm({ ...form, betrag_monatlich: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
        {errors.betrag && <p className="text-xs text-red-600">{errors.betrag}</p>}

        <div>
          <Label className={errors.leistungen ? "text-red-600" : ""}>Leistungen (durch Komma getrennt) *</Label>
          <Textarea
            value={form.leistungenText}
            onChange={(e) => setForm({ ...form, leistungenText: e.target.value })}
            placeholder="z. B. Website Erstellung, SEO Basis, Hosting, Wartung"
            className={`min-h-20 ${errors.leistungen ? "border-red-500" : ""}`}
          />
          {errors.leistungen && <p className="text-xs text-red-600 mt-1">{errors.leistungen}</p>}
        </div>
      </div>
    </FormDialog>
  );
}
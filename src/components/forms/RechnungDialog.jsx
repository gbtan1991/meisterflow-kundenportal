import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormDialog from "./FormDialog";
import KundeSelect from "./KundeSelect";
import { format, addDays } from "date-fns";

const LEER = () => ({
  titel: "",
  kunde_id: "",
  kunde_name: "",
  datum: format(new Date(), "yyyy-MM-dd"),
  faellig_am: format(addDays(new Date(), 30), "yyyy-MM-dd"),
  betrag: 0,
  status: "offen",
  automatisch: false,
});

export default function RechnungDialog({ open, onOpenChange }) {
  const [form, setForm] = useState(LEER());
  const qc = useQueryClient();

  const { data: rechnungen = [] } = useQuery({
    queryKey: ["rechnungen"],
    queryFn: () => base44.entities.Rechnung.list("-created_date", 500),
  });

  const create = useMutation({
    mutationFn: (f) => {
      const jahr = new Date().getFullYear();
      const nummer = `RE-${jahr}-${String(rechnungen.length + 1).padStart(4, "0")}`;
      return base44.entities.Rechnung.create({ ...f, nummer });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rechnungen"] });
      setForm(LEER());
      onOpenChange(false);
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Neue Rechnung"
      saving={create.isPending}
      onSubmit={() => create.mutate(form)}
    >
      <div className="space-y-1.5">
        <Label>Kunde</Label>
        <KundeSelect
          value={form.kunde_id}
          onChange={(kunde_id, kunde_name) => setForm({ ...form, kunde_id, kunde_name })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Titel</Label>
        <Input
          value={form.titel}
          onChange={(e) => setForm({ ...form, titel: e.target.value })}
          placeholder="z. B. Monatsabo Juni"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Datum</Label>
          <Input
            type="date"
            value={form.datum}
            onChange={(e) => setForm({ ...form, datum: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Fällig am</Label>
          <Input
            type="date"
            value={form.faellig_am}
            onChange={(e) => setForm({ ...form, faellig_am: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Betrag (CHF)</Label>
          <Input
            type="number"
            min="0"
            step="0.05"
            value={form.betrag}
            onChange={(e) => setForm({ ...form, betrag: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
    </FormDialog>
  );
}
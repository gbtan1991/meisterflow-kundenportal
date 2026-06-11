import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormDialog from "./FormDialog";
import KundeSelect from "./KundeSelect";

export default function AnfrageEditDialog({ anfrage, open, onOpenChange }) {
  const [form, setForm] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (anfrage) setForm({ ...anfrage });
  }, [anfrage]);

  const update = useMutation({
    mutationFn: (d) => base44.entities.Anfrage.update(anfrage.id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anfragen"] });
      onOpenChange(false);
    },
  });

  if (!form) return null;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Anfrage bearbeiten"
      saving={update.isPending}
      onSubmit={() => update.mutate(form)}
    >
      <div className="space-y-1.5">
        <Label>Betreff *</Label>
        <Input
          required
          value={form.betreff}
          onChange={(e) => setForm({ ...form, betreff: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Kunde</Label>
        <KundeSelect
          value={form.kunde_id}
          onChange={(kunde_id, kunde_name) => setForm({ ...form, kunde_id, kunde_name })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Beschreibung</Label>
        <Textarea
          value={form.beschreibung || ""}
          onChange={(e) => setForm({ ...form, beschreibung: e.target.value })}
          className="h-20"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="neu">Neu</SelectItem>
              <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
              <SelectItem value="offeriert">Offeriert</SelectItem>
              <SelectItem value="gewonnen">Gewonnen</SelectItem>
              <SelectItem value="verloren">Verloren</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Herkunft</Label>
          <Select value={form.herkunft} onValueChange={(herkunft) => setForm({ ...form, herkunft })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="telefon">Telefon</SelectItem>
              <SelectItem value="empfehlung">Empfehlung</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="social_media">Soziale Medien</SelectItem>
              <SelectItem value="sonstige">Sonstige</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Nachfassung am</Label>
        <Input
          type="date"
          value={form.nachfassung_datum || ""}
          onChange={(e) => setForm({ ...form, nachfassung_datum: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Notizen</Label>
        <Textarea
          value={form.notizen || ""}
          onChange={(e) => setForm({ ...form, notizen: e.target.value })}
          className="h-16"
        />
      </div>
    </FormDialog>
  );
}
import React, { useState } from "react";
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

const LEER = { betreff: "", beschreibung: "", kunde_id: "", kunde_name: "", status: "neu", herkunft: "website", nachfassung_datum: "", notizen: "" };

export default function AnfrageDialog({ open, onOpenChange }) {
  const [form, setForm] = useState(LEER);
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (d) => base44.entities.Anfrage.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anfragen"] });
      setForm(LEER);
      onOpenChange(false);
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Neue Anfrage"
      saving={create.isPending}
      onSubmit={() => create.mutate(form)}
    >
      <div className="space-y-1.5">
        <Label>Betreff *</Label>
        <Input
          required
          value={form.betreff}
          onChange={(e) => setForm({ ...form, betreff: e.target.value })}
          placeholder="z. B. Anfrage Badsanierung"
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
          value={form.beschreibung}
          onChange={(e) => setForm({ ...form, beschreibung: e.target.value })}
          className="h-20"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Herkunft</Label>
          <Select value={form.herkunft} onValueChange={(herkunft) => setForm({ ...form, herkunft })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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
        <div className="space-y-1.5">
          <Label>Nachfassung am</Label>
          <Input
            type="date"
            value={form.nachfassung_datum}
            onChange={(e) => setForm({ ...form, nachfassung_datum: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notizen</Label>
        <Textarea
          value={form.notizen}
          onChange={(e) => setForm({ ...form, notizen: e.target.value })}
          className="h-16"
        />
      </div>
    </FormDialog>
  );
}
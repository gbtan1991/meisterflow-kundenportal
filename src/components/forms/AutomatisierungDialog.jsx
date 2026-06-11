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

const LEER = { name: "", typ: "email", ausloeser: "", beschreibung: "", aktiv: true };

export default function AutomatisierungDialog({ open, onOpenChange }) {
  const [form, setForm] = useState(LEER);
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (d) => base44.entities.Automatisierung.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automatisierungen"] });
      setForm(LEER);
      onOpenChange(false);
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Neue Automatisierung"
      saving={create.isPending}
      onSubmit={() => create.mutate(form)}
    >
      <div className="space-y-1.5">
        <Label>Name *</Label>
        <Input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="z. B. Willkommens-E-Mail"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Typ</Label>
        <Select value={form.typ} onValueChange={(typ) => setForm({ ...form, typ })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">E-Mail</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="bewertung">Bewertung</SelectItem>
            <SelectItem value="termin">Termin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Auslöser</Label>
        <Input
          value={form.ausloeser}
          onChange={(e) => setForm({ ...form, ausloeser: e.target.value })}
          placeholder="z. B. Neue Anfrage eingegangen"
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
    </FormDialog>
  );
}
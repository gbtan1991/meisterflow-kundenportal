import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormDialog from "./FormDialog";
import KundeSelect from "./KundeSelect";

export default function TerminEditDialog({ termin, open, onOpenChange }) {
  const [form, setForm] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (termin) setForm({ ...termin });
  }, [termin]);

  const update = useMutation({
    mutationFn: (d) => base44.entities.Termin.update(termin.id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["termine"] });
      onOpenChange(false);
    },
  });

  if (!form) return null;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Termin bearbeiten"
      saving={update.isPending}
      onSubmit={() => update.mutate(form)}
    >
      <div className="space-y-1.5">
        <Label>Titel *</Label>
        <Input
          required
          value={form.titel}
          onChange={(e) => setForm({ ...form, titel: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Kunde</Label>
        <KundeSelect
          value={form.kunde_id}
          onChange={(kunde_id, kunde_name) => setForm({ ...form, kunde_id, kunde_name })}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Datum *</Label>
          <Input
            required
            type="date"
            value={form.datum}
            onChange={(e) => setForm({ ...form, datum: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Uhrzeit</Label>
          <Input
            type="time"
            value={form.uhrzeit || ""}
            onChange={(e) => setForm({ ...form, uhrzeit: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Dauer (Min.)</Label>
          <Input
            type="number"
            min="0"
            value={form.dauer_minuten || 60}
            onChange={(e) => setForm({ ...form, dauer_minuten: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Ort</Label>
        <Input
          value={form.ort || ""}
          onChange={(e) => setForm({ ...form, ort: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="geplant">Geplant</SelectItem>
            <SelectItem value="bestaetigt">Bestätigt</SelectItem>
            <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
            <SelectItem value="abgesagt">Abgesagt</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Notizen</Label>
        <Textarea
          value={form.notizen || ""}
          onChange={(e) => setForm({ ...form, notizen: e.target.value })}
          className="h-16"
        />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <Label className="font-normal">Erinnerung aktivieren</Label>
        <Switch
          checked={!!form.erinnerung}
          onCheckedChange={(erinnerung) => setForm({ ...form, erinnerung })}
        />
      </div>
    </FormDialog>
  );
}
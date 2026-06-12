import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import FormDialog from "./FormDialog";
import KundeSelect from "./KundeSelect";

const LEER = { titel: "", kunde_id: "", kunde_name: "", datum: "", uhrzeit: "", dauer_minuten: 60, ort: "", status: "geplant", erinnerung: true, notizen: "" };

export default function TerminDialog({ open, onOpenChange }) {
  const [form, setForm] = useState(LEER);
  const qc = useQueryClient();
  const { toast } = useToast();

  const syncToGoogleCalendar = async (termin) => {
    // Google Calendar sync will be implemented via Supabase Edge Function in next phase
    console.log('Calendar sync pending:', termin.id);
  };

  const create = useMutation({
    mutationFn: async (d) => {
      const { data, error } = await supabase.from('appointments').insert(d).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (newTermin) => {
      qc.invalidateQueries({ queryKey: ["termine"] });
      setForm(LEER);
      onOpenChange(false);
      await syncToGoogleCalendar(newTermin);
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Neuer Termin"
      saving={create.isPending}
      onSubmit={() => create.mutate(form)}
    >
      <div className="space-y-1.5">
        <Label>Titel *</Label>
        <Input
          required
          value={form.titel}
          onChange={(e) => setForm({ ...form, titel: e.target.value })}
          placeholder="z. B. Besichtigung vor Ort"
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
            value={form.uhrzeit}
            onChange={(e) => setForm({ ...form, uhrzeit: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Dauer (Min.)</Label>
          <Input
            type="number"
            min="0"
            value={form.dauer_minuten}
            onChange={(e) => setForm({ ...form, dauer_minuten: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Ort</Label>
        <Input
          value={form.ort}
          onChange={(e) => setForm({ ...form, ort: e.target.value })}
          placeholder="z. B. Beim Kunden vor Ort"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Notizen</Label>
        <Textarea
          value={form.notizen}
          onChange={(e) => setForm({ ...form, notizen: e.target.value })}
          className="h-16"
        />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <Label className="font-normal">Erinnerung aktivieren</Label>
        <Switch
          checked={form.erinnerung}
          onCheckedChange={(erinnerung) => setForm({ ...form, erinnerung })}
        />
      </div>
    </FormDialog>
  );
}
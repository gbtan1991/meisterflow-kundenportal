import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useBusiness } from '@/context/BusinessContext'
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import FormDialog from "./FormDialog";

const LEER = { firma: "", vorname: "", nachname: "", email: "", telefon: "", adresse: "", plz: "", ort: "", status: "aktiv", notizen: "" };

export default function KundeDialog({ open, onOpenChange }) {
  const [form, setForm] = useState(LEER);
  const qc = useQueryClient();
  const { currentBusiness } = useBusiness()

  const create = useMutation({
    mutationFn: async (d) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('customers').insert({
        ...d,
        user_id: user.id,
        business_id: currentBusiness?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kunden"] });
      setForm(LEER);
      onOpenChange(false);
    },
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Neuer Kunde"
      saving={create.isPending}
      onSubmit={() => create.mutate(form)}
    >
      <div className="space-y-1.5">
        <Label>Firma</Label>
        <Input value={form.firma} onChange={set("firma")} placeholder="z. B. Malerbetrieb Huber AG" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Vorname</Label>
          <Input value={form.vorname} onChange={set("vorname")} />
        </div>
        <div className="space-y-1.5">
          <Label>Nachname</Label>
          <Input value={form.nachname} onChange={set("nachname")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>E-Mail</Label>
          <Input type="email" value={form.email} onChange={set("email")} />
        </div>
        <div className="space-y-1.5">
          <Label>Telefon</Label>
          <Input value={form.telefon} onChange={set("telefon")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Adresse</Label>
        <Input value={form.adresse} onChange={set("adresse")} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>PLZ</Label>
          <Input value={form.plz} onChange={set("plz")} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Ort</Label>
          <Input value={form.ort} onChange={set("ort")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notizen</Label>
        <Textarea value={form.notizen} onChange={set("notizen")} className="h-20" />
      </div>
    </FormDialog>
  );
}
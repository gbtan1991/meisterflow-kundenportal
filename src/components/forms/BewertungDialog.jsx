import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
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
import { Star } from "lucide-react";

const LEER = { kunde_id: "", kunde_name: "", typ: "google", sterne: 0, kommentar: "", status: "angefragt" };

export default function BewertungDialog({ open, onOpenChange }) {
  const [form, setForm] = useState(LEER);
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (d) => base44.entities.Bewertung.create({ ...d, sterne: d.sterne || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bewertungen"] });
      setForm(LEER);
      onOpenChange(false);
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Bewertungsanfrage erstellen"
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Typ</Label>
          <Select value={form.typ} onValueChange={(typ) => setForm({ ...form, typ })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google">Google Bewertung</SelectItem>
              <SelectItem value="intern">Internes Feedback</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="angefragt">Angefragt</SelectItem>
              <SelectItem value="erhalten">Erhalten</SelectItem>
              <SelectItem value="beantwortet">Beantwortet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {form.status !== "angefragt" && (
        <>
          <div className="space-y-1.5">
            <Label>Sterne</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setForm({ ...form, sterne: i })}
                  className="p-0.5"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${i <= form.sterne ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Kommentar</Label>
            <Textarea
              value={form.kommentar}
              onChange={(e) => setForm({ ...form, kommentar: e.target.value })}
              className="h-20"
            />
          </div>
        </>
      )}
    </FormDialog>
  );
}
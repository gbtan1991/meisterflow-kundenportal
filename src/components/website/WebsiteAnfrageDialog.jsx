import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const DEFAULT_FORM = { titel: "", beschreibung: "", typ: "anpassung", prioritaet: "mittel" };

export default function WebsiteAnfrageDialog({ open, onOpenChange, user, firma }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [datei, setDatei] = useState(null);
  const [uploading, setUploading] = useState(false);

  const erstellen = useMutation({
    mutationFn: (data) => base44.entities.WebsiteAnfrage.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["website-anfragen"] });
      onOpenChange(false);
      setForm(DEFAULT_FORM);
      setDatei(null);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    let screenshot_url = "";
    if (datei) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: datei });
      screenshot_url = file_url;
    }
    erstellen.mutate({ ...form, screenshot_url, user_id: user?.id, firma_id: firma?.id });
    setUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Neue Änderungsanfrage</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Titel *</Label>
            <Input
              value={form.titel}
              onChange={(e) => setForm({ ...form, titel: e.target.value })}
              placeholder="z. B. Kontaktformular anpassen"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Kategorie</Label>
              <Select value={form.typ} onValueChange={(v) => setForm({ ...form, typ: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="anpassung">Anpassung</SelectItem>
                  <SelectItem value="neues_element">Neues Element</SelectItem>
                  <SelectItem value="fehler">Fehler melden</SelectItem>
                  <SelectItem value="sonstiges">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priorität</Label>
              <Select value={form.prioritaet} onValueChange={(v) => setForm({ ...form, prioritaet: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="niedrig">Niedrig</SelectItem>
                  <SelectItem value="mittel">Mittel</SelectItem>
                  <SelectItem value="hoch">Hoch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Beschreibung</Label>
            <Textarea
              value={form.beschreibung}
              onChange={(e) => setForm({ ...form, beschreibung: e.target.value })}
              placeholder="Beschreiben Sie die gewünschte Änderung möglichst genau…"
              className="h-28"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Anhang / Screenshot (optional)</Label>
            {datei ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/40">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{datei.name}</span>
                <button type="button" onClick={() => setDatei(null)}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Datei, Bild oder Screenshot hochladen</span>
                <input type="file" accept="image/*,.pdf" className="hidden"
                  onChange={(e) => setDatei(e.target.files[0])} />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={!form.titel || uploading || erstellen.isPending}>
              <Send className="w-4 h-4 mr-1.5" />
              {uploading || erstellen.isPending ? "Wird gesendet…" : "Anfrage senden"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
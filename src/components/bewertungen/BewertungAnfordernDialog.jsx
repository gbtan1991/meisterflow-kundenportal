import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import KundeSelect from "@/components/forms/KundeSelect";

const DEFAULT = { kunde_id: "", kunde_name: "", name: "", email: "", telefon: "", nachricht: "" };

export default function BewertungAnfordernDialog({ open, onOpenChange }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState(DEFAULT);

  const { data: kunden = [] } = useQuery({
    queryKey: ["kunden"],
    queryFn: () => base44.entities.Kunde.list("-created_date", 500),
    enabled: open,
  });

  const erstellen = useMutation({
    mutationFn: (data) => base44.entities.Bewertung.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bewertungen"] });
    },
  });

  const handleKundeChange = (kundeId, kundeName) => {
    const kunde = kunden.find(k => k.id === kundeId);
    setForm(f => ({
      ...f,
      kunde_id: kundeId,
      kunde_name: kundeName || "",
      name: kunde ? `${kunde.vorname || ""} ${kunde.nachname || ""}`.trim() : f.name,
      email: kunde?.email || f.email,
      telefon: kunde?.telefon || f.telefon,
    }));
  };

  const handleSend = () => {
    erstellen.mutate({
      ...form,
      plattform: "google",
      typ: "google",
      status: "angefragt",
      versand_datum: format(new Date(), "yyyy-MM-dd"),
    });
    toast({ title: "Bewertungsanfrage gesendet!" });
    onOpenChange(false);
    setForm(DEFAULT);
  };

  const handleSave = () => {
    erstellen.mutate({
      ...form,
      plattform: "google",
      typ: "google",
      status: "angefragt",
      versand_datum: format(new Date(), "yyyy-MM-dd"),
    });
    toast({ title: "Bewertungsanfrage gespeichert!" });
    onOpenChange(false);
    setForm(DEFAULT);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bewertung anfordern</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Kunde auswählen</Label>
            <KundeSelect
              value={form.kunde_id}
              onChange={handleKundeChange}
              kunden={kunden}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Vor- und Nachname" />
          </div>
          <div className="space-y-1.5">
            <Label>E-Mail</Label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@beispiel.ch" />
          </div>
          <div className="space-y-1.5">
            <Label>Telefonnummer</Label>
            <Input value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))} placeholder="+41 79 123 45 67" />
          </div>
          <div className="space-y-1.5">
            <Label>Nachricht</Label>
            <Textarea
              value={form.nachricht}
              onChange={e => setForm(f => ({ ...f, nachricht: e.target.value }))}
              placeholder="Persönliche Nachricht an den Kunden…"
              className="h-24"
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button variant="outline" onClick={handleSave}>
              <Save className="w-4 h-4 mr-1.5" /> Speichern
            </Button>
            <Button onClick={handleSend} disabled={!form.email && !form.telefon}>
              <Send className="w-4 h-4 mr-1.5" /> Senden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
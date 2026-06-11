import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Check, Users, Wrench, DollarSign, MessageSquare } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/components/ui/use-toast";
import DriveUploadButton from "@/components/DriveUploadButton";

const DIENSTLEISTUNGEN = [
  { id: "elektro", name: "Elektroinstallation", beschreibung: "Neue Stromleitungen & Installationen" },
  { id: "sanitaer", name: "Sanitärarbeiten", beschreibung: "Wasser-, Gas- & Abwasserinstallation" },
  { id: "heizung", name: "Heizungsanlage", beschreibung: "Installation & Wartung von Heizungen" },
  { id: "malerarbeiten", name: "Malerarbeiten", beschreibung: "Innen- & Außenanstriche" },
  { id: "reparatur", name: "Reparaturservice", beschreibung: "Notfallreparaturen & Instandhaltung" },
  { id: "beratung", name: "Beratung & Planung", beschreibung: "Fachgerechte Beratung zu Projekten" },
  { id: "wartung", name: "Wartung & Kontrolle", beschreibung: "Regelmäßige Wartung & Inspektionen" },
  { id: "notfalldienst", name: "Notfalldienst", beschreibung: "24/7 Notfallservice" },
];

export default function OfferteErstellen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    kunde_id: "",
    kunde_name: "",
    ansprechpartner: "",
    adresse: "",
    plz: "",
    ort: "",
    telefon: "",
    email: "",
    leistungen: [],
    betrag_einmalig: 0,
    betrag_monatlich: 0,
    bemerkungen: "",
  });

  const [nummer, setNummer] = useState("");
  const [createdOfferteData, setCreatedOfferteData] = useState(null);

  // Kundenliste
  const { data: kunden } = useQuery({
    queryKey: ["kunden"],
    queryFn: () => base44.entities.Kunde.list("-created_date", 100),
  });

  // Nächste Offertennummer generieren
  useEffect(() => {
    const generateNummer = async () => {
      try {
        const offerten = await base44.entities.Offerte.list("-created_date", 1);
        const lastNum = offerten.length > 0 ? offerten[0].nummer : "MF-2026-0000";
        const parts = lastNum.split("-");
        const num = parseInt(parts[2]) + 1;
        setNummer(`MF-${new Date().getFullYear()}-${String(num).padStart(4, "0")}`);
      } catch (e) {
        setNummer(`MF-${new Date().getFullYear()}-0001`);
      }
    };
    generateNummer();
  }, []);

  const handleKundeSelect = (kundeId) => {
    const selected = kunden?.find((k) => k.id === kundeId);
    if (selected) {
      setForm({
        ...form,
        kunde_id: selected.id,
        kunde_name: selected.firma || "",
        ansprechpartner: selected.vorname && selected.nachname ? `${selected.vorname} ${selected.nachname}` : "",
        adresse: selected.adresse || "",
        plz: selected.plz || "",
        ort: selected.ort || "",
        telefon: selected.telefon || "",
        email: selected.email || "",
      });
    }
  };

  const handleDienstleistungToggle = (id) => {
    setForm((prev) => ({
      ...prev,
      leistungen: prev.leistungen.includes(id) ? prev.leistungen.filter((l) => l !== id) : [...prev.leistungen, id],
    }));
  };

  const createOfferte = useMutation({
    mutationFn: (data) => base44.entities.Offerte.create(data),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["offerten"] });
      toast({ title: "Offerte erstellt", description: "Die Offerte wurde erfolgreich erstellt." });
      setCreatedOfferteData(created);
    },
    onError: () => {
      toast({ title: "Fehler", description: "Offerte konnte nicht erstellt werden." });
    },
  });

  const handleOfferttenErstellen = () => {
    if (!form.kunde_name?.trim()) {
      toast({ title: "Fehler", description: "Kundenname erforderlich" });
      return;
    }
    if (form.leistungen.length === 0) {
      toast({ title: "Fehler", description: "Mindestens eine Dienstleistung erforderlich" });
      return;
    }

    createOfferte.mutate({
      nummer: nummer,
      titel: "Offerte",
      kunde_id: form.kunde_id || "manual",
      kunde_name: form.kunde_name,
      datum: new Date().toISOString().split("T")[0],
      betrag_einmalig: parseFloat(form.betrag_einmalig) || 0,
      betrag_monatlich: parseFloat(form.betrag_monatlich) || 0,
      leistungen: form.leistungen.map((id) => DIENSTLEISTUNGEN.find((d) => d.id === id)?.name || id),
      status: "entwurf",
      notiz: form.bemerkungen || "",
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader title="Neue Offerte" subtitle={`Dokumentnummer: ${nummer}`} />

      {/* ===== KUNDENDATEN ===== */}
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" /> Kundendaten
        </h2>

        <div className="mb-4">
          <Label className="text-xs uppercase font-semibold text-muted-foreground">Bestehenden Kunden auswählen</Label>
          <Select value={form.kunde_id} onValueChange={handleKundeSelect}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Kunde suchen..." />
            </SelectTrigger>
            <SelectContent>
              {kunden?.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.firma || `${k.vorname} ${k.nachname}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="firmenname" className="text-sm font-semibold">Firmenname *</Label>
            <Input
              id="firmenname"
              value={form.kunde_name}
              onChange={(e) => setForm({ ...form, kunde_name: e.target.value })}
              placeholder="z.B. Muster AG"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="ansprechpartner" className="text-sm font-semibold">Ansprechpartner *</Label>
            <Input
              id="ansprechpartner"
              value={form.ansprechpartner}
              onChange={(e) => setForm({ ...form, ansprechpartner: e.target.value })}
              placeholder="z.B. Max Muster"
              className="mt-1"
            />
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="adresse" className="text-sm font-semibold">Adresse</Label>
          <Input
            id="adresse"
            value={form.adresse}
            onChange={(e) => setForm({ ...form, adresse: e.target.value })}
            placeholder="z.B. Bahnhofstrasse 1"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="plz" className="text-sm font-semibold">PLZ</Label>
            <Input
              id="plz"
              value={form.plz}
              onChange={(e) => setForm({ ...form, plz: e.target.value })}
              placeholder="z.B. 8000"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="ort" className="text-sm font-semibold">Ort</Label>
            <Input
              id="ort"
              value={form.ort}
              onChange={(e) => setForm({ ...form, ort: e.target.value })}
              placeholder="z.B. Zürich"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="telefon" className="text-sm font-semibold">Telefon</Label>
            <Input
              id="telefon"
              value={form.telefon}
              onChange={(e) => setForm({ ...form, telefon: e.target.value })}
              placeholder="+41 44 123 45 67"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-semibold">E-Mail *</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="info@muster.ch"
            className="mt-1"
          />
        </div>
      </Card>

      {/* ===== DIENSTLEISTUNGEN ===== */}
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Wrench className="w-5 h-5" /> Dienstleistungen
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIENSTLEISTUNGEN.map((dienstleistung) => (
            <div key={dienstleistung.id} className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-slate-50">
              <Checkbox
                id={dienstleistung.id}
                checked={form.leistungen.includes(dienstleistung.id)}
                onCheckedChange={() => handleDienstleistungToggle(dienstleistung.id)}
              />
              <label htmlFor={dienstleistung.id} className="cursor-pointer flex-1">
                <div className="font-semibold text-sm">{dienstleistung.name}</div>
                <div className="text-xs text-muted-foreground">{dienstleistung.beschreibung}</div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* ===== PREISE ===== */}
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" /> Preise
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="einmalig" className="text-sm font-semibold">Einmaliger Betrag (CHF)</Label>
            <Input
              id="einmalig"
              type="number"
              min="0"
              step="0.05"
              value={form.betrag_einmalig}
              onChange={(e) => setForm({ ...form, betrag_einmalig: e.target.value })}
              placeholder="z.B. 2500"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="monatlich" className="text-sm font-semibold">Monatlicher Betrag (CHF)</Label>
            <Input
              id="monatlich"
              type="number"
              min="0"
              step="0.05"
              value={form.betrag_monatlich}
              onChange={(e) => setForm({ ...form, betrag_monatlich: e.target.value })}
              placeholder="z.B. 150"
              className="mt-1"
            />
          </div>
        </div>

        {(form.betrag_einmalig || form.betrag_monatlich) && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <div className="text-sm text-muted-foreground">Geschätzter Gesamtbetrag (inkl. 8.1% MwSt.)</div>
            <div className="text-2xl font-bold">
              CHF {(parseFloat(form.betrag_einmalig || 0) + parseFloat(form.betrag_monatlich || 0) * 1.081).toFixed(2)}
            </div>
          </div>
        )}
      </Card>

      {/* ===== BEMERKUNGEN ===== */}
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" /> Bemerkungen (optional)
        </h2>

        <Textarea
          value={form.bemerkungen}
          onChange={(e) => setForm({ ...form, bemerkungen: e.target.value })}
          placeholder="Zusätzliche Anmerkungen zur Offerte..."
          className="min-h-24"
        />
      </Card>

      {/* ===== BUTTONS ===== */}
      <div className="flex gap-4 sticky bottom-6">
        <Button
          variant="outline"
          onClick={() => navigate("/offerten")}
          className="flex-1"
        >
          Abbrechen
        </Button>
        {createdOfferteData ? (
          <>
            <DriveUploadButton
              folderName="MeisterFlow/Offerten"
              label="In Drive speichern"
              getPdfBase64={async () => {
                // Simple text-based fallback since offerte PDF lib may vary
                const { jsPDF } = await import('jspdf');
                const doc = new jsPDF();
                doc.setFontSize(16);
                doc.text(`Offerte ${createdOfferteData.nummer}`, 20, 20);
                doc.setFontSize(11);
                doc.text(`Kunde: ${createdOfferteData.kunde_name}`, 20, 35);
                doc.text(`Datum: ${createdOfferteData.datum}`, 20, 45);
                doc.text(`Betrag einmalig: CHF ${createdOfferteData.betrag_einmalig?.toFixed(2)}`, 20, 55);
                if (createdOfferteData.betrag_monatlich) {
                  doc.text(`Betrag monatlich: CHF ${createdOfferteData.betrag_monatlich?.toFixed(2)}`, 20, 65);
                }
                const base64 = doc.output('datauristring').split(',')[1];
                return { base64, fileName: `${createdOfferteData.nummer}.pdf` };
              }}
            />
            <Button onClick={() => navigate("/offerten")} className="flex-1 gap-2">
              Fertig
            </Button>
          </>
        ) : (
          <Button
            onClick={handleOfferttenErstellen}
            disabled={createOfferte.isPending}
            className="flex-1 gap-2"
          >
            <FileText className="w-4 h-4" />
            {createOfferte.isPending ? "Wird erstellt..." : "Offerte erstellen"}
          </Button>
        )}
      </div>
    </div>
  );
}
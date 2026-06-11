import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { generateProfessionalRechnung } from "@/lib/generateProfessionalRechnung";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, FileText } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/components/ui/use-toast";
import { format, addDays } from "date-fns";
import DriveUploadButton from "@/components/DriveUploadButton";
import { generateProfessionalRechnung as genRechnung } from "@/lib/generateProfessionalRechnung";

const STATUS_LABELS = {
  offen: "Offen",
  bezahlt: "Bezahlt",
  ueberfaellig: "Überfällig",
  storniert: "Storniert",
};

export default function RechnungErstellen() {
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
    email: "",
    rechnungsdatum: new Date().toISOString().split("T")[0],
    faellig_am: addDays(new Date(), 30).toISOString().split("T")[0],
    status: "offen",
    positionen: [{ beschreibung: "", menge: 1, einzelpreis: 0 }],
    notizen: "",
  });

  const [nummer, setNummer] = useState("");
  const [createdRechnungData, setCreatedRechnungData] = useState(null);

  // Firmadaten für PDF
  const { data: firma } = useQuery({
    queryKey: ["firma"],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return null;
      const firmen = await base44.entities.Firma.filter({ user_id: user.id });
      return firmen[0];
    },
  });

  // Kundenliste
  const { data: kunden } = useQuery({
    queryKey: ["kunden"],
    queryFn: () => base44.entities.Kunde.list("-created_date", 100),
  });

  // Nächste Rechnungsnummer
  useEffect(() => {
    const generateNummer = async () => {
      try {
        const rechnungen = await base44.entities.Rechnung.list("-created_date", 1);
        const lastNum = rechnungen.length > 0 ? rechnungen[0].nummer : "MF-RE-2026-0000";
        const parts = lastNum.split("-");
        const num = parseInt(parts[3]) + 1;
        setNummer(`MF-RE-${new Date().getFullYear()}-${String(num).padStart(4, "0")}`);
      } catch (e) {
        setNummer(`MF-RE-${new Date().getFullYear()}-0001`);
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
        email: selected.email || "",
      });
    }
  };

  const handlePositionChange = (idx, field, value) => {
    const updated = [...form.positionen];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, positionen: updated });
  };

  const addPosition = () => {
    setForm({
      ...form,
      positionen: [...form.positionen, { beschreibung: "", menge: 1, einzelpreis: 0 }],
    });
  };

  const removePosition = (idx) => {
    setForm({
      ...form,
      positionen: form.positionen.filter((_, i) => i !== idx),
    });
  };

  // Berechnung
  const zwischensumme = form.positionen.reduce((sum, p) => sum + (parseFloat(p.menge) || 0) * (parseFloat(p.einzelpreis) || 0), 0);
  const mwst = zwischensumme * 0.081;
  const total = zwischensumme + mwst;

  const createRechnung = useMutation({
    mutationFn: (data) => base44.entities.Rechnung.create(data),
    onSuccess: (createdRechnung) => {
      qc.invalidateQueries({ queryKey: ["rechnungen"] });
      toast({ title: "Rechnung erstellt", description: "Die Rechnung wurde erfolgreich erstellt." });
      setCreatedRechnungData({ rechnung: createdRechnung, positionen: form.positionen });
      // PDF automatisch herunterladen
      setTimeout(() => {
        const doc = generateProfessionalRechnung(createdRechnung, firma, form.positionen);
        doc.save(`${createdRechnung.nummer}.pdf`);
      }, 300);
    },
    onError: () => {
      toast({ title: "Fehler", description: "Rechnung konnte nicht erstellt werden." });
    },
  });

  const handleRechnungErstellen = () => {
    if (!form.kunde_name?.trim()) {
      toast({ title: "Fehler", description: "Kundenname erforderlich" });
      return;
    }
    if (form.positionen.length === 0 || form.positionen.every(p => !p.beschreibung?.trim())) {
      toast({ title: "Fehler", description: "Mindestens eine Position erforderlich" });
      return;
    }

    createRechnung.mutate({
      nummer: nummer,
      titel: `Rechnung für ${form.kunde_name}`,
      kunde_id: form.kunde_id || "manual",
      kunde_name: form.kunde_name,
      datum: form.rechnungsdatum,
      faellig_am: form.faellig_am,
      betrag: total,
      status: form.status,
      notizen: form.notizen || "",
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader title="Neue Rechnung" subtitle={`Nummer: ${nummer}`} />

      {/* ===== RECHNUNGSDETAILS ===== */}
      <Card className="p-4 md:p-6">
        <h2 className="text-base md:text-lg font-bold mb-4">Rechnungsdetails</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div>
            <Label htmlFor="rechnungsdatum" className="text-sm font-semibold">Rechnungsdatum</Label>
            <Input
              id="rechnungsdatum"
              type="date"
              value={form.rechnungsdatum}
              onChange={(e) => setForm({ ...form, rechnungsdatum: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="faellig_am" className="text-sm font-semibold">Fälligkeitsdatum</Label>
            <Input
              id="faellig_am"
              type="date"
              value={form.faellig_am}
              onChange={(e) => setForm({ ...form, faellig_am: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="status" className="text-sm font-semibold">Status</Label>
            <Select value={form.status} onValueChange={(s) => setForm({ ...form, status: s })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* ===== KUNDENDATEN ===== */}
      <Card className="p-4 md:p-6">
        <h2 className="text-base md:text-lg font-bold mb-4">Kundendaten</h2>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
          <div>
            <Label htmlFor="firma" className="text-xs md:text-sm font-semibold">Firma *</Label>
            <Input
              id="firma"
              value={form.kunde_name}
              onChange={(e) => setForm({ ...form, kunde_name: e.target.value })}
              placeholder="z.B. Muster AG"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="ansprechpartner" className="text-sm font-semibold">Ansprechpartner</Label>
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
          <Label htmlFor="adresse" className="text-sm font-semibold">Strasse</Label>
          <Input
            id="adresse"
            value={form.adresse}
            onChange={(e) => setForm({ ...form, adresse: e.target.value })}
            placeholder="z.B. Bahnhofstrasse 1"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div>
            <Label htmlFor="plz" className="text-xs md:text-sm font-semibold">PLZ</Label>
            <Input
              id="plz"
              value={form.plz}
              onChange={(e) => setForm({ ...form, plz: e.target.value })}
              placeholder="8000"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="ort" className="text-sm font-semibold">Ort</Label>
            <Input
              id="ort"
              value={form.ort}
              onChange={(e) => setForm({ ...form, ort: e.target.value })}
              placeholder="Zürich"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-semibold">E-Mail</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="info@muster.ch"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* ===== POSITIONEN ===== */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base md:text-lg font-bold">Positionen</h2>
          <Button variant="outline" size="sm" onClick={addPosition} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-1.5" /> Position hinzufügen
          </Button>
        </div>

        <div className="space-y-3 overflow-x-auto">
          <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-2">
            <div className="col-span-6">Beschreibung</div>
            <div className="col-span-2">Menge</div>
            <div className="col-span-3">Einzelpreis CHF</div>
            <div className="col-span-1"></div>
          </div>

          {form.positionen.map((pos, idx) => (
            <div key={idx} className="grid md:grid-cols-12 gap-2 md:gap-2 items-end bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-lg md:rounded-none">
              <div className="md:col-span-6">
                <Label className="text-xs md:hidden font-semibold mb-1 block">Beschreibung</Label>
                <Input
                  placeholder="z.B. Elektroinstallation"
                  value={pos.beschreibung}
                  onChange={(e) => handlePositionChange(idx, "beschreibung", e.target.value)}
                  className="md:col-span-6"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs md:hidden font-semibold mb-1 block">Menge</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={pos.menge}
                  onChange={(e) => handlePositionChange(idx, "menge", parseFloat(e.target.value) || 0)}
                  className="md:col-span-2"
                />
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs md:hidden font-semibold mb-1 block">Einzelpreis CHF</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.05"
                  value={pos.einzelpreis}
                  onChange={(e) => handlePositionChange(idx, "einzelpreis", parseFloat(e.target.value) || 0)}
                  className="md:col-span-3"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="md:col-span-1 text-muted-foreground hover:text-destructive w-full md:w-auto"
                onClick={() => removePosition(idx)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2 p-4 bg-slate-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Zwischensumme:</span>
            <span className="font-semibold">CHF {zwischensumme.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">MwSt. (8.1%):</span>
            <span className="font-semibold">CHF {mwst.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-lg">
            <span className="font-bold">Total CHF:</span>
            <span className="font-bold text-foreground">{total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* ===== NOTIZEN ===== */}
      <Card className="p-4 md:p-6">
        <h2 className="text-base md:text-lg font-bold mb-4">Interne Notizen (optional)</h2>
        <Textarea
          value={form.notizen}
          onChange={(e) => setForm({ ...form, notizen: e.target.value })}
          placeholder="Interne Bemerkungen zur Rechnung..."
          className="min-h-20"
        />
      </Card>

      {/* ===== BUTTONS ===== */}
      <div className="flex flex-col sm:flex-row gap-3 sticky bottom-4 sm:bottom-6 p-4 sm:p-0 bg-background sm:bg-transparent">
        <Button variant="outline" onClick={() => navigate("/rechnungen")} className="w-full sm:flex-1">
          Abbrechen
        </Button>
        {createdRechnungData ? (
          <>
            <DriveUploadButton
              folderName="MeisterFlow/Rechnungen"
              label="In Drive speichern"
              getPdfBase64={async () => {
                const doc = generateProfessionalRechnung(createdRechnungData.rechnung, firma, createdRechnungData.positionen);
                const base64 = doc.output('datauristring').split(',')[1];
                return { base64, fileName: `${createdRechnungData.rechnung.nummer}.pdf` };
              }}
            />
            <Button onClick={() => navigate("/rechnungen")} className="w-full sm:flex-1 gap-2">
              Fertig
            </Button>
          </>
        ) : (
          <Button
            onClick={handleRechnungErstellen}
            disabled={createRechnung.isPending}
            className="w-full sm:flex-1 gap-2"
          >
            <FileText className="w-4 h-4" />
            {createRechnung.isPending ? "Wird erstellt..." : "Rechnung erstellen"}
          </Button>
        )}
      </div>
    </div>
  );
}
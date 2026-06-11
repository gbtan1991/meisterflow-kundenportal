import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import IntegrationKarte from "@/components/onboarding/IntegrationKarte";
import EmailVerbindungStatus from "@/components/EmailVerbindungStatus";
import KalenderSync from "@/components/KalenderSync";
import GoogleDriveSync from "@/components/GoogleDriveSync";
import { cn } from "@/lib/utils";
import {
  Building2, Globe, CalendarDays, Star, MessageCircle, MessageSquare,
  Mail, Briefcase, LinkIcon, Upload, Check, Save, X
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const DIENSTLEISTUNGEN_VORGABEN = [
  "Dachdecker", "Maler", "Elektriker", "Sanitär/Heizung", "Gartenbau",
  "Reinigungsfirma", "Schreiner/Zimmermann", "Bauunternehmen", "Umzugsunternehmen",
  "Fenster & Türen", "Fliesen & Böden", "Küchenbau", "Haushaltgeräte", "IT-Dienstleister",
];

export default function FirmaEinstellungen() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const logoInputRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });
  const { data: firmen = [] } = useQuery({
    queryKey: ["firma", user?.id],
    queryFn: () => base44.entities.Firma.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });
  const firma = firmen[0];

  useEffect(() => {
    if (firma && !form) {
      setForm({ ...firma, eigene_dienstleistung: "" });
      if (firma.logo_url) setLogoPreview(firma.logo_url);
    }
  }, [firma]);

  const f = (k) => (e) => setForm({ ...form, [k]: typeof e === "boolean" ? e : e.target?.value ?? e });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const speichern = async () => {
    if (!firma?.id || !form) return;
    setSaving(true);
    let logo_url = form.logo_url || "";
    if (logoFile) {
      const result = await base44.integrations.Core.UploadFile({ file: logoFile });
      logo_url = result.file_url;
    }
    await base44.entities.Firma.update(firma.id, { ...form, logo_url });
    qc.invalidateQueries({ queryKey: ["firma"] });
    setSaving(false);
    toast({ title: "Gespeichert", description: "Ihre Firmendaten wurden aktualisiert." });
  };

  const toggleDienstleistung = (dl) => {
    const list = form.dienstleistungen || [];
    setForm({ ...form, dienstleistungen: list.includes(dl) ? list.filter((x) => x !== dl) : [...list, dl] });
  };
  const eigeneHinzufuegen = () => {
    const dl = (form.eigene_dienstleistung || "").trim();
    if (!dl || form.dienstleistungen?.includes(dl)) return;
    setForm({ ...form, dienstleistungen: [...(form.dienstleistungen || []), dl], eigene_dienstleistung: "" });
  };

  if (!form) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Firma & Integrationen" subtitle="Verwalten Sie Ihre Firmendaten und verbundene Systeme">
        <Button onClick={speichern} disabled={saving}>
          <Save className="w-4 h-4 mr-1.5" />
          {saving ? "Speichern…" : "Änderungen speichern"}
        </Button>
      </PageHeader>

      <Tabs defaultValue="firma">
        <TabsList className="mb-6">
          <TabsTrigger value="firma" className="gap-1.5"><Building2 className="w-4 h-4" /> Firmendaten</TabsTrigger>
          <TabsTrigger value="website" className="gap-1.5"><Globe className="w-4 h-4" /> Website</TabsTrigger>
          <TabsTrigger value="integrationen" className="gap-1.5"><Check className="w-4 h-4" /> Integrationen</TabsTrigger>
          <TabsTrigger value="dienstleistungen" className="gap-1.5"><Briefcase className="w-4 h-4" /> Dienstleistungen</TabsTrigger>
          <TabsTrigger value="bewertung" className="gap-1.5"><Star className="w-4 h-4" /> Bewertung</TabsTrigger>
        </TabsList>

        {/* ──── FIRMENDATEN ──── */}
        <TabsContent value="firma">
          <Card className="p-6 space-y-5">
            <div className="space-y-1.5">
              <Label>Firmenname</Label>
              <Input value={form.firmenname || ""} onChange={f("firmenname")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ansprechpartner</Label>
                <Input value={form.ansprechpartner || ""} onChange={f("ansprechpartner")} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input value={form.telefon || ""} onChange={f("telefon")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>E-Mail</Label>
              <Input type="email" value={form.email || ""} onChange={f("email")} />
            </div>
            <div className="space-y-1.5">
              <Label>Adresse</Label>
              <Input value={form.adresse || ""} onChange={f("adresse")} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>PLZ</Label>
                <Input value={form.plz || ""} onChange={f("plz")} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Ort</Label>
                <Input value={form.ort || ""} onChange={f("ort")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>UID Nummer</Label>
              <Input value={form.uid_nummer || ""} onChange={f("uid_nummer")} placeholder="CHE-123.456.789" />
            </div>
            <div className="space-y-1.5">
              <Label>Rechnungsadresse (falls abweichend)</Label>
              <Textarea value={form.rechnungsadresse || ""} onChange={f("rechnungsadresse")} className="h-16" />
            </div>

            <div className="space-y-2">
              <Label>Firmenlogo</Label>
              <div
                onClick={() => logoInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors",
                  logoPreview ? "border-primary/40 bg-accent" : "border-border hover:border-primary/50 hover:bg-accent/50"
                )}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="max-h-20 max-w-xs object-contain" />
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Logo hochladen</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG oder SVG · max. 2 MB</p>
                    </div>
                  </>
                )}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              {logoPreview && (
                <Button type="button" variant="outline" size="sm"
                  onClick={() => { setLogoFile(null); setLogoPreview(null); setForm({ ...form, logo_url: "" }); }}>
                  <X className="w-3.5 h-3.5 mr-1" /> Logo entfernen
                </Button>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* ──── WEBSITE ──── */}
        <TabsContent value="website">
          <Card className="p-6 space-y-5">
            <div className="space-y-1.5">
              <Label>Domain</Label>
              <Input value={form.domain || ""} onChange={f("domain")} placeholder="www.meinefirma.ch" />
            </div>
            <div className="space-y-1.5">
              <Label>Hosting-Zugang</Label>
              <Input value={form.hosting_zugang || ""} onChange={f("hosting_zugang")} placeholder="z. B. Hostpoint, Infomaniak…" />
            </div>
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              {[
                { key: "hat_website", label: "Bestehende Website vorhanden" },
                { key: "hat_google_analytics", label: "Google Analytics vorhanden" },
                { key: "hat_search_console", label: "Google Search Console vorhanden" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-4">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <Switch checked={!!form[key]} onCheckedChange={(v) => setForm({ ...form, [key]: v })} />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* ──── INTEGRATIONEN ──── */}
        <TabsContent value="integrationen">
          <div className="space-y-6">
            {/* Kalender */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-bold text-sm">Kalender</h3>
                {form.kalender_verbunden && <StatusBadge status="aktiv" />}
              </div>
              <KalenderSync />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: "google", name: "Google Kalender", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="GCal" className="w-5 h-5 object-contain" /> },
                  { id: "microsoft365", name: "Microsoft 365", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/4/45/The_OFFICIAL_Outlookcom_Logo.png" alt="M365" className="w-5 h-5 object-contain" /> },
                  { id: "outlook", name: "Outlook", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" alt="Outlook" className="w-5 h-5 object-contain" /> },
                  { id: "apple", name: "Apple Kalender", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/3/37/Apple_Calendar_Icon.png" alt="Apple" className="w-5 h-5 object-contain" />, bald: true },
                ].map((opt) => (
                  <IntegrationKarte key={opt.id} name={opt.name} icon={opt.icon} bald={opt.bald}
                    verbunden={form.kalender_verbunden === opt.id}
                    selected={form.kalender_verbunden === opt.id}
                    onSelect={() => setForm({ ...form, kalender_verbunden: form.kalender_verbunden === opt.id ? "" : opt.id })} />
                ))}
              </div>
            </Card>

            {/* Google Drive */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-4 h-4" />
                <h3 className="font-heading font-bold text-sm">Google Drive</h3>
                <span className="text-xs text-muted-foreground">PDFs automatisch archivieren</span>
              </div>
              <p className="text-sm text-muted-foreground">Generierte Rechnungen und Offerten werden automatisch in Ihrem Google Drive unter <strong>MeisterFlow/</strong> gespeichert.</p>
              <GoogleDriveSync />
            </Card>

            {/* Google */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-4 h-4" />
                <h3 className="font-heading font-bold text-sm">Google</h3>
                {form.google_verbunden && <StatusBadge status="aktiv" />}
              </div>
              <IntegrationKarte
                name="Google Konto"
                beschreibung="Unternehmensprofil · Bewertungen · Analytics · Search Console"
                icon={<img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-6 h-6" />}
                verbunden={form.google_verbunden}
                selected={form.google_verbunden}
                onSelect={() => setForm({ ...form, google_verbunden: !form.google_verbunden })}
              />
            </Card>

            {/* WhatsApp */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-bold text-sm">WhatsApp Business</h3>
                {form.whatsapp_verbunden && <StatusBadge status="aktiv" />}
              </div>
              <IntegrationKarte
                name="WhatsApp Business"
                beschreibung="Terminbestätigungen · Offerten · Erinnerungen"
                icon={<MessageCircle className="w-6 h-6 text-emerald-600" />}
                verbunden={form.whatsapp_verbunden}
                selected={form.whatsapp_verbunden}
                onSelect={() => setForm({ ...form, whatsapp_verbunden: !form.whatsapp_verbunden })}
              />
              {form.whatsapp_verbunden && (
                <div className="space-y-1.5">
                  <Label>WhatsApp Nummer</Label>
                  <Input value={form.whatsapp_nummer || ""} onChange={f("whatsapp_nummer")} placeholder="+41 79 123 45 67" />
                </div>
              )}
            </Card>

            {/* SMS */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-bold text-sm">SMS</h3>
                {form.sms_verbunden && <StatusBadge status="aktiv" />}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <IntegrationKarte name="Eigene Nummer" beschreibung="Ihre Geschäftsnummer"
                  icon={<MessageSquare className="w-6 h-6 text-violet-600" />}
                  selected={form.sms_verbunden && !form.sms_meisterflow_nummer}
                  verbunden={form.sms_verbunden && !form.sms_meisterflow_nummer}
                  onSelect={() => setForm({ ...form, sms_verbunden: true, sms_meisterflow_nummer: false })} />
                <IntegrationKarte name="MeisterFlow Nummer" beschreibung="Dedizierte CH-Nummer"
                  icon={<div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center"><MessageSquare className="w-3.5 h-3.5 text-white" /></div>}
                  selected={form.sms_meisterflow_nummer}
                  verbunden={form.sms_meisterflow_nummer}
                  onSelect={() => setForm({ ...form, sms_verbunden: true, sms_meisterflow_nummer: true })} />
              </div>
              {form.sms_verbunden && !form.sms_meisterflow_nummer && (
                <div className="space-y-1.5">
                  <Label>SMS-Nummer</Label>
                  <Input value={form.sms_eigene_nummer || ""} onChange={f("sms_eigene_nummer")} placeholder="+41 44 123 45 67" />
                </div>
              )}
            </Card>

            {/* Stripe */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M13.5 7c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2z" fill="#6772e5"/><rect width="24" height="24" rx="4" fill="#6772e5"/><path d="M10.5 8.5c1.1-.5 2.8-.3 3.5.8.5.8.3 1.9-.5 2.4l-2.2 1.3c-.8.5-1 1.5-.5 2.2.4.6 1.3.9 2 .6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 12h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <h3 className="font-heading font-bold text-sm">Stripe Zahlung</h3>
                {form.stripe_zahlungslink && <StatusBadge status="aktiv" />}
              </div>
              <p className="text-sm text-muted-foreground">
                Hinterlegen Sie Ihren Stripe-Zahlungslink, damit Kunden Rechnungen direkt online bezahlen können.
                {" "}<a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className="text-primary underline">Noch kein Stripe-Konto? Jetzt registrieren →</a>
              </p>
              <div className="space-y-1.5">
                <Label>Stripe Zahlungslink</Label>
                <Input
                  value={form.stripe_zahlungslink || ""}
                  onChange={f("stripe_zahlungslink")}
                  placeholder="https://buy.stripe.com/..."
                />
                <p className="text-xs text-muted-foreground">Erstellen Sie einen Zahlungslink in Ihrem <a href="https://dashboard.stripe.com/payment-links" target="_blank" rel="noopener noreferrer" className="text-primary underline">Stripe Dashboard</a> und fügen Sie ihn hier ein.</p>
              </div>
            </Card>

            {/* E-Mail */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-bold text-sm">E-Mail</h3>
                {form.email_verbunden && <StatusBadge status="aktiv" />}
              </div>
              <EmailVerbindungStatus />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: "microsoft365", name: "Microsoft 365", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/4/45/The_OFFICIAL_Outlookcom_Logo.png" alt="M365" className="w-5 h-5 object-contain" /> },
                  { id: "outlook", name: "Outlook", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" alt="Outlook" className="w-5 h-5 object-contain" /> },
                  { id: "gmail", name: "Gmail", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-5 h-5 object-contain" /> },
                  { id: "imap_smtp", name: "IMAP / SMTP", icon: <Mail className="w-5 h-5 text-muted-foreground" /> },
                ].map((opt) => (
                  <IntegrationKarte key={opt.id} name={opt.name} icon={opt.icon}
                    verbunden={form.email_verbunden === opt.id}
                    selected={form.email_verbunden === opt.id}
                    onSelect={() => setForm({ ...form, email_verbunden: form.email_verbunden === opt.id ? "" : opt.id })} />
                ))}
              </div>
              {form.email_verbunden && (
                <div className="space-y-1.5">
                  <Label>E-Mail-Adresse</Label>
                  <Input type="email" value={form.email_verbunden_adresse || ""} onChange={f("email_verbunden_adresse")} />
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* ──── DIENSTLEISTUNGEN ──── */}
        <TabsContent value="dienstleistungen">
          <Card className="p-6 space-y-5">
            <div className="flex flex-wrap gap-2">
              {DIENSTLEISTUNGEN_VORGABEN.map((dl) => {
                const aktiv = form.dienstleistungen?.includes(dl);
                return (
                  <button key={dl} type="button" onClick={() => toggleDienstleistung(dl)}
                    className={cn(
                      "px-3.5 py-2 rounded-full text-sm font-medium border transition-all",
                      aktiv ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-accent"
                    )}>
                    {aktiv && <Check className="w-3.5 h-3.5 inline mr-1.5" strokeWidth={3} />}{dl}
                  </button>
                );
              })}
              {form.dienstleistungen?.filter((d) => !DIENSTLEISTUNGEN_VORGABEN.includes(d)).map((dl) => (
                <span key={dl} className="px-3.5 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground border border-primary flex items-center gap-2">
                  {dl}
                  <button type="button" onClick={() => toggleDienstleistung(dl)}><X className="w-3.5 h-3.5" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={form.eigene_dienstleistung || ""}
                onChange={(e) => setForm({ ...form, eigene_dienstleistung: e.target.value })}
                placeholder="Eigene Dienstleistung hinzufügen…"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), eigeneHinzufuegen())}
              />
              <Button type="button" variant="outline" onClick={eigeneHinzufuegen}>Hinzufügen</Button>
            </div>
          </Card>
        </TabsContent>

        {/* ──── BEWERTUNGSLINK ──── */}
        <TabsContent value="bewertung">
          <Card className="p-6 space-y-5">
            <div className="space-y-1.5">
              <Label>Google Bewertungslink</Label>
              <Input value={form.google_bewertungslink || ""} onChange={f("google_bewertungslink")}
                placeholder="https://g.page/r/…/review" />
              <p className="text-xs text-muted-foreground">Finden Sie diesen Link in Ihrem Google Business Profil unter «Bewertungen erhalten».</p>
            </div>
            {form.google_bewertungslink && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Bewertungssystem aktiv</p>
                  <p className="text-xs text-emerald-600">Automatische Bewertungsanfragen werden über diesen Link versendet.</p>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
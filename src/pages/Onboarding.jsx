import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import SchrittCard from "@/components/onboarding/SchrittCard";
import IntegrationKarte from "@/components/onboarding/IntegrationKarte";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2, Globe, CalendarDays, Star, MessageCircle, MessageSquare,
  Mail, Briefcase, Link as LinkIcon, Upload, Check, Sparkles, X
} from "lucide-react";
import { cn } from "@/lib/utils";

const GESAMT_SCHRITTE = 8;

const DIENSTLEISTUNGEN_VORGABEN = [
  "Dachdecker", "Maler", "Elektriker", "Sanitär/Heizung", "Gartenbau",
  "Reinigungsfirma", "Schreiner/Zimmermann", "Bauunternehmen", "Umzugsunternehmen",
  "Fenster & Türen", "Fliesen & Böden", "Küchenbau", "Haushaltgeräte", "IT-Dienstleister",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [schritt, setSchritt] = useState(1);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const logoInputRef = useRef(null);

  const [form, setForm] = useState({
    firmenname: "", ansprechpartner: "", email: "", telefon: "",
    adresse: "", plz: "", ort: "", uid_nummer: "", logo_url: "", rechnungsadresse: "",
    domain: "", hosting_zugang: "", hat_website: false, hat_google_analytics: false, hat_search_console: false,
    kalender_verbunden: "",
    google_verbunden: false,
    whatsapp_verbunden: false, whatsapp_nummer: "",
    sms_verbunden: false, sms_eigene_nummer: "", sms_meisterflow_nummer: false,
    email_verbunden: "", email_verbunden_adresse: "",
    branche: "", dienstleistungen: [], eigene_dienstleistung: "",
    google_bewertungslink: "",
    onboarding_schritt: 1, onboarding_abgeschlossen: false,
  });

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });
  const { data: firmen = [] } = useQuery({
    queryKey: ["firma", user?.id],
    queryFn: () => base44.entities.Firma.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });
  const bestehendeFirma = firmen[0];

  useEffect(() => {
    if (bestehendeFirma) {
      setForm((f) => ({ ...f, ...bestehendeFirma, eigene_dienstleistung: "" }));
      setSchritt(bestehendeFirma.onboarding_abgeschlossen ? 1 : bestehendeFirma.onboarding_schritt || 1);
      if (bestehendeFirma.logo_url) setLogoPreview(bestehendeFirma.logo_url);
    }
  }, [bestehendeFirma]);

  const f = (k) => (e) => setForm({ ...form, [k]: typeof e === "boolean" ? e : e.target?.value ?? e });

  const speichern = async (update = {}, fertig = false) => {
    setSaving(true);
    const neuerSchritt = fertig ? schritt : schritt + 1;
    const data = {
      ...form,
      ...update,
      user_id: user?.id,
      onboarding_schritt: neuerSchritt,
      onboarding_abgeschlossen: fertig,
    };
    if (bestehendeFirma?.id) {
      await base44.entities.Firma.update(bestehendeFirma.id, data);
    } else {
      await base44.entities.Firma.create(data);
    }
    qc.invalidateQueries({ queryKey: ["firma"] });
    setSaving(false);
    return data;
  };

  const weiter = async (update = {}) => {
    if (schritt < GESAMT_SCHRITTE) {
      await speichern(update);
      setSchritt((s) => s + 1);
    } else {
      await speichern(update, true);
      navigate("/");
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };
  const uploadLogo = async () => {
    if (!logoFile) return form.logo_url || "";
    const { file_url } = await base44.integrations.Core.UploadFile({ file: logoFile });
    return file_url;
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

  /* ────────────────── INHALTE ────────────────── */
  const schrittInhalt = {
    1: (
      <SchrittCard
        titel="Firmendaten"
        untertitel="Diese Daten werden für Offerten, Rechnungen und E-Mails verwendet."
        icon={Building2}
        weiterDisabled={!form.firmenname}
        saving={saving}
        onWeiter={async () => {
          const logo_url = await uploadLogo();
          weiter({ logo_url });
        }}
        kinder={
          <>
            <div className="space-y-1.5">
              <Label>Firmenname *</Label>
              <Input value={form.firmenname} onChange={f("firmenname")} placeholder="z. B. Malerbetrieb Huber AG" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ansprechpartner</Label>
                <Input value={form.ansprechpartner} onChange={f("ansprechpartner")} placeholder="Vorname Nachname" />
              </div>
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input value={form.telefon} onChange={f("telefon")} placeholder="+41 44 123 45 67" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>E-Mail</Label>
              <Input type="email" value={form.email} onChange={f("email")} placeholder="info@meinefirma.ch" />
            </div>
            <div className="space-y-1.5">
              <Label>Adresse</Label>
              <Input value={form.adresse} onChange={f("adresse")} placeholder="Musterstrasse 1" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>PLZ</Label>
                <Input value={form.plz} onChange={f("plz")} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Ort</Label>
                <Input value={form.ort} onChange={f("ort")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>UID Nummer</Label>
              <Input value={form.uid_nummer} onChange={f("uid_nummer")} placeholder="CHE-123.456.789" />
            </div>
            <div className="space-y-1.5">
              <Label>Rechnungsadresse (falls abweichend)</Label>
              <Textarea value={form.rechnungsadresse} onChange={f("rechnungsadresse")} className="h-16" placeholder="Nur ausfüllen wenn abweichend von der Firmenadresse" />
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
                      <p className="text-sm font-medium text-foreground">Logo hochladen</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG oder SVG · max. 2 MB</p>
                    </div>
                  </>
                )}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              {logoPreview && (
                <Button type="button" variant="outline" size="sm" onClick={() => { setLogoFile(null); setLogoPreview(null); setForm({ ...form, logo_url: "" }); }}>
                  <X className="w-3.5 h-3.5 mr-1" /> Logo entfernen
                </Button>
              )}
            </div>
          </>
        }
      />
    ),

    2: (
      <SchrittCard
        titel="Website"
        untertitel="Verbinden Sie Ihre Online-Präsenz mit MeisterFlow."
        icon={Globe}
        saving={saving}
        ueberspringen
        onUeberspringen={() => weiter()}
        onZurueck={() => setSchritt(1)}
        onWeiter={() => weiter()}
        kinder={
          <>
            <div className="space-y-1.5">
              <Label>Domain</Label>
              <Input value={form.domain} onChange={f("domain")} placeholder="www.meinefirma.ch" />
            </div>
            <div className="space-y-1.5">
              <Label>Hosting-Zugang (optional)</Label>
              <Input value={form.hosting_zugang} onChange={f("hosting_zugang")} placeholder="z. B. Hostpoint, Infomaniak, IONOS…" />
            </div>
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              {[
                { key: "hat_website", label: "Bestehende Website vorhanden", sub: "Sie haben bereits eine aktive Website" },
                { key: "hat_google_analytics", label: "Google Analytics vorhanden", sub: "Besucher werden bereits getrackt" },
                { key: "hat_search_console", label: "Google Search Console vorhanden", sub: "Rankings werden bereits überwacht" },
              ].map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                  <Switch checked={!!form[key]} onCheckedChange={(v) => setForm({ ...form, [key]: v })} />
                </div>
              ))}
            </div>
          </>
        }
      />
    ),

    3: (
      <SchrittCard
        titel="Kalender verbinden"
        untertitel="MeisterFlow kann Termine erstellen, verschieben und Erinnerungen senden."
        icon={CalendarDays}
        saving={saving}
        ueberspringen
        onUeberspringen={() => weiter()}
        onZurueck={() => setSchritt(2)}
        onWeiter={() => weiter()}
        kinder={
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "google", name: "Google Kalender", beschreibung: "Gmail, Google Workspace", icon: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" },
                { id: "microsoft365", name: "Microsoft 365", beschreibung: "Office 365, Teams", icon: "https://upload.wikimedia.org/wikipedia/commons/4/45/The_OFFICIAL_Outlookcom_Logo.png" },
                { id: "outlook", name: "Microsoft Outlook", beschreibung: "Outlook Desktop & Web", icon: "https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" },
                { id: "apple", name: "Apple Kalender", beschreibung: "iCloud, iPhone, iPad", icon: "https://upload.wikimedia.org/wikipedia/commons/3/37/Apple_Calendar_Icon.png", bald: true },
              ].map((opt) => (
                <IntegrationKarte
                  key={opt.id}
                  name={opt.name}
                  beschreibung={opt.beschreibung}
                  icon={<img src={opt.icon} alt={opt.name} className="w-6 h-6 object-contain" />}
                  bald={opt.bald}
                  verbunden={form.kalender_verbunden === opt.id}
                  selected={form.kalender_verbunden === opt.id}
                  onSelect={() => setForm({ ...form, kalender_verbunden: form.kalender_verbunden === opt.id ? "" : opt.id })}
                />
              ))}
            </div>
            {form.kalender_verbunden && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-700">Kalender vorgemerkt: {form.kalender_verbunden === "google" ? "Google Kalender" : form.kalender_verbunden === "microsoft365" ? "Microsoft 365" : "Microsoft Outlook"}</p>
                  <p className="text-xs text-blue-600">Unser Team wird die Verbindung gemeinsam mit Ihnen einrichten.</p>
                </div>
              </div>
            )}
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Nach der Verbindung kann MeisterFlow:</p>
              <ul className="space-y-1">
                {["Termine erstellen", "Termine verschieben", "Erinnerungen senden", "Verfügbarkeiten abrufen"].map((f) => (
                  <li key={f} className="text-sm text-foreground flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </>
        }
      />
    ),

    4: (
      <SchrittCard
        titel="Google verbinden"
        untertitel="Zugriff auf Google Unternehmensprofil, Bewertungen, Analytics und Search Console."
        icon={Star}
        saving={saving}
        ueberspringen
        onUeberspringen={() => weiter()}
        onZurueck={() => setSchritt(3)}
        onWeiter={() => weiter()}
        kinder={
          <>
            <IntegrationKarte
              name="Google Konto verbinden"
              beschreibung="Google Unternehmensprofil · Bewertungen · Analytics · Search Console"
              icon={<img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-6 h-6" />}
              verbunden={form.google_verbunden}
              selected={form.google_verbunden}
              onSelect={() => setForm({ ...form, google_verbunden: !form.google_verbunden })}
            />
            {form.google_verbunden && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-700">Google vorgemerkt</p>
                  <p className="text-xs text-blue-600">Unser Team wird die Google-Verbindung gemeinsam mit Ihnen einrichten.</p>
                </div>
              </div>
            )}
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Dadurch werden möglich:</p>
              <div className="grid grid-cols-2 gap-1">
                {["Google Unternehmensprofil", "Bewertungen lesen", "Analytics Daten", "Search Console", "Automatische Bewertungsanfragen", "SEO & Ranking Reports"].map((f) => (
                  <p key={f} className="text-sm text-foreground flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" /> {f}
                  </p>
                ))}
              </div>
            </div>
          </>
        }
      />
    ),

    5: (
      <SchrittCard
        titel="WhatsApp verbinden"
        untertitel="Automatische Terminbestätigungen, Offerten und Erinnerungen per WhatsApp."
        icon={MessageCircle}
        saving={saving}
        ueberspringen
        onUeberspringen={() => weiter()}
        onZurueck={() => setSchritt(4)}
        onWeiter={() => weiter()}
        kinder={
          <>
            <IntegrationKarte
              name="WhatsApp Business"
              beschreibung="Terminbestätigungen · Offerten · Erinnerungen · Nachfassungen"
              icon={<MessageCircle className="w-6 h-6 text-emerald-600" />}
              verbunden={form.whatsapp_verbunden}
              selected={form.whatsapp_verbunden}
              onSelect={() => setForm({ ...form, whatsapp_verbunden: !form.whatsapp_verbunden })}
            />
            {form.whatsapp_verbunden && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>WhatsApp Business Nummer</Label>
                  <Input value={form.whatsapp_nummer} onChange={f("whatsapp_nummer")} placeholder="+41 79 123 45 67" />
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">WhatsApp Business verbunden</p>
                    <p className="text-xs text-emerald-600">Nachrichten werden automatisch über Ihre Business-Nummer gesendet.</p>
                  </div>
                </div>
              </div>
            )}
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Wird später verwendet für:</p>
              <ul className="space-y-1">
                {["Terminbestätigungen", "Offerten versenden", "Erinnerungen", "Automatische Nachfassungen"].map((item) => (
                  <li key={item} className="text-sm text-foreground flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </>
        }
      />
    ),

    6: (
      <SchrittCard
        titel="E-Mail verbinden"
        untertitel="Senden Sie Offerten, Rechnungen und Nachfassungen direkt aus MeisterFlow."
        icon={Mail}
        saving={saving}
        ueberspringen
        onUeberspringen={() => weiter()}
        onZurueck={() => setSchritt(5)}
        onWeiter={() => weiter()}
        kinder={
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "microsoft365", name: "Microsoft 365", beschreibung: "Office 365, Exchange", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/4/45/The_OFFICIAL_Outlookcom_Logo.png" alt="M365" className="w-6 h-6 object-contain" /> },
                { id: "outlook", name: "Outlook", beschreibung: "Outlook Desktop & Web", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" alt="Outlook" className="w-6 h-6 object-contain" /> },
                { id: "gmail", name: "Gmail", beschreibung: "Google Mail, Google Workspace", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-6 h-6 object-contain" /> },
                { id: "imap_smtp", name: "IMAP / SMTP", beschreibung: "Andere E-Mail-Anbieter", icon: <Mail className="w-6 h-6 text-muted-foreground" /> },
              ].map((opt) => (
                <IntegrationKarte
                  key={opt.id}
                  name={opt.name}
                  beschreibung={opt.beschreibung}
                  icon={opt.icon}
                  verbunden={form.email_verbunden === opt.id}
                  selected={form.email_verbunden === opt.id}
                  onSelect={() => setForm({ ...form, email_verbunden: form.email_verbunden === opt.id ? "" : opt.id })}
                />
              ))}
            </div>
            {form.email_verbunden && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>E-Mail-Adresse</Label>
                  <Input type="email" value={form.email_verbunden_adresse} onChange={f("email_verbunden_adresse")} placeholder="info@meinefirma.ch" />
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-700">E-Mail vorgemerkt</p>
                    <p className="text-xs text-blue-600">Unser Team richtet die E-Mail-Anbindung gemeinsam mit Ihnen ein.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        }
      />
    ),

    7: (
      <SchrittCard
        titel="Dienstleistungen"
        untertitel="Was bietet Ihr Betrieb an? Diese Daten werden für Offerten, Formulare und KI-Assistenten verwendet."
        icon={Briefcase}
        saving={saving}
        ueberspringen
        onUeberspringen={() => weiter()}
        onZurueck={() => setSchritt(6)}
        onWeiter={() => weiter()}
        kinder={
          <>
            <div className="flex flex-wrap gap-2">
              {DIENSTLEISTUNGEN_VORGABEN.map((dl) => {
                const aktiv = form.dienstleistungen?.includes(dl);
                return (
                  <button
                    key={dl}
                    type="button"
                    onClick={() => toggleDienstleistung(dl)}
                    className={cn(
                      "px-3.5 py-2 rounded-full text-sm font-medium border transition-all",
                      aktiv
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-accent"
                    )}
                  >
                    {aktiv && <Check className="w-3.5 h-3.5 inline mr-1.5" strokeWidth={3} />}
                    {dl}
                  </button>
                );
              })}
            </div>
            {form.dienstleistungen?.filter((d) => !DIENSTLEISTUNGEN_VORGABEN.includes(d)).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.dienstleistungen.filter((d) => !DIENSTLEISTUNGEN_VORGABEN.includes(d)).map((dl) => (
                  <span
                    key={dl}
                    className="px-3.5 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground border border-primary flex items-center gap-2"
                  >
                    {dl}
                    <button type="button" onClick={() => toggleDienstleistung(dl)}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={form.eigene_dienstleistung || ""}
                onChange={(e) => setForm({ ...form, eigene_dienstleistung: e.target.value })}
                placeholder="Eigene Dienstleistung hinzufügen…"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), eigeneHinzufuegen())}
              />
              <Button type="button" variant="outline" onClick={eigeneHinzufuegen}>
                Hinzufügen
              </Button>
            </div>
            {form.dienstleistungen?.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {form.dienstleistungen.length} Dienstleistung{form.dienstleistungen.length !== 1 ? "en" : ""} ausgewählt
              </p>
            )}
          </>
        }
      />
    ),

    8: (
      <SchrittCard
        titel="Bewertungslink"
        untertitel="Fügen Sie Ihren Google Bewertungslink ein – das Bewertungssystem ist dann sofort aktiv."
        icon={Star}
        saving={saving}
        weiterText="Einrichtung abschliessen"
        onZurueck={() => setSchritt(7)}
        onWeiter={() => weiter()}
        kinder={
          <>
            <div className="space-y-1.5">
              <Label>Google Bewertungslink</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.google_bewertungslink}
                    onChange={f("google_bewertungslink")}
                    placeholder="https://g.page/r/…/review"
                    className="pl-9"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Den Link finden Sie in Ihrem Google Business Profil unter «Bewertungen erhalten».
              </p>
            </div>
            {form.google_bewertungslink && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Bewertungssystem aktiv</p>
                  <p className="text-xs text-emerald-600">Bewertungsanfragen können jetzt automatisch versendet werden.</p>
                </div>
              </div>
            )}
            <div className="rounded-xl bg-muted/60 p-5 space-y-3">
              <p className="text-sm font-semibold text-foreground">Alles bereit! 🎉</p>
              <p className="text-sm text-muted-foreground">Nach dem Abschluss wird Ihr MeisterFlow Kundenportal vollständig eingerichtet sein. Sie können alle Angaben jederzeit unter <strong>Einstellungen → Firma</strong> anpassen.</p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  form.firmenname && "Firmendaten ✓",
                  form.kalender_verbunden && "Kalender ✓",
                  form.google_verbunden && "Google ✓",
                  form.email_verbunden && "E-Mail ✓",
                  form.whatsapp_verbunden && "WhatsApp ✓",
                  form.dienstleistungen?.length > 0 && `${form.dienstleistungen.length} Dienstleistungen ✓`,
                ].filter(Boolean).map((item) => (
                  <p key={item} className="text-sm text-emerald-700 font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} /> {item}
                  </p>
                ))}
              </div>
            </div>
          </>
        }
      />
    ),
  };

  return (
    <OnboardingLayout schritt={schritt}>
      {schrittInhalt[schritt]}
    </OnboardingLayout>
  );
}
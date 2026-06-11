import React from "react";
import { Card } from "@/components/ui/card";
import { Globe, Server, Shield, HardDrive, FileText, Calendar, Mail, MessageSquare, Phone, ExternalLink } from "lucide-react";

const StatusDot = ({ aktiv, label }) => (
  <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${aktiv ? "text-emerald-600" : "text-slate-400"}`}>
    <span className={`w-2 h-2 rounded-full ${aktiv ? "bg-emerald-500" : "bg-slate-300"}`} />
    {label}
  </span>
);

const InfoRow = ({ label, value, muted }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-sm font-medium ${muted ? "text-muted-foreground" : "text-foreground"}`}>
      {value || <span className="text-muted-foreground italic">Nicht hinterlegt</span>}
    </span>
  </div>
);

const SectionCard = ({ title, icon: Icon, children }) => (
  <Card className="p-5">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h3 className="font-heading font-semibold text-foreground">{title}</h3>
    </div>
    {children}
  </Card>
);

export default function WebsiteStatusTab({ firma, anfragen }) {
  const websiteUrl = firma?.domain
    ? firma.domain.startsWith("http") ? firma.domain : `https://${firma.domain}`
    : null;

  const offeneAnfragen = anfragen.filter(a => a.status === "offen").length;
  const erledigteAnfragen = anfragen.filter(a => a.status === "erledigt").length;

  return (
    <div className="space-y-6">
      {/* Schnellübersicht */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className={`text-2xl font-bold font-heading ${firma?.domain ? "text-emerald-600" : "text-slate-400"}`}>
            {firma?.domain ? "Online" : "–"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Website Status</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold font-heading text-foreground">{offeneAnfragen}</div>
          <div className="text-xs text-muted-foreground mt-1">Offene Anfragen</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold font-heading text-foreground">{erledigteAnfragen}</div>
          <div className="text-xs text-muted-foreground mt-1">Erledigte Anfragen</div>
        </Card>
        <Card className="p-4 text-center">
          <div className={`text-2xl font-bold font-heading ${firma?.hat_google_analytics ? "text-emerald-600" : "text-slate-400"}`}>
            {firma?.hat_google_analytics ? "Aktiv" : "–"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Google Analytics</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Allgemeine Informationen */}
        <SectionCard title="Allgemeine Informationen" icon={Globe}>
          <InfoRow label="Website URL" value={
            websiteUrl ? (
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1">
                {firma.domain} <ExternalLink className="w-3 h-3" />
              </a>
            ) : null
          } />
          <InfoRow label="Website Status" value={
            firma?.domain ? <StatusDot aktiv label="Online" /> : <StatusDot aktiv={false} label="Nicht verbunden" />
          } />
          <InfoRow label="Hat Website" value={firma?.hat_website ? "Ja" : "Nein"} />
        </SectionCard>

        {/* Domain */}
        <SectionCard title="Domain" icon={Shield}>
          <InfoRow label="Domain" value={firma?.domain} />
          <InfoRow label="Domain Status" value={firma?.domain ? <StatusDot aktiv label="Aktiv" /> : null} />
          <InfoRow label="SSL Zertifikat" value={firma?.domain ? <StatusDot aktiv label="Gesichert (HTTPS)" /> : null} />
          <InfoRow label="Ablaufdatum" value={null} muted />
        </SectionCard>

        {/* Hosting */}
        <SectionCard title="Hosting" icon={Server}>
          <InfoRow label="Hosting Status" value={<StatusDot aktiv={!!firma?.hosting_zugang} label={firma?.hosting_zugang ? "Verbunden" : "Nicht hinterlegt"} />} />
          <InfoRow label="Hosting-Zugang" value={firma?.hosting_zugang ? "Hinterlegt" : null} muted={!firma?.hosting_zugang} />
          <InfoRow label="Server Status" value={firma?.domain ? <StatusDot aktiv label="Erreichbar" /> : null} />
          <InfoRow label="Speicherplatz Nutzung" value={null} muted />
        </SectionCard>

        {/* Formulare */}
        <SectionCard title="Formulare" icon={FileText}>
          <InfoRow label="Kontaktformular" value={<StatusDot aktiv={!!firma?.domain} label={firma?.domain ? "Aktiv" : "Inaktiv"} />} />
          <InfoRow label="Offertenformular" value={<StatusDot aktiv={false} label="Nicht eingerichtet" />} />
          <InfoRow label="Terminformular" value={<StatusDot aktiv={!!firma?.kalender_verbunden} label={firma?.kalender_verbunden ? "Aktiv" : "Nicht eingerichtet"} />} />
        </SectionCard>

        {/* Verbindungen – Kommunikation */}
        <SectionCard title="Kommunikation" icon={Mail}>
          <InfoRow label="E-Mail" value={
            firma?.email_verbunden
              ? <StatusDot aktiv label={`Verbunden (${firma.email_verbunden})`} />
              : <StatusDot aktiv={false} label="Nicht verbunden" />
          } />
          <InfoRow label="WhatsApp" value={
            firma?.whatsapp_verbunden
              ? <StatusDot aktiv label={firma.whatsapp_nummer || "Verbunden"} />
              : <StatusDot aktiv={false} label="Nicht verbunden" />
          } />
          <InfoRow label="SMS" value={
            firma?.sms_verbunden
              ? <StatusDot aktiv label="Verbunden" />
              : <StatusDot aktiv={false} label="Nicht verbunden" />
          } />
        </SectionCard>

        {/* Verbindungen – Kalender */}
        <SectionCard title="Kalender" icon={Calendar}>
          <InfoRow label="Google Kalender" value={
            <StatusDot aktiv={firma?.kalender_verbunden === "google"} label={firma?.kalender_verbunden === "google" ? "Verbunden" : "Nicht verbunden"} />
          } />
          <InfoRow label="Microsoft Outlook" value={
            <StatusDot aktiv={firma?.kalender_verbunden === "outlook"} label={firma?.kalender_verbunden === "outlook" ? "Verbunden" : "Nicht verbunden"} />
          } />
          <InfoRow label="Microsoft 365" value={
            <StatusDot aktiv={firma?.kalender_verbunden === "microsoft365"} label={firma?.kalender_verbunden === "microsoft365" ? "Verbunden" : "Nicht verbunden"} />
          } />
        </SectionCard>
      </div>
    </div>
  );
}
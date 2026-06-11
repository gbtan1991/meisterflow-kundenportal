import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

// SVG Icons for Gmail and Outlook
const GmailIcon = () => (
  <svg viewBox="0 0 48 48" width="28" height="28">
    <path fill="#EA4335" d="M6 40h6V22.5L4 16.5V38c0 1.1.9 2 2 2z"/>
    <path fill="#34A853" d="M36 40h6c1.1 0 2-.9 2-2V16.5L36 22.5z"/>
    <path fill="#FBBC05" d="M36 10l-12 9L12 10H6l18 13.5L42 10z"/>
    <path fill="#4285F4" d="M4 16.5L12 22.5V10H6c-1.1 0-2 .9-2 2v4.5z"/>
    <path fill="#C5221F" d="M42 10h-6v12.5l8-6V12c0-1.1-.9-2-2-2z"/>
  </svg>
);

const OutlookIcon = () => (
  <svg viewBox="0 0 48 48" width="28" height="28">
    <path fill="#1976D2" d="M28 10h14c1.1 0 2 .9 2 2v24c0 1.1-.9 2-2 2H28V10z"/>
    <path fill="#fff" d="M42 22H28v4h14v-4zm0 6H28v4h14v-4zm0-12H28v4h14v-4z"/>
    <path fill="#0D47A1" d="M4 14l20-4v28L4 34V14z"/>
    <ellipse cx="14" cy="24" rx="6" ry="7" fill="#fff"/>
    <ellipse cx="14" cy="24" rx="4" ry="5" fill="#1976D2"/>
  </svg>
);

const GMAIL_CONNECTOR_ID = "6a2a5b185cd48e6a3e73dbe0";
const OUTLOOK_CONNECTOR_ID = "6a2a5b27725e857800ca8e5d";

export default function EmailSendenDialog({ open, onOpenChange, empfaenger, betreff, nachricht, pdfGenerator, pdfFilename, dokumentTyp }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [connection, setConnection] = useState({ gmail: false, outlook: false });
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [form, setForm] = useState({ to: "", subject: "", body: "" });

  // Check connection status when dialog opens
  const checkConnection = async () => {
    setChecking(true);
    try {
      const res = await base44.functions.invoke("checkEmailConnection", {});
      setConnection(res.data);
      if (res.data.gmail) setSelectedProvider("gmail");
      else if (res.data.outlook) setSelectedProvider("outlook");
    } catch {
      setConnection({ gmail: false, outlook: false });
    }
    setChecking(false);
  };

  useEffect(() => {
    if (open) {
      setForm({ to: empfaenger || "", subject: betreff || "", body: nachricht || "" });
      checkConnection();
    }
  }, [open, empfaenger, betreff, nachricht]);

  const handleConnect = async (provider) => {
    const connectorId = provider === "gmail" ? GMAIL_CONNECTOR_ID : OUTLOOK_CONNECTOR_ID;
    const url = await base44.connectors.connectAppUser(connectorId);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        checkConnection();
      }
    }, 500);
  };

  const handleSend = async () => {
    if (!form.to || !form.subject) {
      toast({ title: "Bitte Empfänger und Betreff ausfüllen", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let pdfBase64 = null;
      if (pdfGenerator) {
        const doc = pdfGenerator();
        const pdfOutput = doc.output("datauristring");
        pdfBase64 = pdfOutput.split(",")[1];
      }

      const fn = selectedProvider === "gmail" ? "sendEmailGmail" : "sendEmailOutlook";
      await base44.functions.invoke(fn, {
        to: form.to,
        subject: form.subject,
        body: `<p>${form.body.replace(/\n/g, "<br/>")}</p>`,
        pdfBase64,
        pdfFilename: pdfFilename || "Dokument.pdf",
      });

      toast({ title: "E-Mail erfolgreich gesendet ✓" });
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Fehler beim Senden", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const isConnected = connection.gmail || connection.outlook;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            {dokumentTyp || "Dokument"} per E-Mail senden
          </DialogTitle>
        </DialogHeader>

        {checking ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !isConnected ? (
          <div className="space-y-4 py-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Verbinde dein E-Mail-Konto um Dokumente direkt zu versenden.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleConnect("gmail")}>
                <GmailIcon />
                <span className="text-sm font-medium">Gmail verbinden</span>
                <span className="text-xs text-muted-foreground">Google Konto</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleConnect("outlook")}>
                <OutlookIcon />
                <span className="text-sm font-medium">Outlook verbinden</span>
                <span className="text-xs text-muted-foreground">Microsoft Konto</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Provider switcher */}
            <div className="flex gap-2">
              {connection.gmail && (
                <button
                  onClick={() => setSelectedProvider("gmail")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${selectedProvider === "gmail" ? "bg-primary/10 border-primary text-primary font-medium" : "border-border text-muted-foreground hover:bg-accent"}`}
                >
                  <GmailIcon /> Gmail
                  {selectedProvider === "gmail" && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
                </button>
              )}
              {connection.outlook && (
                <button
                  onClick={() => setSelectedProvider("outlook")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${selectedProvider === "outlook" ? "bg-primary/10 border-primary text-primary font-medium" : "border-border text-muted-foreground hover:bg-accent"}`}
                >
                  <OutlookIcon /> Outlook
                  {selectedProvider === "outlook" && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
                </button>
              )}
              {!connection.gmail && (
                <button onClick={() => handleConnect("gmail")} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed text-sm text-muted-foreground hover:bg-accent">
                  <GmailIcon /> Gmail verbinden
                </button>
              )}
              {!connection.outlook && (
                <button onClick={() => handleConnect("outlook")} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed text-sm text-muted-foreground hover:bg-accent">
                  <OutlookIcon /> Outlook verbinden
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-1.5 block">An</Label>
                <Input value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} placeholder="kunde@beispiel.ch" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Betreff</Label>
                <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Nachricht</Label>
                <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={5} />
              </div>
              {pdfFilename && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary rounded-md px-3 py-2">
                  📎 {pdfFilename} wird als Anhang mitgesendet
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
              <Button onClick={handleSend} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Senden
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
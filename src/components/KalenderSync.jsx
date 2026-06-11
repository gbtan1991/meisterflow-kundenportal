import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Calendar } from "lucide-react";

const GCAL_CONNECTOR_ID = "6a2a68df83a79531c222b4a6";
const OUTLOOK_CONNECTOR_ID = "6a2a5b27725e857800ca8e5d";

const PROVIDERS = [
  {
    id: "google",
    connectorId: GCAL_CONNECTOR_ID,
    label: "Google Kalender",
    icon: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg",
    functionName: "syncTerminToGoogleCalendar",
  },
  {
    id: "outlook",
    connectorId: OUTLOOK_CONNECTOR_ID,
    label: "Outlook Kalender",
    icon: "https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg",
    functionName: "syncTerminToOutlookCalendar",
  },
];

function ProviderRow({ provider }) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkConnection = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke(provider.functionName, { action: "check", termin: null });
      setConnected(true);
    } catch {
      setConnected(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(provider.connectorId);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        checkConnection();
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(provider.connectorId);
    setConnected(false);
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${connected ? "bg-emerald-50 border-emerald-200" : "bg-muted/40 border-border"}`}>
      <div className="flex items-center gap-3">
        <img src={provider.icon} alt={provider.label} className="w-6 h-6 object-contain flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold">{provider.label}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /><span className="text-xs text-muted-foreground">Prüfe Verbindung…</span></>
            ) : connected ? (
              <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /><span className="text-xs text-emerald-700 font-medium">Verbunden — Termine werden automatisch synchronisiert</span></>
            ) : (
              <><XCircle className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Nicht verbunden</span></>
            )}
          </div>
        </div>
      </div>
      {!loading && (
        connected ? (
          <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleDisconnect}>
            Trennen
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={handleConnect}>
            <Calendar className="w-3.5 h-3.5 mr-1.5" /> Verbinden
          </Button>
        )
      )}
    </div>
  );
}

export default function KalenderSync() {
  return (
    <div className="space-y-3">
      {PROVIDERS.map((p) => (
        <ProviderRow key={p.id} provider={p} />
      ))}
    </div>
  );
}
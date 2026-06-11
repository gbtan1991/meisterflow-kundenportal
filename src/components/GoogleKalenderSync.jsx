import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Calendar } from "lucide-react";

const GCAL_CONNECTOR_ID = "6a2a68df83a79531c222b4a6";

export default function GoogleKalenderSync() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkConnection = async () => {
    setLoading(true);
    try {
      // Try a real API call to check if the user's calendar is connected
      const { accessToken } = await base44.functions.invoke("syncTerminToGoogleCalendar", {
        action: "check",
        termin: null,
      });
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
    const url = await base44.connectors.connectAppUser(GCAL_CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        checkConnection();
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(GCAL_CONNECTOR_ID);
    setConnected(false);
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${connected ? "bg-emerald-50 border-emerald-200" : "bg-muted/40 border-border"}`}>
      <div className="flex items-center gap-3">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
          alt="Google Calendar"
          className="w-6 h-6 object-contain"
        />
        <div>
          <p className="text-sm font-semibold">Google Kalender</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /><span className="text-xs text-muted-foreground">Prüfe Verbindung…</span></>
            ) : connected ? (
              <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /><span className="text-xs text-emerald-700 font-medium">Verbunden — Termine werden in deinen Kalender synchronisiert</span></>
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
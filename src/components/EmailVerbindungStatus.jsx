import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";

const GMAIL_CONNECTOR_ID = "6a2a5b185cd48e6a3e73dbe0";
const OUTLOOK_CONNECTOR_ID = "6a2a5b27725e857800ca8e5d";

const GmailIcon = () => (
  <svg viewBox="0 0 48 48" width="24" height="24">
    <path fill="#EA4335" d="M6 40h6V22.5L4 16.5V38c0 1.1.9 2 2 2z"/>
    <path fill="#34A853" d="M36 40h6c1.1 0 2-.9 2-2V16.5L36 22.5z"/>
    <path fill="#FBBC05" d="M36 10l-12 9L12 10H6l18 13.5L42 10z"/>
    <path fill="#4285F4" d="M4 16.5L12 22.5V10H6c-1.1 0-2 .9-2 2v4.5z"/>
    <path fill="#C5221F" d="M42 10h-6v12.5l8-6V12c0-1.1-.9-2-2-2z"/>
  </svg>
);

const OutlookIcon = () => (
  <svg viewBox="0 0 48 48" width="24" height="24">
    <path fill="#1976D2" d="M28 10h14c1.1 0 2 .9 2 2v24c0 1.1-.9 2-2 2H28V10z"/>
    <path fill="#fff" d="M42 22H28v4h14v-4zm0 6H28v4h14v-4zm0-12H28v4h14v-4z"/>
    <path fill="#0D47A1" d="M4 14l20-4v28L4 34V14z"/>
    <ellipse cx="14" cy="24" rx="6" ry="7" fill="#fff"/>
    <ellipse cx="14" cy="24" rx="4" ry="5" fill="#1976D2"/>
  </svg>
);

export default function EmailVerbindungStatus() {
  const [connection, setConnection] = useState({ gmail: false, outlook: false });
  const [loading, setLoading] = useState(true);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("checkEmailConnection", {});
      setConnection(res.data);
    } catch {
      setConnection({ gmail: false, outlook: false });
    }
    setLoading(false);
  };

  useEffect(() => {
    checkConnection();
  }, []);

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

  const handleDisconnect = async (provider) => {
    const connectorId = provider === "gmail" ? GMAIL_CONNECTOR_ID : OUTLOOK_CONNECTOR_ID;
    await base44.connectors.disconnectAppUser(connectorId);
    setConnection(prev => ({ ...prev, [provider]: false }));
  };

  const providers = [
    { id: "gmail", name: "Gmail", icon: <GmailIcon /> },
    { id: "outlook", name: "Outlook", icon: <OutlookIcon /> },
  ];

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Verbindungsstatus wird geprüft…
        </div>
      ) : (
        <>
          {providers.map(({ id, name, icon }) => {
            const connected = connection[id];
            return (
              <div key={id} className={`flex items-center justify-between p-4 rounded-xl border ${connected ? "bg-emerald-50 border-emerald-200" : "bg-muted/40 border-border"}`}>
                <div className="flex items-center gap-3">
                  {icon}
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {connected
                        ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /><span className="text-xs text-emerald-700 font-medium">Verbunden</span></>
                        : <><XCircle className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Nicht verbunden</span></>
                      }
                    </div>
                  </div>
                </div>
                {connected ? (
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleDisconnect(id)}>
                    Trennen
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handleConnect(id)}>
                    Verbinden
                  </Button>
                )}
              </div>
            );
          })}
          <button onClick={checkConnection} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
            <RefreshCw className="w-3 h-3" /> Status aktualisieren
          </button>
        </>
      )}
    </div>
  );
}
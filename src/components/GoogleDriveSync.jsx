import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { HardDrive, Check, X, Loader2 } from 'lucide-react';

const DRIVE_CONNECTOR_ID = '6a2a6df2e3b39da37f1f47cc';

export default function GoogleDriveSync({ onStatusChange }) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) { setLoading(false); return; }
      // Try a tiny Drive API call to verify the token works
      const res = await base44.functions.invoke('uploadPdfToDrive', {
        _checkOnly: true, pdfBase64: '', fileName: ''
      });
      // If no "No active connection" error → connected
      setConnected(true);
      if (onStatusChange) onStatusChange(true);
    } catch (err) {
      const msg = err?.message || '';
      setConnected(!msg.includes('No active connection') ? false : false);
      if (onStatusChange) onStatusChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    const url = await base44.connectors.connectAppUser(DRIVE_CONNECTOR_ID);
    const popup = window.open(url, '_blank');
    const timer = setInterval(async () => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setConnecting(false);
        await checkStatus();
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(DRIVE_CONNECTOR_ID);
    setConnected(false);
    if (onStatusChange) onStatusChange(false);
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Wird geprüft…</div>;
  }

  return (
    <div className="flex items-center gap-2">
      {connected ? (
        <>
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <Check className="w-4 h-4" />
            Google Drive verbunden
          </span>
          <button onClick={handleDisconnect} className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <Button variant="outline" size="sm" onClick={handleConnect} disabled={connecting} className="gap-1.5">
          {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
          Google Drive verbinden
        </Button>
      )}
    </div>
  );
}
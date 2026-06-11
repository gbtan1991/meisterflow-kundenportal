import React, { useState } from "react";
import { Globe, ExternalLink, RotateCcw, Loader2, AlertCircle } from "lucide-react";

export default function WebsitePreview({ url }) {
  const [key, setKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Use a free screenshot API - no proxy needed, no iframe issues
  const screenshotUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&viewport_width=1280&viewport_height=900&format=jpg&image_quality=85&cache=true&cache_ttl=3600`;

  // Fallback: use a different free service
  const fallbackUrl = `https://image.thum.io/get/width/1280/crop/900/noanimate/${url}`;

  const handleReload = () => {
    setLoading(true);
    setError(false);
    setKey((k) => k + 1);
  };

  return (
    <div className="w-full rounded-b-xl overflow-hidden" style={{ height: "540px" }}>
      {/* Browser Chrome */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 flex items-center gap-2 bg-background rounded-md px-3 py-1 text-xs text-muted-foreground font-mono border border-border min-w-0">
          <Globe className="w-3 h-3 shrink-0" />
          <span className="truncate">{url}</span>
        </div>
        <button
          onClick={handleReload}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Vorschau aktualisieren"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <button
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="In neuem Tab öffnen"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </a>
      </div>

      {/* Screenshot area */}
      <div className="relative bg-white" style={{ height: "calc(540px - 42px)" }}>
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 z-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Screenshot wird geladen…</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Kann bis zu 10 Sekunden dauern</p>
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/10">
            <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Vorschau nicht verfügbar</p>
            <p className="text-xs text-muted-foreground mb-4">Die Website konnte nicht geladen werden</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Website direkt öffnen
            </a>
          </div>
        ) : (
          <img
            key={key}
            src={fallbackUrl}
            alt={`Screenshot von ${url}`}
            className="w-full h-full object-cover object-top"
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        )}
      </div>
    </div>
  );
}
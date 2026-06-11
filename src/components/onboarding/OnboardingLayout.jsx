import React from "react";
import { cn } from "@/lib/utils";
import { Check, Home } from "lucide-react";

const SCHRITTE = [
  "Firmendaten",
  "Website",
  "Kalender",
  "Google",
  "WhatsApp",
  "E-Mail",
  "Dienstleistungen",
  "Bewertungslink",
];

export default function OnboardingLayout({ schritt, kinder, children }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-sm">
              <Home className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <div className="font-heading font-extrabold text-lg tracking-tight">
                <span className="text-blue-900">Meister</span>
                <span className="text-blue-600">Flow</span>
              </div>
              <div className="text-[9px] font-semibold tracking-[0.25em] text-blue-600 mt-0.5">
                KUNDENPORTAL
              </div>
            </div>
          </div>
          <span className="text-sm text-muted-foreground font-medium">
            Einrichtung · Schritt {schritt} von {SCHRITTE.length}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            {SCHRITTE.map((name, i) => {
              const num = i + 1;
              const done = num < schritt;
              const aktiv = num === schritt;
              return (
                <React.Fragment key={i}>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                        done
                          ? "bg-emerald-500 text-white"
                          : aktiv
                          ? "bg-primary text-white shadow-md shadow-primary/30"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : num}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium hidden sm:block",
                        aktiv ? "text-foreground" : done ? "text-emerald-600" : "text-muted-foreground"
                      )}
                    >
                      {name}
                    </span>
                  </div>
                  {i < SCHRITTE.length - 1 && (
                    <div className={cn("h-px w-4 md:w-6", done ? "bg-emerald-400" : "bg-border")} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${((schritt - 1) / (SCHRITTE.length - 1)) * 100}%` }}
            />
          </div>
        </div>
        {kinder || children}
      </div>
    </div>
  );
}
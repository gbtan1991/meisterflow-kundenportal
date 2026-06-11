import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IntegrationKarte({
  name,
  beschreibung,
  icon,
  verbunden,
  onVerbinden,
  onTrennen,
  bald = false,
  selected = false,
  onSelect,
}) {
  return (
    <div
      onClick={!bald && onSelect ? onSelect : undefined}
      className={cn(
        "border rounded-xl p-4 flex items-start gap-4 transition-all",
        !bald && "cursor-pointer hover:shadow-md",
        selected && "border-primary bg-accent shadow-sm",
        !selected && !bald && "border-border bg-card hover:border-primary/50",
        bald && "border-border bg-muted/50 opacity-60 cursor-default"
      )}
    >
      <div className="w-11 h-11 rounded-xl bg-white border border-border flex items-center justify-center shrink-0 shadow-sm">
        {typeof icon === "string" ? (
          <img src={icon} alt={name} className="w-6 h-6 object-contain" />
        ) : (
          icon
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-foreground text-sm">{name}</p>
          {bald && (
            <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
              Demnächst
            </span>
          )}
          {verbunden && (
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" /> Verbunden
            </span>
          )}
        </div>
        {beschreibung && (
          <p className="text-xs text-muted-foreground mt-0.5">{beschreibung}</p>
        )}
      </div>
      {selected && !verbunden && (
        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      )}
    </div>
  );
}
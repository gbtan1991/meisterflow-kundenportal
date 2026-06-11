import React from "react";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function FinanzenPlaceholder({ titel, beschreibung }) {
  return (
    <Card className="p-12 text-center border-dashed border-2 border-muted-foreground/20">
      <Construction className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
      <h3 className="font-heading font-bold text-muted-foreground">{titel}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{beschreibung}</p>
    </Card>
  );
}
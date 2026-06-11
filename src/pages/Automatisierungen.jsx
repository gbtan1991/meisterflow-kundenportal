import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/PageHeader";
import AutomatisierungDialog from "@/components/forms/AutomatisierungDialog";
import { Plus, Mail, MessageSquare, MessageCircle, Star, CalendarDays, Trash2, Zap } from "lucide-react";

export const TYP_CONFIG = {
  email: { label: "E-Mail", icon: Mail, color: "bg-blue-50 text-blue-600" },
  sms: { label: "SMS", icon: MessageSquare, color: "bg-violet-50 text-violet-600" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "bg-emerald-50 text-emerald-600" },
  bewertung: { label: "Bewertung", icon: Star, color: "bg-amber-50 text-amber-600" },
  termin: { label: "Termin", icon: CalendarDays, color: "bg-sky-50 text-sky-600" },
};

export default function Automatisierungen() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const qc = useQueryClient();

  const { data: automatisierungen = [] } = useQuery({
    queryKey: ["automatisierungen"],
    queryFn: () => base44.entities.Automatisierung.list("-created_date", 200),
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Automatisierung.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automatisierungen"] }),
  });
  const remove = useMutation({
    mutationFn: (id) => base44.entities.Automatisierung.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automatisierungen"] }),
  });

  const aktiveAnzahl = automatisierungen.filter((a) => a.aktiv).length;

  return (
    <div>
      <PageHeader
        title="Automatisierungen"
        subtitle={`${automatisierungen.length} Automatisierungen · ${aktiveAnzahl} aktiv`}
      >
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Neue Automatisierung
        </Button>
      </PageHeader>

      <div className="grid md:grid-cols-2 gap-4">
        {automatisierungen.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground text-sm md:col-span-2">
            Noch keine Automatisierungen eingerichtet.
          </Card>
        )}
        {automatisierungen.map((a) => {
          const cfg = TYP_CONFIG[a.typ] || TYP_CONFIG.email;
          const Icon = cfg.icon;
          return (
            <Card
              key={a.id}
              className={`p-5 transition-all hover:shadow-md ${a.aktiv ? "" : "opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{a.name}</p>
                    <p className="text-xs font-medium text-primary mt-0.5 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {cfg.label}-Automatisierung
                    </p>
                  </div>
                </div>
                <Switch
                  checked={!!a.aktiv}
                  onCheckedChange={(aktiv) => update.mutate({ id: a.id, data: { aktiv } })}
                />
              </div>
              {a.ausloeser && (
                <p className="text-sm text-foreground mt-3.5">
                  <span className="text-muted-foreground">Auslöser:</span> {a.ausloeser}
                </p>
              )}
              {a.beschreibung && (
                <p className="text-sm text-muted-foreground mt-1.5">{a.beschreibung}</p>
              )}
              <div className="flex justify-end mt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                  onClick={() => remove.mutate(a.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <AutomatisierungDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
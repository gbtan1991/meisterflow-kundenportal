import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import AnfrageDialog from "@/components/forms/AnfrageDialog";
import AnfrageEditDialog from "@/components/forms/AnfrageEditDialog";
import { formatDatum } from "@/lib/format";
import { Plus, Building2, Clock, Trash2, StickyNote, BellRing } from "lucide-react";

export const HERKUNFT_LABELS = {
  website: "Website",
  telefon: "Telefon",
  empfehlung: "Empfehlung",
  google: "Google",
  social_media: "Soziale Medien",
  sonstige: "Sonstige",
};

const STATUS_OPTIONEN = ["neu", "in_bearbeitung", "offeriert", "gewonnen", "verloren"];
const STATUS_LABELS = {
  neu: "Neu",
  in_bearbeitung: "In Bearbeitung",
  offeriert: "Offeriert",
  gewonnen: "Gewonnen",
  verloren: "Verloren",
};

export default function Anfragen() {
  const [statusFilter, setStatusFilter] = useState("alle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAnfrage, setEditAnfrage] = useState(null);
  const qc = useQueryClient();

  const { data: anfragen = [] } = useQuery({
    queryKey: ["anfragen"],
    queryFn: () => base44.entities.Anfrage.list("-created_date", 500),
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Anfrage.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["anfragen"] }),
  });
  const remove = useMutation({
    mutationFn: (id) => base44.entities.Anfrage.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["anfragen"] }),
  });

  const filtered = statusFilter === "alle" ? anfragen : anfragen.filter((a) => a.status === statusFilter);
  const istUeberfaellig = (d) => d && new Date(d) < new Date(new Date().toDateString());

  return (
    <div>
      <PageHeader title="Anfragen" subtitle={`${anfragen.length} Anfragen insgesamt`}>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Status</SelectItem>
            {STATUS_OPTIONEN.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Neue Anfrage
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground text-sm">Keine Anfragen gefunden.</Card>
        )}
        {filtered.map((a) => (
          <Card key={a.id} className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setEditAnfrage(a)}>
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-semibold text-foreground">{a.betreff}</span>
                  <StatusBadge status={a.status} />
                  <Badge variant="outline" className="font-normal">
                    {HERKUNFT_LABELS[a.herkunft] || a.herkunft}
                  </Badge>
                </div>
                {a.kunde_name && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4" /> {a.kunde_name}
                  </div>
                )}
                {a.beschreibung && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{a.beschreibung}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-xs pt-0.5">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" /> Eingegangen am {formatDatum(a.created_date)}
                  </span>
                  {a.nachfassung_datum && (
                    <span className={`flex items-center gap-1.5 font-medium ${istUeberfaellig(a.nachfassung_datum) ? "text-red-600" : "text-primary"}`}>
                      <BellRing className="w-3.5 h-3.5" /> Nachfassung: {formatDatum(a.nachfassung_datum)}
                    </span>
                  )}
                  {a.notizen && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <StickyNote className="w-3.5 h-3.5" /> {a.notizen}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Select
                  value={a.status}
                  onValueChange={(status) => update.mutate({ id: a.id, data: { status } })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONEN.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); remove.mutate(a.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AnfrageDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <AnfrageEditDialog
        anfrage={editAnfrage}
        open={!!editAnfrage}
        onOpenChange={(o) => { if (!o) setEditAnfrage(null); }}
      />
    </div>
  );
}
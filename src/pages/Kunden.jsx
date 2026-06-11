import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import KundeDialog from "@/components/forms/KundeDialog";
import { kundeName } from "@/lib/format";
import { Plus, Search, Mail, Phone, MapPin, ChevronRight, Upload, Loader2 } from "lucide-react";

export default function Kunden() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const csvRef = useRef(null);
  const qc = useQueryClient();

  const { data: kunden = [], isLoading } = useQuery({
    queryKey: ["kunden"],
    queryFn: () => base44.entities.Kunde.list("-created_date", 500),
  });

  const filtered = kunden.filter((k) =>
    `${kundeName(k)} ${k.email || ""} ${k.ort || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, "").toLowerCase());
    const records = lines.slice(1).map((line) => {
      const vals = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
      return {
        vorname: obj.vorname || obj.firstname || obj.first_name || "",
        nachname: obj.nachname || obj.lastname || obj.last_name || obj.name || "",
        firma: obj.firma || obj.company || obj.firmenname || "",
        email: obj.email || obj.e_mail || "",
        telefon: obj.telefon || obj.phone || obj.tel || "",
        adresse: obj.adresse || obj.address || obj.strasse || "",
        plz: obj.plz || obj.zip || obj.postcode || "",
        ort: obj.ort || obj.city || obj.stadt || "",
        status: "aktiv",
      };
    }).filter((r) => r.vorname || r.nachname || r.firma);

    await base44.entities.Kunde.bulkCreate(records);
    qc.invalidateQueries({ queryKey: ["kunden"] });
    setImporting(false);
    e.target.value = "";
  };

  return (
    <div>
      <PageHeader title="Kunden" subtitle={`${kunden.length} Kunden insgesamt`}>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Kunden suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-56 bg-card"
          />
        </div>
        <Button variant="outline" onClick={() => csvRef.current?.click()} disabled={importing}>
          {importing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
          CSV importieren
        </Button>
        <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Neuer Kunde
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {!isLoading && filtered.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground text-sm">
            Keine Kunden gefunden.
          </Card>
        )}
        {filtered.map((k) => (
          <Link key={k.id} to={`/kunden/${k.id}`} className="block">
            <Card className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-accent text-accent-foreground flex items-center justify-center font-heading font-bold text-sm shrink-0">
                  {kundeName(k).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-semibold text-foreground">{kundeName(k)}</span>
                    <StatusBadge status={k.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                    {k.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> {k.email}
                      </span>
                    )}
                    {k.telefon && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> {k.telefon}
                      </span>
                    )}
                    {k.ort && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> {k.plz} {k.ort}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <KundeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
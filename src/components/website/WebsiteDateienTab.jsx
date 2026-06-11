import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useMutation } from "@tanstack/react-query";

const UploadBereich = ({ titel, beschreibung, icon: Icon, accept, onUpload, uploading }) => {
  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      onUpload(f);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="font-semibold text-foreground text-sm">{titel}</div>
          <div className="text-xs text-muted-foreground">{beschreibung}</div>
        </div>
      </div>
      <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors">
        {uploading ? (
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        ) : file ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        ) : (
          <Upload className="w-6 h-6 text-muted-foreground" />
        )}
        <span className="text-sm text-muted-foreground text-center">
          {uploading ? "Wird hochgeladen…" : file ? file.name : "Datei auswählen oder hierher ziehen"}
        </span>
        <input type="file" accept={accept} className="hidden" onChange={handleChange} disabled={uploading} />
      </label>
    </Card>
  );
};

export default function WebsiteDateienTab({ firma, user }) {
  const qc = useQueryClient();
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const updateFirma = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Firma.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["firma"] }),
  });

  const handleLogoUpload = async (file) => {
    if (!firma?.id) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await updateFirma.mutateAsync({ id: firma.id, data: { logo_url: file_url } });
    setUploadingLogo(false);
  };

  const handleDateiUpload = async (file) => {
    await base44.integrations.Core.UploadFile({ file });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-1">Logo</h3>
        {firma?.logo_url && (
          <div className="mb-4 p-4 bg-muted rounded-xl inline-block">
            <img src={firma.logo_url} alt="Aktuelles Logo" className="h-16 object-contain" />
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-4">
          <UploadBereich
            titel="Logo hochladen"
            beschreibung="PNG, SVG oder JPG – möglichst transparent"
            icon={Image}
            accept="image/*"
            onUpload={handleLogoUpload}
            uploading={uploadingLogo}
          />
        </div>
      </div>

      <div>
        <h3 className="font-heading font-semibold text-foreground mb-1">Bilder</h3>
        <p className="text-sm text-muted-foreground mb-4">Team-Fotos, Referenzbilder oder Produkte hochladen.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <UploadBereich
            titel="Bilder hochladen"
            beschreibung="JPG, PNG – max. 10 MB"
            icon={Image}
            accept="image/*"
            onUpload={handleDateiUpload}
            uploading={false}
          />
        </div>
      </div>

      <div>
        <h3 className="font-heading font-semibold text-foreground mb-1">Dokumente</h3>
        <p className="text-sm text-muted-foreground mb-4">AGB, Preislisten oder andere Dokumente für die Website.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <UploadBereich
            titel="Dokument hochladen"
            beschreibung="PDF, Word oder Excel"
            icon={FileText}
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            onUpload={handleDateiUpload}
            uploading={false}
          />
        </div>
      </div>

      <Card className="p-5 bg-accent/40 border-accent">
        <p className="text-sm text-muted-foreground">
          Hochgeladene Dateien werden Ihrem MeisterFlow-Team zugestellt. Für spezifische Änderungswünsche erstellen Sie eine <strong>Änderungsanfrage</strong>.
        </p>
      </Card>
    </div>
  );
}
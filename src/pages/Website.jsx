import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import WebsiteStatusTab from "@/components/website/WebsiteStatusTab";
import WebsiteAnfragenTab from "@/components/website/WebsiteAnfragenTab";
import WebsiteSEOTab from "@/components/website/WebsiteSEOTab";
import WebsiteDateienTab from "@/components/website/WebsiteDateienTab";
import WebsiteVerlaufTab from "@/components/website/WebsiteVerlaufTab";
import WebsiteAnfrageDialog from "@/components/website/WebsiteAnfrageDialog";

export default function Website() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });

  const { data: firmen = [] } = useQuery({
    queryKey: ["firma", user?.id],
    queryFn: () => base44.entities.Firma.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });
  const firma = firmen[0];

  const { data: anfragen = [] } = useQuery({
    queryKey: ["website-anfragen", user?.id],
    queryFn: () => base44.entities.WebsiteAnfrage.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  return (
    <div>
      <PageHeader title="Website" subtitle="Ihre Website verwalten und Anpassungen anfragen">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Anpassung anfragen
        </Button>
      </PageHeader>

      <Tabs defaultValue="status">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="anfragen">
            Änderungsanfragen
            {anfragen.filter(a => a.status === "offen").length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {anfragen.filter(a => a.status === "offen").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="seo">SEO & Sichtbarkeit</TabsTrigger>
          <TabsTrigger value="dateien">Dateien</TabsTrigger>
          <TabsTrigger value="verlauf">Änderungsverlauf</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <WebsiteStatusTab firma={firma} anfragen={anfragen} />
        </TabsContent>

        <TabsContent value="anfragen">
          <WebsiteAnfragenTab anfragen={anfragen} user={user} onNeu={() => setDialogOpen(true)} />
        </TabsContent>

        <TabsContent value="seo">
          <WebsiteSEOTab firma={firma} />
        </TabsContent>

        <TabsContent value="dateien">
          <WebsiteDateienTab firma={firma} user={user} />
        </TabsContent>

        <TabsContent value="verlauf">
          <WebsiteVerlaufTab anfragen={anfragen} />
        </TabsContent>
      </Tabs>

      <WebsiteAnfrageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={user}
        firma={firma}
      />
    </div>
  );
}
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search, Folder, Eye, Inbox } from "lucide-react";
import { useState } from "react";
import { useMarketingAssets } from "@/hooks/useMarketing";

export default function FranqueadoMateriais() {
  const { data: assets, isLoading } = useMarketingAssets();
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      </div>
    );
  }

  const filtered = (assets ?? []).filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Marketing" subtitle="Materiais sincronizados com a franqueadora" />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar materiais..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Nenhum material disponível</p>
          <p className="text-xs text-muted-foreground mt-1">Quando a franqueadora publicar materiais, eles aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(asset => (
            <Card key={asset.id} className="glass-card hover-lift group">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/20 flex items-center justify-center flex-shrink-0">
                    <Folder className="w-5 h-5 text-primary/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate">{asset.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[9px]">{asset.type?.toUpperCase() || "FILE"}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="text-xs flex-1">
                    <Download className="w-3.5 h-3.5 mr-1" /> Baixar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Inbox, Upload, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketingAssets, useMarketingFolders } from "@/hooks/useMarketing";

export default function Marketing() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: assets, isLoading: loadingAssets } = useMarketingAssets();
  const { data: folders, isLoading: loadingFolders } = useMarketingFolders();

  const isLoading = loadingAssets || loadingFolders;

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="page-header-title">Marketing</h1>
            <Badge variant="secondary" className="text-xs font-medium">Franqueadora</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Gerencie e distribua materiais de marketing para toda a rede</p>
        </div>
        <Button size="lg" className="gap-2 shadow-sm"><Upload className="w-4 h-4" /> Novo Upload</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, tag ou arquivo..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {(assets ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhum material de marketing</h3>
          <p className="text-sm text-muted-foreground mb-4">Faça o upload do primeiro material para a rede.</p>
          <Button><Upload className="w-4 h-4 mr-1" /> Novo Upload</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets!.filter(a => !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase())).map(a => (
            <div key={a.id} className="glass-card p-4 space-y-2">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <span className="text-xs text-muted-foreground">{a.type}</span>
              </div>
              <p className="text-sm font-medium truncate">{a.name}</p>
              {a.tags && a.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {a.tags.slice(0, 3).map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

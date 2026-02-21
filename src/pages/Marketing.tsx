import { useState, useMemo } from "react";
import { Search, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarketingDrive } from "@/components/MarketingDrive";
import { MarketingUpload } from "@/components/MarketingUpload";
import {
  type MarketingCategory,
  allCategories,
  allProducts,
  allFormats,
  getCategoryLabel,
  getCategoryIcon,
  mockAssets,
  monthLabels,
} from "@/data/marketingData";

export default function Marketing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterFormat, setFilterFormat] = useState("all");
  const [filterCampaign, setFilterCampaign] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);

  const campaigns = useMemo(() => {
    const set = new Set<string>();
    mockAssets.forEach((a) => { if (a.campaign) set.add(a.campaign); });
    return Array.from(set);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
          <Badge variant="secondary" className="text-xs">Franqueadora (acesso total)</Badge>
        </div>
        <Button className="gap-2" onClick={() => setUploadOpen(true)}>
          <Upload className="w-4 h-4" /> Novo Upload
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou tag..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Mês" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os meses</SelectItem>
            {monthLabels.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterProduct} onValueChange={setFilterProduct}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Produto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {allProducts.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterFormat} onValueChange={setFilterFormat}>
          <SelectTrigger className="w-[110px]"><SelectValue placeholder="Formato" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {allFormats.map((f) => (
              <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCampaign} onValueChange={setFilterCampaign}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Campanha" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="RedesSociais" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {allCategories.map((cat) => {
            const Icon = getCategoryIcon(cat);
            return (
              <TabsTrigger key={cat} value={cat} className="gap-1.5 text-xs">
                <Icon className="w-3.5 h-3.5" />
                {getCategoryLabel(cat)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {allCategories.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-4">
            <MarketingDrive
              category={cat}
              searchQuery={searchQuery}
              filterMonth={filterMonth}
              filterProduct={filterProduct}
              filterFormat={filterFormat}
              filterCampaign={filterCampaign}
              filterStatus={filterStatus}
            />
          </TabsContent>
        ))}
      </Tabs>

      <MarketingUpload open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}

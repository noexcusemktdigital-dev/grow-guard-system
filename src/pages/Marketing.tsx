import { useState, useMemo } from "react";
import { Search, Upload, Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  getCategoryColor,
  getCategoryDescription,
  getCategoryAssetCount,
  mockAssets,
  monthLabels,
} from "@/data/marketingData";

const colorStyles: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-500/20" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-500/20" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-500/20" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-500/20" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-500/20" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-500/20" },
};

const activeColorStyles: Record<string, { bg: string; border: string }> = {
  blue: { bg: "bg-blue-500/20", border: "border-blue-500" },
  orange: { bg: "bg-orange-500/20", border: "border-orange-500" },
  purple: { bg: "bg-purple-500/20", border: "border-purple-500" },
  emerald: { bg: "bg-emerald-500/20", border: "border-emerald-500" },
  rose: { bg: "bg-rose-500/20", border: "border-rose-500" },
  amber: { bg: "bg-amber-500/20", border: "border-amber-500" },
};

export default function Marketing() {
  const [activeTab, setActiveTab] = useState<MarketingCategory>("RedesSociais");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterFormat, setFilterFormat] = useState("all");
  const [filterCampaign, setFilterCampaign] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<MarketingCategory | undefined>();

  const campaigns = useMemo(() => {
    const set = new Set<string>();
    mockAssets.forEach((a) => { if (a.campaign) set.add(a.campaign); });
    return Array.from(set);
  }, []);

  const handleUploadFromDrive = (category: MarketingCategory) => {
    setUploadCategory(category);
    setUploadOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
            <Badge variant="secondary" className="text-xs font-medium">Franqueadora</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Gerencie e distribua materiais de marketing para toda a rede
          </p>
        </div>
        <Button size="lg" className="gap-2 shadow-sm" onClick={() => { setUploadCategory(undefined); setUploadOpen(true); }}>
          <Upload className="w-4 h-4" /> Novo Upload
        </Button>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, tag ou arquivo..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-3.5 h-3.5" />
              Filtros
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Mês" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {monthLabels.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterProduct} onValueChange={setFilterProduct}>
                <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Produto" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {allProducts.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterFormat} onValueChange={setFilterFormat}>
                <SelectTrigger className="w-[110px] h-9 text-xs"><SelectValue placeholder="Formato" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {allFormats.map((f) => (
                    <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCampaign} onValueChange={setFilterCampaign}>
                <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Campanha" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Category Cards (Visual Tabs) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {allCategories.map((cat) => {
          const Icon = getCategoryIcon(cat);
          const color = getCategoryColor(cat);
          const style = colorStyles[color];
          const activeStyle = activeColorStyles[color];
          const isActive = activeTab === cat;
          const count = getCategoryAssetCount(cat);

          return (
            <Card
              key={cat}
              className={`relative cursor-pointer transition-all duration-200 border-2 p-4 hover:shadow-md hover:scale-[1.02] ${
                isActive
                  ? `${activeStyle.bg} ${activeStyle.border} shadow-md`
                  : `${style.bg} ${style.border} hover:${activeStyle.border}`
              }`}
              onClick={() => setActiveTab(cat)}
            >
              <div className="flex flex-col items-center text-center gap-2.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${style.iconBg}`}>
                  <Icon className={`w-5 h-5 ${style.text}`} />
                </div>
                <div>
                  <p className={`text-xs font-semibold leading-tight ${isActive ? style.text : "text-foreground"}`}>
                    {getCategoryLabel(cat)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {count} {count === 1 ? "arquivo" : "arquivos"}
                  </p>
                </div>
              </div>
              {isActive && (
                <div className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${
                  color === "blue" ? "bg-blue-500" :
                  color === "orange" ? "bg-orange-500" :
                  color === "purple" ? "bg-purple-500" :
                  color === "emerald" ? "bg-emerald-500" :
                  color === "rose" ? "bg-rose-500" :
                  "bg-amber-500"
                }`} />
              )}
            </Card>
          );
        })}
      </div>

      {/* Active Category Description */}
      <p className="text-sm text-muted-foreground -mt-2">
        {getCategoryDescription(activeTab)}
      </p>

      {/* Drive Content */}
      <MarketingDrive
        category={activeTab}
        searchQuery={searchQuery}
        filterMonth={filterMonth}
        filterProduct={filterProduct}
        filterFormat={filterFormat}
        filterCampaign={filterCampaign}
        filterStatus={filterStatus}
        onUpload={() => handleUploadFromDrive(activeTab)}
      />

      <MarketingUpload open={uploadOpen} onOpenChange={setUploadOpen} defaultCategory={uploadCategory} />
    </div>
  );
}

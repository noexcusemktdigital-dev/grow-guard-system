// @ts-nocheck
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download, Search, FolderOpen, Inbox, ChevronRight,
  Image, Video, FileText, FileSpreadsheet, Presentation, File,
  Eye, Calendar, Tag, Filter, ArrowLeft,
  Palette, CalendarDays, Settings2, Share2, Megaphone, MonitorPlay,
} from "lucide-react";
import { useState, useMemo } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { useMarketingFolders, useMarketingAssets, useContentSourceOrgId } from "@/hooks/useMarketing";
import { format } from "date-fns";

type FileType = "image" | "video" | "pdf" | "document" | "presentation" | "other";

function detectFileType(name: string, type?: string | null): FileType {
  const ext = name?.split(".").pop()?.toLowerCase() || "";
  const t = type?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext) || t.includes("image")) return "image";
  if (["mp4", "mov", "avi", "webm"].includes(ext) || t.includes("video")) return "video";
  if (ext === "pdf" || t.includes("pdf")) return "pdf";
  if (["doc", "docx", "xls", "xlsx", "csv"].includes(ext) || t.includes("document") || t.includes("spreadsheet")) return "document";
  if (["ppt", "pptx"].includes(ext) || t.includes("presentation")) return "presentation";
  return "other";
}

const fileTypeConfig: Record<FileType, { icon: React.ElementType; color: string; label: string }> = {
  image: { icon: Image, color: "text-blue-500", label: "Imagem" },
  video: { icon: Video, color: "text-purple-500", label: "Vídeo" },
  pdf: { icon: FileText, color: "text-red-500", label: "PDF" },
  document: { icon: FileSpreadsheet, color: "text-green-500", label: "Documento" },
  presentation: { icon: Presentation, color: "text-orange-500", label: "Apresentação" },
  other: { icon: File, color: "text-muted-foreground", label: "Arquivo" },
};

type MarketingCategory = "logo" | "dia-a-dia" | "setup" | "redes-sociais" | "campanhas" | "apresentacoes";

const categoryConfig: { id: MarketingCategory; label: string; description: string; icon: React.ElementType; gradient: string; iconBg: string; textColor: string }[] = [
  { id: "logo", label: "Logos", description: "Identidade visual e marca", icon: Palette, gradient: "from-blue-500/15 to-blue-500/5", iconBg: "bg-blue-500/20", textColor: "text-blue-600 dark:text-blue-400" },
  { id: "dia-a-dia", label: "Dia a Dia", description: "Materiais de uso cotidiano", icon: CalendarDays, gradient: "from-emerald-500/15 to-emerald-500/5", iconBg: "bg-emerald-500/20", textColor: "text-emerald-600 dark:text-emerald-400" },
  { id: "setup", label: "Setup Inicial", description: "Implantação da unidade", icon: Settings2, gradient: "from-purple-500/15 to-purple-500/5", iconBg: "bg-purple-500/20", textColor: "text-purple-600 dark:text-purple-400" },
  { id: "redes-sociais", label: "Redes Sociais", description: "Conteúdo mês a mês", icon: Share2, gradient: "from-pink-500/15 to-pink-500/5", iconBg: "bg-pink-500/20", textColor: "text-pink-600 dark:text-pink-400" },
  { id: "campanhas", label: "Campanhas", description: "Materiais de campanhas", icon: Megaphone, gradient: "from-orange-500/15 to-orange-500/5", iconBg: "bg-orange-500/20", textColor: "text-orange-600 dark:text-orange-400" },
  { id: "apresentacoes", label: "Apresentações", description: "Institucionais e comerciais", icon: MonitorPlay, gradient: "from-indigo-500/15 to-indigo-500/5", iconBg: "bg-indigo-500/20", textColor: "text-indigo-600 dark:text-indigo-400" },
];

type DbFolder = NonNullable<ReturnType<typeof useMarketingFolders>["data"]>[number];
type DbAsset = NonNullable<ReturnType<typeof useMarketingAssets>["data"]>[number];

export default function FranqueadoMateriais() {
  // Resolve to parent org (franqueadora) for content
  const { data: sourceOrgId, isLoading: loadingSource, isError: isErrorSource, error: errorSource, refetch: refetchSource } = useContentSourceOrgId();
  const { data: folders, isLoading: foldersLoading, isError: isErrorFolders } = useMarketingFolders(sourceOrgId || undefined);
  const { data: assets, isLoading: assetsLoading, isError: isErrorAssets } = useMarketingAssets(undefined, sourceOrgId || undefined);
  const [activeCategory, setActiveCategory] = useState<MarketingCategory | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FileType | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewAsset, setPreviewAsset] = useState<DbAsset | null>(null);

  const isLoading = loadingSource || foldersLoading || assetsLoading;
  const isError = isErrorSource || isErrorFolders || isErrorAssets;

  // Breadcrumb path within a category
  const breadcrumb = useMemo(() => {
    if (!folders) return [];
    const path: DbFolder[] = [];
    let id = currentFolderId;
    while (id) {
      const f = folders.find((f) => f.id === id);
      if (!f) break;
      path.unshift(f);
      id = f.parent_id;
    }
    return path;
  }, [folders, currentFolderId]);

  // Root folders of selected category
  const categoryRootFolders = useMemo(() => {
    if (!folders || !activeCategory) return [];
    return folders.filter((f) => (f as unknown as { category?: string }).category === activeCategory && !f.parent_id);
  }, [folders, activeCategory]);

  // Child folders of current folder
  const childFolders = useMemo(() => {
    if (!folders) return [];
    if (currentFolderId) return folders.filter((f) => f.parent_id === currentFolderId);
    return categoryRootFolders;
  }, [folders, currentFolderId, categoryRootFolders]);

  // Assets in current folder (or root category assets)
  const currentAssets = useMemo(() => {
    if (!assets) return [];
    let list: DbAsset[];
    if (currentFolderId) {
      list = assets.filter((a) => a.folder_id === currentFolderId);
    } else if (activeCategory) {
      // Show assets in root-level folders of this category
      const rootIds = categoryRootFolders.map((f) => f.id);
      list = assets.filter((a) => a.folder_id && rootIds.includes(a.folder_id));
      // Also show assets with no folder but matching category folders
      const noFolderAssets = assets.filter((a) => !a.folder_id);
      list = [...list, ...noFolderAssets]; // include unassigned at root
    } else {
      list = [];
    }
    if (search) list = list.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
    if (typeFilter) list = list.filter((a) => detectFileType(a.name, a.type) === typeFilter);
    return list;
  }, [assets, currentFolderId, activeCategory, categoryRootFolders, search, typeFilter]);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const isRedesSociaisRoot = activeCategory === "redes-sociais" && !currentFolderId;

  const monthFolderMap = useMemo(() => {
    if (!isRedesSociaisRoot || !folders) return {};
    const map: Record<string, DbFolder> = {};
    for (const f of categoryRootFolders) {
      const lower = f.name.toLowerCase().trim();
      monthNames.forEach((m, i) => {
        if (lower.includes(m.toLowerCase()) || lower === String(i + 1).padStart(2, "0")) {
          map[m] = f;
        }
      });
    }
    return map;
  }, [isRedesSociaisRoot, folders, categoryRootFolders]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBackToCategories = () => {
    setActiveCategory(null);
    setCurrentFolderId(null);
    setSearch("");
    setTypeFilter(null);
    setSelectedIds(new Set());
  };

  const handleNavigateFolder = (folderId: string) => {
    setCurrentFolderId(folderId);
    setSelectedIds(new Set());
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Materiais de Marketing" subtitle="Acesse materiais da franqueadora" icon={<FolderOpen className="w-5 h-5 text-primary" />} />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <h3 className="font-semibold text-destructive mb-1">Erro ao carregar materiais</h3>
          <p className="text-sm text-muted-foreground">{errorSource instanceof Error ? errorSource.message : "Não foi possível carregar os materiais de marketing."}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => refetchSource()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  // Category selection view
  if (!activeCategory) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Marketing" subtitle="Drive de materiais da franqueadora" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryConfig.map((cat) => {
            const Icon = cat.icon;
            const folderCount = (folders ?? []).filter((f) => (f as unknown as { category?: string }).category === cat.id).length;
            const assetCount = (assets ?? []).filter((a) => {
              const folder = (folders ?? []).find((f) => f.id === a.folder_id);
              return folder && (folder as unknown as { category?: string }).category === cat.id;
            }).length;
            return (
              <Card
                key={cat.id}
                className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br ${cat.gradient} border-0 group`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <CardContent className="p-6 space-y-3">
                  <div className={`w-12 h-12 rounded-2xl ${cat.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${cat.textColor}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{cat.label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span><strong className="text-foreground">{folderCount}</strong> pastas</span>
                    <span><strong className="text-foreground">{assetCount}</strong> arquivos</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const activeCatConfig = categoryConfig.find((c) => c.id === activeCategory)!;

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Marketing" subtitle={activeCatConfig.label} />

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        <button onClick={handleBackToCategories} className="text-primary hover:underline font-medium flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Marketing
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        <button
          onClick={() => setCurrentFolderId(null)}
          className={`font-medium ${currentFolderId ? "text-primary hover:underline" : "text-foreground"}`}
        >
          {activeCatConfig.label}
        </button>
        {breadcrumb.map((f) => (
          <span key={f.id} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <button
              onClick={() => handleNavigateFolder(f.id)}
              className="text-primary hover:underline font-medium"
            >
              {f.name}
            </button>
          </span>
        ))}
      </div>

      {/* Month grid for Redes Sociais */}
      {isRedesSociaisRoot && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">{currentYear}</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {monthNames.map((month, idx) => {
              const folder = monthFolderMap[month];
              const isPast = idx < currentMonth;
              const isCurrent = idx === currentMonth;
              return (
                <Card
                  key={month}
                  className={`cursor-pointer group transition-all hover:shadow-md ${
                    isCurrent ? "ring-2 ring-pink-500/50 bg-pink-500/5" : ""
                  } ${!folder && isPast ? "opacity-50" : ""}`}
                  onClick={() => folder && handleNavigateFolder(folder.id)}
                >
                  <CardContent className="p-4 text-center space-y-1">
                    <CalendarDays className={`w-6 h-6 mx-auto ${isCurrent ? "text-pink-500" : "text-muted-foreground/50 group-hover:text-primary"} transition-colors`} />
                    <p className={`text-xs font-bold ${isCurrent ? "text-pink-600 dark:text-pink-400" : ""}`}>{month}</p>
                    {folder ? (
                      <p className="text-[10px] text-muted-foreground">Disponível</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/40">—</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar arquivos..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar arquivos" className="pl-10" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(Object.entries(fileTypeConfig) as [FileType, typeof fileTypeConfig[FileType]][]).map(([key, cfg]) => (
            <Button
              key={key}
              variant={typeFilter === key ? "default" : "outline"}
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setTypeFilter(typeFilter === key ? null : key)}
            >
              <cfg.icon className="w-3.5 h-3.5" />
              {cfg.label}
            </Button>
          ))}
        </div>
        {selectedIds.size > 0 && (
          <Button size="sm" variant="outline" className="text-xs gap-1.5 ml-auto">
            <Download className="w-3.5 h-3.5" />
            Baixar {selectedIds.size} selecionado(s)
          </Button>
        )}
      </div>

      {/* Folders grid */}
      {childFolders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {childFolders.map((folder) => (
            <Card key={folder.id} className="hover:shadow-md cursor-pointer group transition-all" onClick={() => handleNavigateFolder(folder.id)}>
              <CardContent className="p-4 flex items-center gap-3">
                <FolderOpen className="w-8 h-8 text-primary/70 group-hover:text-primary transition-colors flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{folder.name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assets grid */}
      {currentAssets.length === 0 && childFolders.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-8 h-8" />}
          title="Nenhum material nesta pasta"
          description="Quando a franqueadora publicar materiais, eles aparecerão aqui."
        />
      ) : currentAssets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {currentAssets.map((asset) => {
            const ft = detectFileType(asset.name, asset.type);
            const cfg = fileTypeConfig[ft];
            const Icon = cfg.icon;
            const isSelected = selectedIds.has(asset.id);
            return (
              <Card key={asset.id} className={`hover:shadow-md group transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(asset.id)} className="mt-0.5" />
                    <div className="w-10 h-10 rounded-lg bg-muted/20 flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate">{asset.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px]">{cfg.label}</Badge>
                        {asset.tags && (asset.tags as string[]).length > 0 && (
                          <Badge variant="secondary" className="text-[9px]">
                            <Tag className="w-2.5 h-2.5 mr-0.5" />
                            {(asset.tags as string[])[0]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {ft === "image" && asset.url && (
                    <div className="mt-3 rounded-lg overflow-hidden bg-muted/10 aspect-video">
                      <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => setPreviewAsset(asset)}>
                      <Eye className="w-3.5 h-3.5 mr-1" /> Ver
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => asset.url && window.open(asset.url, "_blank")}>
                      <Download className="w-3.5 h-3.5 mr-1" /> Baixar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm">{previewAsset?.name}</DialogTitle>
          </DialogHeader>
          {previewAsset && (
            <div className="space-y-4">
              {detectFileType(previewAsset.name, previewAsset.type) === "image" && previewAsset.url && (
                <img src={previewAsset.url} alt={previewAsset.name} className="w-full rounded-lg" />
              )}
              {detectFileType(previewAsset.name, previewAsset.type) === "video" && previewAsset.url && (
                <video src={previewAsset.url} controls className="w-full rounded-lg" />
              )}
              {!["image", "video"].includes(detectFileType(previewAsset.name, previewAsset.type)) && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <File className="w-16 h-16 mb-3 text-muted-foreground/30" />
                  <p className="text-sm">Pré-visualização não disponível</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {previewAsset.created_at ? format(new Date(previewAsset.created_at), "dd/MM/yyyy HH:mm") : "—"}
                </div>
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  {fileTypeConfig[detectFileType(previewAsset.name, previewAsset.type)].label}
                </div>
              </div>
              <Button className="w-full" onClick={() => previewAsset.url && window.open(previewAsset.url, "_blank")}>
                <Download className="w-4 h-4 mr-2" /> Baixar arquivo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

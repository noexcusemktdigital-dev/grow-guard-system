import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download, Search, Folder, FolderOpen, Inbox, ChevronRight,
  Image, Video, FileText, FileSpreadsheet, Presentation, File,
  X, Eye, Calendar, Tag, Filter,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useMarketingFolders, useMarketingAssets } from "@/hooks/useMarketing";
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

type DbFolder = NonNullable<ReturnType<typeof useMarketingFolders>["data"]>[number];
type DbAsset = NonNullable<ReturnType<typeof useMarketingAssets>["data"]>[number];

export default function FranqueadoMateriais() {
  const { data: folders, isLoading: foldersLoading } = useMarketingFolders();
  const { data: assets, isLoading: assetsLoading } = useMarketingAssets();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FileType | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewAsset, setPreviewAsset] = useState<DbAsset | null>(null);

  const isLoading = foldersLoading || assetsLoading;

  // Build breadcrumb path
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

  // Get child folders of current
  const childFolders = useMemo(() => {
    if (!folders) return [];
    return folders.filter((f) => f.parent_id === currentFolderId);
  }, [folders, currentFolderId]);

  // Get assets in current folder
  const currentAssets = useMemo(() => {
    if (!assets) return [];
    let list = assets.filter((a) => (a.folder_id || null) === currentFolderId);
    if (search) list = list.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
    if (typeFilter) list = list.filter((a) => detectFileType(a.name, a.type) === typeFilter);
    return list;
  }, [assets, currentFolderId, search, typeFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Marketing" subtitle="Drive de materiais da franqueadora" />

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm">
        <button
          onClick={() => setCurrentFolderId(null)}
          className="text-primary hover:underline font-medium"
        >
          Raiz
        </button>
        {breadcrumb.map((f) => (
          <span key={f.id} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <button
              onClick={() => setCurrentFolderId(f.id)}
              className="text-primary hover:underline font-medium"
            >
              {f.name}
            </button>
          </span>
        ))}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar arquivos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1.5">
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
            <Card
              key={folder.id}
              className="glass-card hover-lift cursor-pointer group"
              onClick={() => setCurrentFolderId(folder.id)}
            >
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
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Nenhum material nesta pasta</p>
          <p className="text-xs text-muted-foreground mt-1">
            Quando a franqueadora publicar materiais, eles aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {currentAssets.map((asset) => {
            const ft = detectFileType(asset.name, asset.type);
            const cfg = fileTypeConfig[ft];
            const Icon = cfg.icon;
            const isSelected = selectedIds.has(asset.id);

            return (
              <Card key={asset.id} className={`glass-card hover-lift group ${isSelected ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(asset.id)}
                      className="mt-0.5"
                    />
                    <div className={`w-10 h-10 rounded-lg bg-muted/20 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate">{asset.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px]">
                          {cfg.label}
                        </Badge>
                        {asset.tags && (asset.tags as string[]).length > 0 && (
                          <Badge variant="secondary" className="text-[9px]">
                            <Tag className="w-2.5 h-2.5 mr-0.5" />
                            {(asset.tags as string[])[0]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail preview for images */}
                  {ft === "image" && asset.url && (
                    <div className="mt-3 rounded-lg overflow-hidden bg-muted/10 aspect-video">
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs flex-1"
                      onClick={() => setPreviewAsset(asset)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs flex-1"
                      onClick={() => asset.url && window.open(asset.url, "_blank")}
                    >
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

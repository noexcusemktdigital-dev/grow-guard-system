import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Download, Search, Folder, Eye, Image, FileText, Video, File,
} from "lucide-react";
import {
  allCategories, MarketingCategory, MarketingAsset,
  getCategoryLabel, getCategoryIcon, getCategoryDescription,
  getCategoryAssetCount, getChildFolders, getAssetsInFolder,
  getFormatIcon, mockAssets,
} from "@/data/marketingData";

type FormatFilter = "all" | "image" | "pdf" | "video" | "document";

const imageFormats = ["png", "jpg", "svg", "psd", "ai", "figma", "feed", "story", "reels", "carrossel"];
const videoFormats = ["mp4"];
const pdfFormats = ["pdf"];
const docFormats = ["doc", "ppt", "legenda"];

function matchesFormatFilter(format: string, filter: FormatFilter) {
  if (filter === "all") return true;
  if (filter === "image") return imageFormats.includes(format);
  if (filter === "video") return videoFormats.includes(format);
  if (filter === "pdf") return pdfFormats.includes(format);
  if (filter === "document") return docFormats.includes(format);
  return true;
}

export default function FranqueadoMateriais() {
  const [selectedCategory, setSelectedCategory] = useState<MarketingCategory | null>(null);
  const [folderPath, setFolderPath] = useState("");
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("all");
  const [previewAsset, setPreviewAsset] = useState<MarketingAsset | null>(null);

  // Breadcrumb parts
  const pathParts = folderPath ? folderPath.split("/") : [];

  // Current folders & assets
  const childFolders = selectedCategory ? getChildFolders(selectedCategory, folderPath) : [];
  const currentAssets = selectedCategory ? getAssetsInFolder(selectedCategory, folderPath) : [];

  // Global search across all published assets
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return mockAssets.filter(
      (a) =>
        a.isPublished &&
        (a.title.toLowerCase().includes(q) ||
          a.fileName.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))) &&
        matchesFormatFilter(a.format, formatFilter)
    );
  }, [search, formatFilter]);

  const isSearching = search.trim().length > 0;

  const filteredAssets = isSearching
    ? searchResults
    : currentAssets.filter((a) => a.isPublished && matchesFormatFilter(a.format, formatFilter));

  // Navigate helpers
  const goToCategory = (cat: MarketingCategory) => {
    setSelectedCategory(cat);
    setFolderPath("");
    setSearch("");
  };
  const goToFolder = (path: string) => setFolderPath(path);
  const goBack = () => {
    if (folderPath) {
      const parts = folderPath.split("/");
      parts.pop();
      setFolderPath(parts.join("/"));
    } else {
      setSelectedCategory(null);
    }
  };

  const formatFilters: { label: string; value: FormatFilter; icon: React.ElementType }[] = [
    { label: "Todos", value: "all", icon: File },
    { label: "Imagem", value: "image", icon: Image },
    { label: "PDF", value: "pdf", icon: FileText },
    { label: "Vídeo", value: "video", icon: Video },
    { label: "Documento", value: "document", icon: FileText },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Marketing" subtitle="Materiais sincronizados com a franqueadora" />

      {/* Search + Format Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar materiais..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {formatFilters.map((f) => (
            <Button
              key={f.value}
              variant={formatFilter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFormatFilter(f.value)}
              className="text-xs"
            >
              <f.icon className="w-3.5 h-3.5 mr-1" />
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Category Cards (when no category selected and not searching) */}
      {!selectedCategory && !isSearching && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {allCategories.map((cat) => {
            const Icon = getCategoryIcon(cat);
            const count = getCategoryAssetCount(cat);
            return (
              <Card
                key={cat}
                className="glass-card hover-lift cursor-pointer group"
                onClick={() => goToCategory(cat)}
              >
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xs font-bold mb-1">{getCategoryLabel(cat)}</h3>
                  <p className="text-[10px] text-muted-foreground mb-2">{getCategoryDescription(cat)}</p>
                  <Badge variant="secondary" className="text-[10px]">{count} arquivos</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Breadcrumb + Drive */}
      {selectedCategory && !isSearching && (
        <>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink className="cursor-pointer" onClick={() => { setSelectedCategory(null); setFolderPath(""); }}>
                  Marketing
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {pathParts.length === 0 ? (
                <BreadcrumbItem>
                  <BreadcrumbPage>{getCategoryLabel(selectedCategory)}</BreadcrumbPage>
                </BreadcrumbItem>
              ) : (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer" onClick={() => setFolderPath("")}>
                      {getCategoryLabel(selectedCategory)}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {pathParts.map((part, i) => {
                    const isLast = i === pathParts.length - 1;
                    const partialPath = pathParts.slice(0, i + 1).join("/");
                    return (
                      <span key={i} className="contents">
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage>{part}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink className="cursor-pointer" onClick={() => goToFolder(partialPath)}>
                              {part}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </span>
                    );
                  })}
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Folders */}
          {childFolders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {childFolders.map((folder) => (
                <Card
                  key={folder.id}
                  className="glass-card hover-lift cursor-pointer group"
                  onClick={() => goToFolder(folder.path)}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <Folder className="w-10 h-10 text-primary/70 mb-2 group-hover:text-primary transition-colors" />
                    <p className="text-xs font-medium truncate w-full">{folder.name}</p>
                    <p className="text-[10px] text-muted-foreground">{folder.childCount} itens</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Search results label */}
      {isSearching && (
        <p className="text-sm text-muted-foreground">
          {filteredAssets.length} resultado{filteredAssets.length !== 1 && "s"} para "{search}"
        </p>
      )}

      {/* Asset List */}
      {filteredAssets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAssets.map((asset) => {
            const FormatIcon = getFormatIcon(asset.format);
            return (
              <Card key={asset.id} className="glass-card hover-lift group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/20 flex items-center justify-center flex-shrink-0">
                      <FormatIcon className="w-5 h-5 text-primary/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate">{asset.title}</h4>
                      <p className="text-[10px] text-muted-foreground truncate">{asset.fileName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px]">{asset.format.toUpperCase()}</Badge>
                        <span className="text-[10px] text-muted-foreground">{asset.fileSize}</span>
                        <span className="text-[10px] text-muted-foreground">{asset.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="ghost" size="sm" className="text-xs flex-1" onClick={() => setPreviewAsset(asset)}>
                      <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs flex-1">
                      <Download className="w-3.5 h-3.5 mr-1" /> Baixar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {selectedCategory && !isSearching && childFolders.length === 0 && filteredAssets.length === 0 && (
        <div className="text-center py-16">
          <Folder className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum arquivo nesta pasta</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={goBack}>
            Voltar
          </Button>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">{previewAsset?.title}</DialogTitle>
          </DialogHeader>
          {previewAsset && (
            <div className="space-y-4">
              <div className="w-full h-48 bg-muted/10 rounded-lg flex items-center justify-center">
                {(() => {
                  const FIcon = getFormatIcon(previewAsset.format);
                  return <FIcon className="w-16 h-16 text-muted-foreground/30" />;
                })()}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Arquivo</p>
                  <p className="font-medium">{previewAsset.fileName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Formato</p>
                  <Badge variant="outline" className="text-[9px]">{previewAsset.format.toUpperCase()}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Tamanho</p>
                  <p className="font-medium">{previewAsset.fileSize}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">{previewAsset.createdAt}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {previewAsset.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[9px]">{t}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Versão</p>
                  <p className="font-medium">{previewAsset.version}</p>
                </div>
              </div>
              <Button className="w-full">
                <Download className="w-4 h-4 mr-2" /> Baixar Arquivo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

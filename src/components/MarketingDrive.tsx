import { useState } from "react";
import {
  FolderOpen, Download, Pencil, Trash2, ChevronRight, FolderArchive,
  FolderPlus, Upload, MoreVertical, Play, ImageIcon, FileText, FileArchive, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  type MarketingCategory,
  type MarketingAsset,
  type MarketingFormat,
  getChildFolders,
  getAssetsInFolder,
  getCategoryLabel,
  getCategoryColor,
  getFormatIcon,
  monthLabels,
} from "@/data/marketingData";

interface MarketingDriveProps {
  category: MarketingCategory;
  searchQuery: string;
  filterMonth: string;
  filterProduct: string;
  filterFormat: string;
  filterCampaign: string;
  filterStatus: string;
  onEdit?: (asset: MarketingAsset) => void;
  onUpload?: (folder: string) => void;
}

const imageFormats: MarketingFormat[] = ["png", "jpg", "svg", "psd", "ai", "figma", "feed", "story", "reels", "carrossel"];
const videoFormats: MarketingFormat[] = ["mp4"];
const archiveFormats: MarketingFormat[] = ["zip"];

function getPreviewIcon(format: MarketingFormat) {
  if (imageFormats.includes(format)) return ImageIcon;
  if (videoFormats.includes(format)) return Play;
  if (archiveFormats.includes(format)) return FileArchive;
  return FileText;
}

function getPreviewColor(format: MarketingFormat) {
  if (imageFormats.includes(format)) return "bg-blue-500/10 text-blue-500";
  if (videoFormats.includes(format)) return "bg-rose-500/10 text-rose-500";
  if (archiveFormats.includes(format)) return "bg-amber-500/10 text-amber-500";
  return "bg-emerald-500/10 text-emerald-500";
}

const folderColorMap: Record<string, string> = {
  blue: "text-blue-500",
  orange: "text-orange-500",
  purple: "text-purple-500",
  emerald: "text-emerald-500",
  rose: "text-rose-500",
  amber: "text-amber-500",
};

export function MarketingDrive({
  category,
  searchQuery,
  filterMonth,
  filterProduct,
  filterFormat,
  filterCampaign,
  filterStatus,
  onUpload,
}: MarketingDriveProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [detailAsset, setDetailAsset] = useState<MarketingAsset | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const { toast } = useToast();

  const pathString = currentPath.join("/");
  const folders = getChildFolders(category, pathString);
  let assets = getAssetsInFolder(category, pathString);

  // Apply filters
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    assets = assets.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.fileName.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (filterMonth && filterMonth !== "all") assets = assets.filter((a) => String(a.month) === filterMonth);
  if (filterProduct && filterProduct !== "all") assets = assets.filter((a) => a.product === filterProduct);
  if (filterFormat && filterFormat !== "all") assets = assets.filter((a) => a.format === filterFormat);
  if (filterCampaign && filterCampaign !== "all") assets = assets.filter((a) => a.campaign === filterCampaign);
  if (filterStatus && filterStatus !== "all") assets = assets.filter((a) => filterStatus === "published" ? a.isPublished : !a.isPublished);

  const breadcrumbParts = [getCategoryLabel(category), ...currentPath];
  const catColor = getCategoryColor(category);
  const folderIconColor = folderColorMap[catColor] || "text-amber-500";

  const handleDownload = (asset: MarketingAsset) => {
    toast({ title: "Download iniciado", description: asset.fileName });
  };

  const handleDelete = (asset: MarketingAsset) => {
    toast({ title: "Material excluído", description: asset.title, variant: "destructive" });
  };

  const handleZipDownload = () => {
    toast({ title: "Em breve", description: "Download de pasta como ZIP estará disponível em breve." });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    toast({ title: "Pasta criada", description: `"${newFolderName}" criada com sucesso.` });
    setNewFolderName("");
    setNewFolderOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap flex-1 min-w-0">
          <button onClick={() => setCurrentPath([])} className="hover:text-foreground transition-colors font-medium">
            {getCategoryLabel(category)}
          </button>
          {currentPath.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5" />
              <button onClick={() => setCurrentPath(currentPath.slice(0, i + 1))} className="hover:text-foreground transition-colors">
                {part}
              </button>
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setNewFolderOpen(true)}>
            <FolderPlus className="w-3.5 h-3.5" /> Nova Pasta
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onUpload?.(pathString)}>
            <Upload className="w-3.5 h-3.5" /> Upload
          </Button>
          {currentPath.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleZipDownload} className="gap-1.5">
              <FolderArchive className="w-3.5 h-3.5" /> ZIP
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Folders Grid */}
      {folders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {folders.map((folder) => (
            <Card
              key={folder.id}
              className="p-5 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 group border"
              onClick={() => setCurrentPath([...currentPath, folder.name])}
            >
              <div className="flex items-center gap-3">
                <FolderOpen className={`w-9 h-9 ${folderIconColor} flex-shrink-0`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                    {folder.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {folder.childCount} {folder.childCount === 1 ? "item" : "itens"}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Assets list */}
      {assets.length > 0 && (
        <div className="space-y-1">
          {folders.length > 0 && (
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-2 pb-1">
              Arquivos
            </h4>
          )}
          {assets.map((asset, index) => {
            const FormatIcon = getFormatIcon(asset.format);
            const thumbColor = getPreviewColor(asset.format);
            const ThumbIcon = getPreviewIcon(asset.format);
            return (
              <div key={asset.id}>
                <Card
                  className="p-4 cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => setDetailAsset(asset)}
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${thumbColor}`}>
                      <ThumbIcon className="w-5 h-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{asset.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {asset.fileSize} · {asset.version} · {asset.createdAt}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                          {asset.format.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {asset.product}
                        </Badge>
                        {asset.campaign && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {asset.campaign}
                          </Badge>
                        )}
                        {asset.isPublished ? (
                          <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/15 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20">
                            Publicado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Rascunho
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(asset); }}>
                          <Download className="w-4 h-4 mr-2" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                          <Pencil className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDelete(asset); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
                {index < assets.length - 1 && <div className="h-px" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {folders.length === 0 && assets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 opacity-40" />
          </div>
          <p className="text-sm font-medium mb-1">Nenhum material nesta pasta</p>
          <p className="text-xs text-muted-foreground mb-4">Comece adicionando arquivos ou criando pastas</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setNewFolderOpen(true)}>
              <FolderPlus className="w-3.5 h-3.5" /> Criar pasta
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => onUpload?.(pathString)}>
              <Upload className="w-3.5 h-3.5" /> Fazer upload
            </Button>
          </div>
        </div>
      )}

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nome da pasta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rich Preview Dialog */}
      <Dialog open={!!detailAsset} onOpenChange={() => setDetailAsset(null)}>
        <DialogContent className="max-w-2xl">
          {detailAsset && (() => {
            const PreviewIcon = getPreviewIcon(detailAsset.format);
            const previewColor = getPreviewColor(detailAsset.format);
            const isImage = imageFormats.includes(detailAsset.format);
            const isVideo = videoFormats.includes(detailAsset.format);
            const isZip = archiveFormats.includes(detailAsset.format);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg">{detailAsset.title}</DialogTitle>
                </DialogHeader>

                {/* Preview Area */}
                <div className={`rounded-xl h-48 flex flex-col items-center justify-center gap-3 ${previewColor}`}>
                  <PreviewIcon className="w-12 h-12" />
                  <span className="text-sm font-medium uppercase">
                    {isImage ? detailAsset.format : isVideo ? "Vídeo" : isZip ? "Arquivo ZIP" : "Documento"}
                  </span>
                  {!isImage && !isVideo && (
                    <span className="text-xs opacity-70">Clique para abrir</span>
                  )}
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><span className="text-muted-foreground">Arquivo:</span> <span className="font-medium">{detailAsset.fileName}</span></div>
                  <div><span className="text-muted-foreground">Tamanho:</span> <span className="font-medium">{detailAsset.fileSize}</span></div>
                  <div><span className="text-muted-foreground">Formato:</span> <span className="font-medium">{detailAsset.format.toUpperCase()}</span></div>
                  <div><span className="text-muted-foreground">Versão:</span> <span className="font-medium">{detailAsset.version}</span></div>
                  <div><span className="text-muted-foreground">Produto:</span> <span className="font-medium">{detailAsset.product}</span></div>
                  <div><span className="text-muted-foreground">Mês:</span> <span className="font-medium">{monthLabels[detailAsset.month - 1]} {detailAsset.year}</span></div>
                  {detailAsset.campaign && (
                    <div className="col-span-2"><span className="text-muted-foreground">Campanha:</span> <span className="font-medium">{detailAsset.campaign}</span></div>
                  )}
                  <div><span className="text-muted-foreground">Enviado por:</span> <span className="font-medium">{detailAsset.uploadedBy}</span></div>
                  <div><span className="text-muted-foreground">Data:</span> <span className="font-medium">{detailAsset.createdAt}</span></div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    {detailAsset.isPublished ? (
                      <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/15 text-emerald-600 border-emerald-200">Publicado</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Rascunho</Badge>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {detailAsset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {detailAsset.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 gap-2" onClick={() => handleDownload(detailAsset)}>
                    <Download className="w-4 h-4" /> Download
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Pencil className="w-4 h-4" /> Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" /> Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir material?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{detailAsset.title}" será removido permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { handleDelete(detailAsset); setDetailAsset(null); }}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

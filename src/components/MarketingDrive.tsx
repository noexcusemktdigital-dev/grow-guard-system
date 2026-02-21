import { useState } from "react";
import { FolderOpen, Download, Eye, Pencil, Trash2, ChevronRight, FolderArchive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  type MarketingCategory,
  type MarketingAsset,
  getChildFolders,
  getAssetsInFolder,
  getCategoryLabel,
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
}

export function MarketingDrive({
  category,
  searchQuery,
  filterMonth,
  filterProduct,
  filterFormat,
  filterCampaign,
  filterStatus,
}: MarketingDriveProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [detailAsset, setDetailAsset] = useState<MarketingAsset | null>(null);
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
  if (filterMonth && filterMonth !== "all") {
    assets = assets.filter((a) => String(a.month) === filterMonth);
  }
  if (filterProduct && filterProduct !== "all") {
    assets = assets.filter((a) => a.product === filterProduct);
  }
  if (filterFormat && filterFormat !== "all") {
    assets = assets.filter((a) => a.format === filterFormat);
  }
  if (filterCampaign && filterCampaign !== "all") {
    assets = assets.filter((a) => a.campaign === filterCampaign);
  }
  if (filterStatus && filterStatus !== "all") {
    assets = assets.filter((a) =>
      filterStatus === "published" ? a.isPublished : !a.isPublished
    );
  }

  const breadcrumbParts = [getCategoryLabel(category), ...currentPath];

  const handleDownload = (asset: MarketingAsset) => {
    toast({ title: "Download iniciado", description: asset.fileName });
  };

  const handleDelete = (asset: MarketingAsset) => {
    toast({ title: "Material excluído", description: asset.title, variant: "destructive" });
  };

  const handleZipDownload = () => {
    toast({ title: "Em breve", description: "Download de pasta como ZIP estará disponível em breve." });
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        <button
          onClick={() => setCurrentPath([])}
          className="hover:text-foreground transition-colors font-medium"
        >
          {getCategoryLabel(category)}
        </button>
        {currentPath.map((part, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5" />
            <button
              onClick={() => setCurrentPath(currentPath.slice(0, i + 1))}
              className="hover:text-foreground transition-colors"
            >
              {part}
            </button>
          </span>
        ))}
        {currentPath.length > 0 && (
          <>
            <span className="ml-auto" />
            <Button variant="outline" size="sm" onClick={handleZipDownload} className="gap-1.5">
              <FolderArchive className="w-3.5 h-3.5" />
              Baixar pasta como ZIP
            </Button>
          </>
        )}
      </div>

      {/* Folders Grid */}
      {folders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {folders.map((folder) => (
            <Card
              key={folder.id}
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => setCurrentPath([...currentPath, folder.name])}
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="w-8 h-8 text-amber-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
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
        <div className="space-y-2">
          {folders.length > 0 && (
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-2">
              Arquivos
            </h4>
          )}
          {assets.map((asset) => {
            const FormatIcon = getFormatIcon(asset.format);
            return (
              <Card key={asset.id} className="p-3">
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <FormatIcon className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{asset.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{asset.fileName}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {asset.format}
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

                  <div className="hidden sm:flex flex-col items-end gap-0.5 text-xs text-muted-foreground flex-shrink-0">
                    <span>{asset.version}</span>
                    <span>{asset.fileSize}</span>
                    <span>{asset.createdAt}</span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(asset)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailAsset(asset)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir material?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{asset.title}" será removido permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(asset)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {folders.length === 0 && assets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">Nenhum material nesta pasta</p>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailAsset} onOpenChange={() => setDetailAsset(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{detailAsset?.title}</DialogTitle>
          </DialogHeader>
          {detailAsset && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Arquivo:</span> {detailAsset.fileName}</div>
                <div><span className="text-muted-foreground">Tamanho:</span> {detailAsset.fileSize}</div>
                <div><span className="text-muted-foreground">Formato:</span> {detailAsset.format}</div>
                <div><span className="text-muted-foreground">Versão:</span> {detailAsset.version}</div>
                <div><span className="text-muted-foreground">Produto:</span> {detailAsset.product}</div>
                <div><span className="text-muted-foreground">Mês:</span> {monthLabels[detailAsset.month - 1]} {detailAsset.year}</div>
                {detailAsset.campaign && (
                  <div className="col-span-2"><span className="text-muted-foreground">Campanha:</span> {detailAsset.campaign}</div>
                )}
                <div><span className="text-muted-foreground">Enviado por:</span> {detailAsset.uploadedBy}</div>
                <div><span className="text-muted-foreground">Data:</span> {detailAsset.createdAt}</div>
                <div><span className="text-muted-foreground">Status:</span> {detailAsset.isPublished ? "Publicado" : "Rascunho"}</div>
              </div>
              {detailAsset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {detailAsset.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
              <Button className="w-full gap-2" onClick={() => handleDownload(detailAsset)}>
                <Download className="w-4 h-4" /> Baixar arquivo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

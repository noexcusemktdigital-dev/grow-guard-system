import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, ChevronDown, FolderOpen } from "lucide-react";
import {
  type MarketingCategory,
  type MarketingFormat,
  type MarketingProduct,
  allFormats,
  allProducts,
  getCategoryLabel,
  monthLabels,
} from "@/types/marketing";

interface MarketingUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory: MarketingCategory;
  currentFolder?: string;
}

const extensionToFormat: Record<string, MarketingFormat> = {
  png: "png", jpg: "jpg", jpeg: "jpg", svg: "svg", psd: "psd", ai: "ai",
  mp4: "mp4", pdf: "pdf", pptx: "ppt", docx: "doc", zip: "zip",
  fig: "figma",
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MarketingUpload({ open, onOpenChange, defaultCategory, currentFolder }: MarketingUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const currentMonth = String(new Date().getMonth() + 1);
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState("2026");
  const [product, setProduct] = useState<MarketingProduct>("Geral");
  const [format, setFormat] = useState<MarketingFormat | "">("");
  const [campaign, setCampaign] = useState("");
  const [tags, setTags] = useState("");
  const [version, setVersion] = useState("v1");

  const isValid = title.trim() && files.length > 0;

  const detectFormat = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    return extensionToFormat[ext] || "";
  }, []);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    setFiles((prev) => [...prev, ...arr]);
    if (arr.length > 0 && !format) {
      const detected = detectFormat(arr[0]);
      if (detected) setFormat(detected);
    }
  }, [format, detectFormat]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleSave = (publish: boolean) => {
    if (!isValid) {
      toast({ title: "Preencha título e adicione pelo menos um arquivo", variant: "destructive" });
      return;
    }
    toast({
      title: publish ? "Material publicado" : "Rascunho salvo",
      description: `${title} (${files.length} arquivo${files.length > 1 ? "s" : ""})`,
    });
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle("");
    setFiles([]);
    setFormat("");
    setMonth(currentMonth);
    setYear("2026");
    setProduct("Geral");
    setCampaign("");
    setTags("");
    setVersion("v1");
    setMoreOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Upload</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Context badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="gap-1">
              {getCategoryLabel(defaultCategory)}
            </Badge>
            {currentFolder && (
              <Badge variant="outline" className="gap-1 text-xs">
                <FolderOpen className="w-3 h-3" />
                {currentFolder}
              </Badge>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do material" autoFocus />
          </div>

          {/* Drag & Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
              dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/40"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
            />
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Arraste arquivos ou <span className="text-primary font-medium">clique para selecionar</span>
            </p>
          </div>

          {/* Selected files list */}
          {files.length > 0 && (
            <div className="space-y-1.5">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Collapsible extra fields */}
          <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              Mais opções
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Formato</Label>
                  <Select value={format} onValueChange={(v) => setFormat(v as MarketingFormat)}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Auto-detectado" /></SelectTrigger>
                    <SelectContent>
                      {allFormats.map((f) => (
                        <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Produto</Label>
                  <Select value={product} onValueChange={(v) => setProduct(v as MarketingProduct)}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allProducts.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Mês</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {monthLabels.map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ano</Label>
                  <Input className="h-9 text-xs" value={year} onChange={(e) => setYear(e.target.value)} type="number" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Versão</Label>
                  <Input className="h-9 text-xs" value={version} onChange={(e) => setVersion(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Campanha</Label>
                  <Input className="h-9 text-xs" value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="Opcional" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tags</Label>
                  <Input className="h-9 text-xs" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Separar por vírgula" />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={!isValid}>
            Salvar Rascunho
          </Button>
          <Button onClick={() => handleSave(true)} disabled={!isValid}>
            Publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

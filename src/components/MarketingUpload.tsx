import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  type MarketingCategory,
  type MarketingFormat,
  type MarketingProduct,
  allCategories,
  allFormats,
  allProducts,
  getCategoryLabel,
  monthLabels,
} from "@/data/marketingData";

interface MarketingUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: MarketingCategory;
}

export function MarketingUpload({ open, onOpenChange, defaultCategory }: MarketingUploadProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MarketingCategory | "">("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("2026");
  const [product, setProduct] = useState<MarketingProduct | "">("");
  const [format, setFormat] = useState<MarketingFormat | "">("");
  const [campaign, setCampaign] = useState("");
  const [tags, setTags] = useState("");
  const [version, setVersion] = useState("v1");

  const isValid = title && category && month && year && product && format;

  const handleSave = (publish: boolean) => {
    if (!isValid) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    toast({
      title: publish ? "Material publicado" : "Rascunho salvo",
      description: title,
    });
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setMonth("");
    setYear("2026");
    setProduct("");
    setFormat("");
    setCampaign("");
    setTags("");
    setVersion("v1");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Upload</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do material" />
          </div>

          <div className="space-y-1.5">
            <Label>Arquivo</Label>
            <Input type="file" multiple />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de Material *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as MarketingCategory)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {allCategories.map((c) => (
                    <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Formato *</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as MarketingFormat)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {allFormats.map((f) => (
                    <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Mês *</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                <SelectContent>
                  {monthLabels.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ano *</Label>
              <Input value={year} onChange={(e) => setYear(e.target.value)} type="number" />
            </div>
            <div className="space-y-1.5">
              <Label>Produto *</Label>
              <Select value={product} onValueChange={(v) => setProduct(v as MarketingProduct)}>
                <SelectTrigger><SelectValue placeholder="Produto" /></SelectTrigger>
                <SelectContent>
                  {allProducts.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Campanha</Label>
              <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="space-y-1.5">
              <Label>Versão</Label>
              <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v1" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Separar por vírgula" />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={!isValid}>
            Salvar como Rascunho
          </Button>
          <Button onClick={() => handleSave(true)} disabled={!isValid}>
            Publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

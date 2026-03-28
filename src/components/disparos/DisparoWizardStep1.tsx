import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface Step1Data {
  name: string;
  message: string;
  imageUrl: string;
}

interface Props {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
}

export function DisparoWizardStep1({ data, onChange }: Props) {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from("dispatch-media").upload(path, file);
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("dispatch-media").getPublicUrl(path);
    onChange({ ...data, imageUrl: urlData.publicUrl });
    setUploading(false);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs">Nome do disparo *</Label>
        <Input
          placeholder="Ex: Promoção de março"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Mensagem *</Label>
        <Textarea
          placeholder="Digite a mensagem... Use {{nome}} para personalizar"
          className="min-h-[120px]"
          value={data.message}
          onChange={(e) => onChange({ ...data, message: e.target.value })}
        />
        <p className="text-[10px] text-muted-foreground">
          Variáveis disponíveis: <code className="bg-muted px-1 rounded">{"{{nome}}"}</code>
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Imagem (opcional)</Label>
        {data.imageUrl ? (
          <div className="relative inline-block">
            <img src={data.imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded-lg border" />
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={() => onChange({ ...data, imageUrl: "" })}
             aria-label="Remover imagem">
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <label className="flex items-center gap-2 px-4 py-3 border border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
            <ImagePlus className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {uploading ? "Enviando..." : "Clique para adicionar imagem (max 5MB)"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {/* Message preview */}
      {data.message && (
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground">Preview</Label>
          <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-3 max-w-xs">
            {data.imageUrl && (
              <img src={data.imageUrl} alt="Pré-visualização do disparo" className="w-full h-32 object-cover rounded-lg mb-2" />
            )}
            <p className="text-xs whitespace-pre-wrap">{data.message}</p>
            <p className="text-[9px] text-muted-foreground text-right mt-1">
              {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

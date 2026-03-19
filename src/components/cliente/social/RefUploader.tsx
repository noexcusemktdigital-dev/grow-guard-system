import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { VisualIdentity } from "@/hooks/useVisualIdentity";

interface RefUploaderProps {
  referenceUrls: string[];
  setReferenceUrls: React.Dispatch<React.SetStateAction<string[]>>;
  orgId: string | undefined;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  required?: boolean;
  min?: number;
  visualIdentity?: VisualIdentity | null;
}

export function RefUploader({
  referenceUrls, setReferenceUrls, orgId,
  uploading, setUploading, required, min, visualIdentity,
}: RefUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !orgId) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `references/${orgId}/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage.from("social-arts").upload(path, file);
      if (error) {
        toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
      } else {
        const { data: urlData } = supabase.storage.from("social-arts").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
    }
    setReferenceUrls((prev) => [...prev, ...newUrls]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Upload className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Referências visuais</p>
        {required && <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>}
      </div>
      <div className="flex flex-wrap gap-2">
        {referenceUrls.map((url, i) => (
          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-border group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              onClick={() => setReferenceUrls((prev) => prev.filter((_, j) => j !== i))}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ))}
        <button
          className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors gap-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          <span className="text-[10px]">Upload</span>
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />

      {/* Image bank from visual identity */}
      {visualIdentity?.image_bank_urls && visualIdentity.image_bank_urls.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Banco de imagens da marca:</p>
          <div className="flex flex-wrap gap-2">
            {visualIdentity.image_bank_urls.filter(url => !referenceUrls.includes(url)).slice(0, 6).map((url, i) => (
              <button
                key={i}
                className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors"
                onClick={() => setReferenceUrls(prev => [...prev, url])}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Plus className="w-4 h-4 text-primary-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {min && (
        <p className={`text-xs ${referenceUrls.length >= min ? "text-green-600" : "text-muted-foreground"}`}>
          {referenceUrls.length >= min
            ? `✓ ${referenceUrls.length} referências anexadas`
            : `Envie pelo menos ${min} imagens (${referenceUrls.length}/${min})`}
        </p>
      )}
    </div>
  );
}

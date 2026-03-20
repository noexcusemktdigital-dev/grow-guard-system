import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Plus, Loader2, Star, ImageIcon, Wand2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { VisualIdentity } from "@/hooks/useVisualIdentity";
import { Button } from "@/components/ui/button";

interface RefUploaderProps {
  referenceUrls: string[];
  setReferenceUrls: React.Dispatch<React.SetStateAction<string[]>>;
  orgId: string | undefined;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  required?: boolean;
  min?: number;
  visualIdentity?: VisualIdentity | null;
  /** Dedicated logo URL (separate from references) */
  logoUrl?: string;
  setLogoUrl?: (url: string) => void;
  /** Index of the primary/favorite reference */
  primaryRefIndex?: number;
  setPrimaryRefIndex?: (i: number) => void;
}

export function RefUploader({
  referenceUrls, setReferenceUrls, orgId,
  uploading, setUploading, required, min, visualIdentity,
  logoUrl, setLogoUrl, primaryRefIndex, setPrimaryRefIndex,
}: RefUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [extractingLogo, setExtractingLogo] = useState(false);

  const handleExtractLogo = async () => {
    if (!orgId || referenceUrls.length === 0 || !setLogoUrl) return;
    setExtractingLogo(true);
    try {
      const resp = await supabase.functions.invoke("generate-social-image", {
        body: {
          extract_logo: true,
          reference_images: referenceUrls.slice(0, 3),
          organization_id: orgId,
        },
      });
      if (resp.error) throw new Error(resp.error.message);
      if (resp.data?.error) throw new Error(resp.data.error);
      if (resp.data?.logo_url) {
        setLogoUrl(resp.data.logo_url);
        toast({ title: "Logo extraída com sucesso!", description: "A logo foi detectada nas referências." });
      } else {
        toast({ title: "Não foi possível extrair a logo", description: "Tente enviar a logo manualmente.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao extrair logo", description: err.message, variant: "destructive" });
    } finally {
      setExtractingLogo(false);
    }
  };

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId || !setLogoUrl) return;
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `logos/${orgId}/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage.from("social-arts").upload(path, file);
    if (error) {
      toast({ title: "Erro ao enviar logo", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("social-arts").getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
    }
    setUploading(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Logo upload section */}
      {setLogoUrl && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Logo da marca</p>
            <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>
          </div>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-primary group">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain bg-white p-1" />
                <button
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  onClick={() => setLogoUrl("")}
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <button
                className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors gap-1"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                <span className="text-[10px]">Logo</span>
              </button>
            )}
            {!logoUrl && visualIdentity?.logo_url && (
              <button
                className="text-xs text-primary underline hover:no-underline"
                onClick={() => setLogoUrl(visualIdentity.logo_url!)}
              >
                Usar logo cadastrada
              </button>
            )}
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          <p className="text-[10px] text-muted-foreground">A logo será inserida na arte exatamente como enviada.</p>
          {!logoUrl && referenceUrls.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleExtractLogo}
              disabled={extractingLogo}
            >
              {extractingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              Extrair logo das referências
            </Button>
          )}
        </div>
      )}

      {/* References upload section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">Referências visuais</p>
          {required && <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          {referenceUrls.map((url, i) => (
            <div key={i} className="relative group">
              <div className={`w-20 h-20 rounded-xl overflow-hidden border-2 ${primaryRefIndex === i ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
              {/* Primary star indicator */}
              {setPrimaryRefIndex && (
                <button
                  className={`absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${primaryRefIndex === i ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"}`}
                  onClick={(e) => { e.stopPropagation(); setPrimaryRefIndex(i); }}
                  title={primaryRefIndex === i ? "Referência principal" : "Marcar como principal"}
                >
                  <Star className={`w-3 h-3 ${primaryRefIndex === i ? "fill-current" : ""}`} />
                </button>
              )}
              {/* Remove button */}
              <button
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
                onClick={() => {
                  setReferenceUrls((prev) => prev.filter((_, j) => j !== i));
                  if (setPrimaryRefIndex && primaryRefIndex === i) setPrimaryRefIndex(0);
                  if (setPrimaryRefIndex && primaryRefIndex !== undefined && primaryRefIndex > i) setPrimaryRefIndex(primaryRefIndex - 1);
                }}
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

        {setPrimaryRefIndex && referenceUrls.length > 1 && (
          <p className="text-[10px] text-muted-foreground">
            ⭐ Clique na estrela para marcar a referência principal (peso 60%). As demais dividem 40%.
          </p>
        )}

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
    </div>
  );
}

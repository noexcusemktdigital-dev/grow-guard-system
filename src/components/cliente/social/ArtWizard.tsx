import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { RefUploader } from "./RefUploader";
import { LayoutPicker } from "./LayoutPicker";
import { ContentPickerDialog } from "./ContentPickerDialog";
import {
  ART_FORMATS, LAYOUT_TYPES, POST_TYPES, ART_OBJECTIVES,
  PRINT_FORMATS, PRINT_TYPES,
} from "./constants";
import { ContentItem } from "@/hooks/useClienteContentV2";
import { VisualIdentity } from "@/hooks/useVisualIdentity";
import {
  Check, FileText, X, Wand2, Loader2, AlertTriangle, Sparkles, ArrowLeft, Pencil, Plus,
  Upload, Star, Camera, Info,
} from "lucide-react";

interface ArtWizardProps {
  orgId: string | undefined;
  visualIdentity: VisualIdentity | null | undefined;
  contentHistory: ContentItem[] | undefined;
  contentData: any;
  setContentData: (d: any) => void;
  contentId: string | null;
  setContentId: (id: string | null) => void;
  briefingFilled: boolean;
  setBriefingFilled: (v: boolean) => void;
  onGenerate: (payload: ArtGeneratePayload) => void;
  onFillWithAI: (briefingText: string, contentData: any) => Promise<ArtBriefingResult | null>;
  isFillingAI: boolean;
  canAfford: boolean;
  creditCost: number;
  onBack: () => void;
}

export interface ArtGeneratePayload {
  format: string;
  formats?: string[];
  style: string;
  tipoPostagem: string;
  headline: string;
  subheadline: string;
  cta: string;
  cena: string;
  elementosVisuais: string;
  manualColors: string;
  manualStyle: string;
  brandName: string;
  supportingText: string;
  bulletPoints: string;
  referenceUrls: string[];
  contentId: string | null;
  quantity: number;
  carouselSlides: number;
  layoutTypes: string[];
  logoUrl?: string;
  primaryRefIndex?: number;
  objective?: string;
  photoUrls?: string[];
  outputMode?: "digital" | "print";
  printFormat?: string;
}

export interface ArtBriefingResult {
  headline: string;
  subheadline: string;
  cta: string;
  cena: string;
  elementos_visuais: string;
  supporting_text: string;
  bullet_points: string;
  suggested_format: string;
  suggested_tipo: string;
}

const TOTAL_STEPS = 9;

export function ArtWizard({
  orgId, visualIdentity, contentHistory, contentData, setContentData,
  contentId, setContentId, briefingFilled, setBriefingFilled,
  onGenerate, onFillWithAI, isFillingAI, canAfford, creditCost, onBack,
}: ArtWizardProps) {
  const [step, setStep] = useState(1);
  const [briefingText, setBriefingText] = useState("");
  const [showContentPicker, setShowContentPicker] = useState(false);
  const [objective, setObjective] = useState("vender");
  const [mandatoryPhrase, setMandatoryPhrase] = useState("");

  // Step 1: Output mode
  const [outputMode, setOutputMode] = useState<"digital" | "print">("digital");
  const [printType, setPrintType] = useState("flyer");

  // Step 3: Type + quantity
  const [tipoPostagem, setTipoPostagem] = useState("post_unico");
  const [quantity, setQuantity] = useState(1);
  const [carouselSlides, setCarouselSlides] = useState(5);

  // Step 4: Layout
  const [layoutTypes, setLayoutTypes] = useState<string[]>(["hero_central"]);

  // Step 5: Logo (dedicated)
  const [logoUrl, setLogoUrl] = useState("");

  // Step 6: References (with tutorial)
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [primaryRefIndex, setPrimaryRefIndex] = useState(0);

  // Step 7: Photos
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Step 8: Format
  const [artFormat, setArtFormat] = useState("portrait");
  const [artFormats, setArtFormats] = useState<string[]>([]);
  const [printFormat, setPrintFormat] = useState("flyer_a5");

  // Step 9: AI-generated text (review)
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [cta, setCta] = useState("");
  const [supportingText, setSupportingText] = useState("");
  const [bulletPoints, setBulletPoints] = useState("");
  const [brandName, setBrandName] = useState("");
  const [cena, setCena] = useState("");
  const [elementosVisuais, setElementosVisuais] = useState("");
  const [editingTexts, setEditingTexts] = useState(false);

  // Auto-load from visual identity
  useEffect(() => {
    if (referenceUrls.length === 0 && visualIdentity) {
      if (visualIdentity.image_bank_urls?.length) {
        setReferenceUrls(visualIdentity.image_bank_urls.slice(0, 5));
      }
    }
    if (!logoUrl && visualIdentity?.logo_url) {
      setLogoUrl(visualIdentity.logo_url);
    }
  }, [visualIdentity]);

  const handleAutoFillTexts = async () => {
    if (briefingFilled && headline) return;
    const enrichedBriefing = `${briefingText}\nObjetivo: ${objective}${mandatoryPhrase ? `\nFrase obrigatória: ${mandatoryPhrase}` : ""}`;
    const result = await onFillWithAI(enrichedBriefing, contentData);
    if (result) {
      setHeadline(mandatoryPhrase || result.headline || "");
      setSubheadline(result.subheadline || "");
      setCta(result.cta || "");
      setCena(result.cena || "");
      setElementosVisuais(result.elementos_visuais || "");
      setSupportingText(result.supporting_text || "");
      setBulletPoints(result.bullet_points || "");
      setBriefingFilled(true);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return !!(briefingText.trim() || contentData);
      case 3: return true;
      case 4: return layoutTypes.length >= 1;
      case 5: return !!logoUrl;
      case 6: return referenceUrls.length >= 3;
      case 7: return true; // photos optional
      case 8: return true;
      case 9: return !!headline.trim();
      default: return true;
    }
  };

  const handleStepChange = (nextStep: number) => {
    if (nextStep === 9 && !briefingFilled) {
      handleAutoFillTexts();
    }
    setStep(nextStep);
  };

  const totalPieces = tipoPostagem === "carrossel" ? carouselSlides : quantity;

  const handleGenerate = () => {
    if (!headline.trim()) {
      toast({ title: "Insira a headline da arte", variant: "destructive" });
      return;
    }
    if (referenceUrls.length < 3) {
      toast({ title: "Envie pelo menos 3 referências", variant: "destructive" });
      return;
    }

    const finalFormats = outputMode === "print"
      ? Array(totalPieces).fill(printFormat)
      : (artFormats.length === totalPieces ? artFormats : Array(totalPieces).fill(artFormat));

    onGenerate({
      format: outputMode === "print" ? printFormat : artFormat,
      formats: totalPieces > 1 ? finalFormats : undefined,
      style: layoutTypes[0],
      tipoPostagem,
      headline, subheadline, cta, cena, elementosVisuais,
      manualColors: "", manualStyle: "",
      brandName, supportingText, bulletPoints,
      referenceUrls, contentId, quantity,
      carouselSlides: tipoPostagem === "carrossel" ? carouselSlides : 0,
      layoutTypes,
      logoUrl,
      primaryRefIndex,
      objective,
      photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      outputMode,
      printFormat: outputMode === "print" ? printFormat : undefined,
    });
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
    else onBack();
  };

  const SelectCard = ({ selected, onClick, children, className }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${selected ? "ring-2 ring-primary bg-primary/5" : ""} ${className || ""}`}
      onClick={onClick}
    >
      {children}
    </Card>
  );

  const StepProgress = () => (
    <div className="flex items-center gap-1.5 mb-4">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? "bg-primary" : "bg-muted"}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-2">{step}/{TOTAL_STEPS}</span>
    </div>
  );

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !orgId) return;
    setUploadingPhotos(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `photos/${orgId}/${Date.now()}_${safeName}`;
      const { error } = await (await import("@/lib/supabase")).supabase.storage.from("social-arts").upload(path, file);
      if (!error) {
        const { data: urlData } = (await import("@/lib/supabase")).supabase.storage.from("social-arts").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
    }
    setPhotoUrls(prev => [...prev, ...newUrls]);
    setUploadingPhotos(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `logos/${orgId}/${Date.now()}_${safeName}`;
    const { error } = await (await import("@/lib/supabase")).supabase.storage.from("social-arts").upload(path, file);
    if (!error) {
      const { data: urlData } = (await import("@/lib/supabase")).supabase.storage.from("social-arts").getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
      toast({ title: "Logo carregada!" });
    }
  };

  const renderStep = () => {
    switch (step) {
      // ─── Step 1: Output Mode ───
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold mb-1">🎯 Onde será usada?</h3>
              <p className="text-sm text-muted-foreground">Escolha o destino da arte para otimizar formato e cores</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectCard selected={outputMode === "digital"} onClick={() => setOutputMode("digital")}>
                <CardContent className="p-5 text-center">
                  <p className="text-3xl mb-2">📱</p>
                  <p className="font-semibold text-sm">Digital (Rede Social)</p>
                  <p className="text-xs text-muted-foreground mt-1">Feed, Stories, Reels — cores RGB vibrantes</p>
                </CardContent>
              </SelectCard>
              <SelectCard selected={outputMode === "print"} onClick={() => setOutputMode("print")}>
                <CardContent className="p-5 text-center">
                  <p className="text-3xl mb-2">🖨️</p>
                  <p className="font-semibold text-sm">Impressão (CMYK)</p>
                  <p className="text-xs text-muted-foreground mt-1">Cartão de visita, flyer, banner</p>
                </CardContent>
              </SelectCard>
            </div>
            {outputMode === "print" && (
              <div>
                <Label className="text-xs font-semibold">Tipo de material</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {PRINT_TYPES.map((t) => (
                    <SelectCard key={t.value} selected={printType === t.value} onClick={() => setPrintType(t.value)}>
                      <CardContent className="p-3 text-center">
                        <p className="text-xl mb-1">{t.icon}</p>
                        <p className="font-semibold text-xs">{t.label}</p>
                        <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                      </CardContent>
                    </SelectCard>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      // ─── Step 2: Briefing + Objective ───
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">💡 O que você quer comunicar?</h3>
              <p className="text-sm text-muted-foreground">
                Descreva livremente. A IA vai gerar todos os textos, cena e composição para você.
              </p>
            </div>

            {contentData && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary">Conteúdo vinculado</p>
                    <p className="text-xs text-muted-foreground truncate">{contentData.title}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setContentData(null); setContentId(null); }}>
                    <X className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            )}

            <Textarea
              placeholder="Ex: Quero divulgar que investir em imóveis exige estratégia, não sorte. Para a marca Klir, tom profissional e sofisticado."
              value={briefingText}
              onChange={(e) => setBriefingText(e.target.value)}
              rows={4}
              className="resize-none"
            />

            <div>
              <Label className="text-xs font-semibold">Qual resultado quer gerar?</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {ART_OBJECTIVES.map((obj) => (
                  <SelectCard key={obj.value} selected={objective === obj.value} onClick={() => setObjective(obj.value)}>
                    <CardContent className="p-2.5 text-center">
                      <p className="font-semibold text-xs">{obj.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{obj.desc}</p>
                    </CardContent>
                  </SelectCard>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Frase obrigatória (opcional)</Label>
              <Input
                placeholder="Ex: Investir não é sorte"
                value={mandatoryPhrase}
                onChange={(e) => setMandatoryPhrase(e.target.value)}
                className="mt-1"
              />
            </div>

          </div>
        );

      // ─── Step 3: Type + Quantity ───
      case 3:
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold mb-1">📋 O que vamos criar?</h3>
              <p className="text-sm text-muted-foreground">Escolha o tipo de postagem e quantas peças gerar</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {POST_TYPES.map((t) => (
                <SelectCard key={t.value} selected={tipoPostagem === t.value} onClick={() => setTipoPostagem(t.value)}>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl mb-1">{t.icon}</p>
                    <p className="font-semibold text-sm">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                  </CardContent>
                </SelectCard>
              ))}
            </div>

            {tipoPostagem === "carrossel" && (
              <div>
                <Label className="text-xs">Quantos slides no carrossel?</Label>
                <div className="flex gap-2 mt-2">
                  {[3, 5, 7, 10].map(n => (
                    <Button key={n} variant={carouselSlides === n ? "default" : "outline"} size="sm" onClick={() => setCarouselSlides(n)}>
                      {n} slides
                    </Button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Cada slide será gerado individualmente ({creditCost} créditos/slide)
                </p>
              </div>
            )}

            {tipoPostagem !== "carrossel" && (
              <div>
                <Label className="text-xs">Quantas peças gerar de uma vez?</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Button key={n} variant={quantity === n ? "default" : "outline"} size="sm" onClick={() => setQuantity(n)}>
                      {n}
                    </Button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Custo total: {quantity * creditCost} créditos
                </p>
              </div>
            )}
          </div>
        );

      // ─── Step 4: Layout ───
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">📐 Diagramação</h3>
              <p className="text-sm text-muted-foreground">
                Escolha o layout que será usado para todas as peças geradas.
              </p>
            </div>
            <LayoutPicker selected={layoutTypes} onSelect={setLayoutTypes} />
          </div>
        );

      // ─── Step 5: Logo (dedicated step with tutorial) ───
      case 5:
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold mb-1">🏷️ Logo da marca</h3>
              <p className="text-sm text-muted-foreground">
                Sua logo será aplicada automaticamente na arte final gerada pela IA.
              </p>
            </div>

            <Card className="bg-accent/30 border-accent">
              <CardContent className="p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Por que a logo é importante?</p>
                  <p>A IA reserva um espaço limpo na arte e sobrepõe sua logo original, sem redesenhá-la. Isso garante fidelidade visual total da sua marca.</p>
                  <p className="text-xs">Formatos aceitos: PNG (fundo transparente recomendado), JPG, SVG</p>
                </div>
              </CardContent>
            </Card>

            {logoUrl ? (
              <div className="flex items-center gap-4 p-4 rounded-xl border bg-card">
                <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-primary bg-white p-1 flex items-center justify-center">
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Logo carregada
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Será aplicada em todas as peças geradas</p>
                  <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => setLogoUrl("")}>
                    Trocar logo
                  </Button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Clique para enviar sua logo</p>
                <p className="text-xs text-muted-foreground mt-1">PNG com fundo transparente recomendado</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            )}
          </div>
        );

      // ─── Step 6: References (with tutorial) ───
      case 6:
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold mb-1">🎨 Referências visuais</h3>
              <p className="text-sm text-muted-foreground">
                A IA extrai <strong>cores, fontes e estilo</strong> das referências para criar artes no mesmo padrão visual.
              </p>
            </div>

            <Card className="bg-accent/30 border-accent">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-medium text-foreground">O que são referências visuais?</p>
                    <p>São <strong>exemplos de artes que você gosta</strong> — posts de outras marcas, materiais antigos, paletas de cores ou qualquer imagem que represente o estilo desejado.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                      <div className="p-2 rounded-lg bg-background border text-xs text-center">
                        <p className="text-lg mb-1">🎨</p>
                        <p className="font-medium">Cores e paletas</p>
                        <p className="text-muted-foreground">Posts com cores que você quer</p>
                      </div>
                      <div className="p-2 rounded-lg bg-background border text-xs text-center">
                        <p className="text-lg mb-1">📐</p>
                        <p className="font-medium">Estilos de layout</p>
                        <p className="text-muted-foreground">Composições que te agradam</p>
                      </div>
                      <div className="p-2 rounded-lg bg-background border text-xs text-center">
                        <p className="text-lg mb-1">✨</p>
                        <p className="font-medium">Materiais da marca</p>
                        <p className="text-muted-foreground">Artes antigas, cartões etc.</p>
                      </div>
                    </div>
                    <p className="text-xs mt-1">
                      <strong>Dica:</strong> Marque com ⭐ a referência que mais representa o estilo desejado. <strong>Envie pelo menos 3 referências.</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <RefUploader
              referenceUrls={referenceUrls}
              setReferenceUrls={setReferenceUrls}
              orgId={orgId}
              uploading={uploading}
              setUploading={setUploading}
              required
              min={3}
              visualIdentity={visualIdentity}
              primaryRefIndex={primaryRefIndex}
              setPrimaryRefIndex={setPrimaryRefIndex}
            />
          </div>
        );

      // ─── Step 7: Photos (optional) ───
      case 7:
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold mb-1">📷 Fotos para incluir na arte</h3>
              <Badge variant="outline" className="text-[10px] ml-2">Opcional</Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Fotos reais que devem aparecer na composição — produto, imóvel, pessoa, etc.
              </p>
            </div>

            <Card className="bg-accent/30 border-accent">
              <CardContent className="p-3 flex items-start gap-2">
                <Camera className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <strong>Diferença entre referência e foto:</strong> Referências definem o <strong>estilo visual</strong> (cores, layout). Fotos são <strong>inseridas diretamente</strong> na arte final (produto, pessoa, imóvel).
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2">
              {photoUrls.map((url, i) => (
                <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onClick={() => setPhotoUrls(prev => prev.filter((_, j) => j !== i))}
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              <button
                className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors gap-1"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.multiple = true;
                  input.onchange = (ev) => handlePhotoUpload(ev as any);
                  input.click();
                }}
                disabled={uploadingPhotos}
              >
                {uploadingPhotos ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                <span className="text-[10px]">Foto</span>
              </button>
            </div>

            {photoUrls.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma foto adicionada. Você pode pular esta etapa.</p>
            )}
          </div>
        );

      // ─── Step 8: Format ───
      case 8: {
        if (outputMode === "print") {
          const printFormatsForType = PRINT_FORMATS.filter(f => {
            if (printType === "cartao") return f.value.startsWith("cartao");
            if (printType === "flyer") return f.value.startsWith("flyer");
            if (printType === "banner") return f.value.startsWith("banner");
            return true;
          });
          return (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold mb-1">📐 Formato de impressão</h3>
                <p className="text-sm text-muted-foreground">Dimensões em centímetros a 300dpi (CMYK)</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {printFormatsForType.map((f) => (
                  <SelectCard key={f.value} selected={printFormat === f.value} onClick={() => setPrintFormat(f.value)}>
                    <CardContent className="p-4 text-center">
                      <p className="font-semibold text-sm">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.cm}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{f.ratio}</p>
                    </CardContent>
                  </SelectCard>
                ))}
              </div>
            </div>
          );
        }

        const pieces = totalPieces;
        if (pieces > 1 && tipoPostagem !== "carrossel") {
          if (artFormats.length !== pieces) {
            setArtFormats(Array(pieces).fill(artFormat));
          }
          return (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold mb-1">📐 Formato por peça</h3>
                <p className="text-sm text-muted-foreground">Escolha o formato de cada peça individualmente</p>
              </div>
              {Array.from({ length: pieces }, (_, i) => (
                <div key={i} className="space-y-1">
                  <Label className="text-xs font-medium">Peça {i + 1}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {ART_FORMATS.map((f) => (
                      <SelectCard
                        key={f.value}
                        selected={(artFormats[i] || artFormat) === f.value}
                        onClick={() => {
                          const newFormats = [...(artFormats.length === pieces ? artFormats : Array(pieces).fill(artFormat))];
                          newFormats[i] = f.value;
                          setArtFormats(newFormats);
                        }}
                      >
                        <CardContent className="p-2 flex flex-col items-center text-center gap-1">
                          <f.icon className="w-4 h-4 text-primary" />
                          <p className="font-semibold text-[11px]">{f.label}</p>
                          <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                        </CardContent>
                      </SelectCard>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">📐 Formato da imagem</h3>
              <p className="text-sm text-muted-foreground">Escolha o enquadramento ideal para onde vai publicar</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {ART_FORMATS.map((f) => (
                <SelectCard key={f.value} selected={artFormat === f.value} onClick={() => setArtFormat(f.value)}>
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <f.icon className="w-6 h-6 text-primary" />
                    <p className="font-semibold text-sm">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                    <p className="text-[10px] text-muted-foreground">{f.ratio}</p>
                  </CardContent>
                </SelectCard>
              ))}
            </div>
          </div>
        );
      }

      // ─── Step 9: Review (AI-generated texts) ───
      case 9: {
        const reviewTotalCost = totalPieces * creditCost;
        const selectedLayouts = layoutTypes.map(lt => LAYOUT_TYPES.find(l => l.value === lt)).filter(Boolean);
        const selectedFormat = outputMode === "print"
          ? PRINT_FORMATS.find(f => f.value === printFormat)
          : ART_FORMATS.find(f => f.value === artFormat);
        const selectedType = POST_TYPES.find(t => t.value === tipoPostagem);

        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">✅ Revisão final</h3>
              <p className="text-sm text-muted-foreground">
                {isFillingAI ? "A IA está gerando os textos..." : "Textos gerados pela IA. Edite se necessário."}
              </p>
            </div>

            {isFillingAI && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <p className="text-sm text-primary">Gerando textos com IA...</p>
                </CardContent>
              </Card>
            )}

            {!isFillingAI && briefingFilled && (
              <>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">Textos gerados pela IA</p>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs gap-1"
                          onClick={() => setEditingTexts(!editingTexts)}
                        >
                          <Pencil className="w-3 h-3" />
                          {editingTexts ? "Fechar" : "Editar"}
                        </Button>
                      </div>
                    </div>

                    {editingTexts ? (
                      <div className="space-y-2">
                        <div>
                          <Label className="text-[10px]">Headline <span className="text-destructive">*</span></Label>
                          <Input value={headline} onChange={(e) => setHeadline(e.target.value)} className="mt-0.5 h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[10px]">Subheadline</Label>
                          <Input value={subheadline} onChange={(e) => setSubheadline(e.target.value)} className="mt-0.5 h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[10px]">Texto de apoio</Label>
                          <Textarea value={supportingText} onChange={(e) => setSupportingText(e.target.value)} rows={2} className="mt-0.5 resize-none text-xs" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px]">CTA</Label>
                            <Input value={cta} onChange={(e) => setCta(e.target.value)} className="mt-0.5 h-8 text-xs" />
                          </div>
                          <div>
                            <Label className="text-[10px]">Nome da marca</Label>
                            <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="mt-0.5 h-8 text-xs" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-xs">
                        <div><span className="text-muted-foreground">Headline:</span> <span className="font-semibold">{headline || "—"}</span></div>
                        {subheadline && <div><span className="text-muted-foreground">Sub:</span> {subheadline}</div>}
                        {supportingText && <div><span className="text-muted-foreground">Apoio:</span> <span className="line-clamp-2">{supportingText}</span></div>}
                        {cta && <div><span className="text-muted-foreground">CTA:</span> {cta}</div>}
                        {brandName && <div><span className="text-muted-foreground">Marca:</span> {brandName}</div>}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-2">
                    {referenceUrls.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">Referências ({referenceUrls.length}){logoUrl ? " + Logo" : ""}{photoUrls.length > 0 ? ` + ${photoUrls.length} fotos` : ""}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {logoUrl && (
                            <div className="w-10 h-10 rounded-md overflow-hidden border-2 border-primary">
                              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain bg-white p-0.5" />
                            </div>
                          )}
                          {referenceUrls.slice(0, 5).map((url, i) => (
                            <div key={i} className={`w-10 h-10 rounded-md overflow-hidden border ${primaryRefIndex === i ? "border-primary border-2" : "border-border"}`}>
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span>{selectedType?.icon} {selectedType?.label}</span>

                      <span className="text-muted-foreground">Quantidade:</span>
                      <span>{totalPieces} {tipoPostagem === "carrossel" ? "slides" : "peça(s)"}</span>

                      <span className="text-muted-foreground">Diagramação:</span>
                      <span>{selectedLayouts.map(l => l?.label).join(" + ")}</span>

                      <span className="text-muted-foreground">Formato:</span>
                      <span>{selectedFormat?.label} ({(selectedFormat as any)?.ratio || (selectedFormat as any)?.cm})</span>

                      {visualIdentity && <>
                        <span className="text-muted-foreground">Identidade:</span>
                        <span className="text-primary">✓ Aplicada</span>
                      </>}
                    </div>

                    <div className="pt-2 border-t mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Custo total</span>
                        <Badge variant="secondary" className="text-xs">{reviewTotalCost} créditos</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoFillTexts}
                  disabled={isFillingAI}
                  className="w-full"
                >
                  <Wand2 className="w-3 h-3 mr-1" /> Regenerar textos com IA
                </Button>
              </>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  const isLastStep = step === TOTAL_STEPS;
  const totalCost = totalPieces * creditCost;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h2 className="text-lg font-bold">Criar Arte</h2>
          <p className="text-xs text-muted-foreground">Passo {step} de {TOTAL_STEPS}</p>
        </div>
      </div>

      <StepProgress />

      <Card>
        <CardContent className="p-5">
          {renderStep()}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {step > 1 && (
          <Button variant="outline" onClick={goBack} className="flex-1">Voltar</Button>
        )}
        {isLastStep ? (
          <Button
            onClick={handleGenerate}
            disabled={!canProceed() || !canAfford || isFillingAI}
            className="flex-1"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar {totalPieces > 1 ? `${totalPieces} peças` : "Arte"} ({totalCost} créditos)
          </Button>
        ) : (
          <Button onClick={() => handleStepChange(step + 1)} disabled={!canProceed()} className="flex-1" size="lg">
            Continuar
          </Button>
        )}
      </div>
    </div>
  );
}

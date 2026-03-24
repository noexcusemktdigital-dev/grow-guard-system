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

const TOTAL_STEPS = 7;

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

  // Step 1: Output mode (digital vs print)
  const [outputMode, setOutputMode] = useState<"digital" | "print">("digital");
  const [printType, setPrintType] = useState("flyer");

  // Step 3: Type + quantity
  const [tipoPostagem, setTipoPostagem] = useState("post_unico");
  const [quantity, setQuantity] = useState(1);
  const [carouselSlides, setCarouselSlides] = useState(5);

  // Step 4: Layout (replaces old Style)
  const [layoutTypes, setLayoutTypes] = useState<string[]>(["hero_central"]);

  // Step 5: References + Logo + Photos
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryRefIndex, setPrimaryRefIndex] = useState(0);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Step 6: Format (per-piece when quantity > 1)
  const [artFormat, setArtFormat] = useState("portrait");
  const [artFormats, setArtFormats] = useState<string[]>([]);
  const [printFormat, setPrintFormat] = useState("flyer_a5");

  // Step 6: AI-generated text (review)
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

  // Auto-fill texts when entering step 6
  const handleAutoFillTexts = async () => {
    if (briefingFilled && headline) return; // already filled
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
      case 1: return true; // output mode always valid
      case 2: return !!(briefingText.trim() || contentData);
      case 3: return true;
      case 4: return layoutTypes.length >= 1;
      case 5: return referenceUrls.length >= 3 && !!logoUrl;
      case 6: return true;
      case 7: return !!headline.trim();
      default: return true;
    }
  };

  const handleStepChange = (nextStep: number) => {
    // Auto-trigger AI text generation when entering review step
    if (nextStep === 7 && !briefingFilled) {
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

    // Build per-piece formats array
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

  /* ── Selectable card ── */
  const SelectCard = ({ selected, onClick, children, className }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${selected ? "ring-2 ring-primary bg-primary/5" : ""} ${className || ""}`}
      onClick={onClick}
    >
      {children}
    </Card>
  );

  /* ── Step progress ── */
  const StepProgress = () => (
    <div className="flex items-center gap-1.5 mb-4">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? "bg-primary" : "bg-muted"}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-2">{step}/{TOTAL_STEPS}</span>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      // ─── Step 1: Output Mode (Digital vs Print) ───
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
              <p className="text-[10px] text-muted-foreground mt-0.5">Se preenchido, será usada como headline principal.</p>
            </div>

            <Button variant="outline" size="sm" onClick={() => setShowContentPicker(true)}>
              <FileText className="w-4 h-4 mr-1" /> Vincular conteúdo existente
            </Button>

            <ContentPickerDialog
              open={showContentPicker}
              onOpenChange={setShowContentPicker}
              contentHistory={contentHistory}
              onSelect={(c) => {
                setContentId(c.id);
                setContentData(c);
                setBriefingText(c.title || briefingText);
              }}
            />
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

      // ─── Step 4: Layout (Diagramação) ───
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">📐 Diagramação</h3>
              <p className="text-sm text-muted-foreground">
                Escolha 1 ou 2 layouts. Com 2 layouts, a IA gera variações separadas para cada composição.
              </p>
            </div>
            <LayoutPicker selected={layoutTypes} onSelect={setLayoutTypes} />
          </div>
        );

      // ─── Step 5: References + Logo + Photos ───
      case 5: {
        const photoInputRef = { current: null as HTMLInputElement | null };
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

        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">📸 Referências + Logo + Fotos</h3>
              <p className="text-sm text-muted-foreground">
                A IA extrai <strong>cores, fontes e estilo</strong> das referências.
                Envie a logo e fotos que devem aparecer na arte.
              </p>
            </div>
            <Card className="bg-accent/30 border-accent">
              <CardContent className="p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <strong>Dica:</strong> Envie artes anteriores, posts que você gostou ou materiais da marca.
                  Marque com ⭐ a referência que mais representa o estilo desejado.
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
              logoUrl={logoUrl}
              setLogoUrl={setLogoUrl}
              primaryRefIndex={primaryRefIndex}
              setPrimaryRefIndex={setPrimaryRefIndex}
            />

            {/* Photos to include in the art */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <span className="text-base">📷</span>
                <p className="text-sm font-semibold">Fotos para incluir na arte</p>
                <Badge variant="outline" className="text-[10px]">Opcional</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Essas fotos serão usadas <strong>diretamente na composição</strong> da arte (ex: foto de produto, pessoa, imóvel).
              </p>
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
            </div>
          </div>
        );
      }

      // ─── Step 5: Format ───
      case 5:
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

      // ─── Step 6: Review (AI-generated texts) ───
      case 6: {
        const basePieces = tipoPostagem === "carrossel" ? carouselSlides : quantity;
        const layoutMultiplier = layoutTypes.length;
        const totalPieces = basePieces * layoutMultiplier;
        const totalCost = totalPieces * creditCost;
        const selectedLayouts = layoutTypes.map(lt => LAYOUT_TYPES.find(l => l.value === lt)).filter(Boolean);
        const selectedFormat = ART_FORMATS.find(f => f.value === artFormat);
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
                {/* AI-generated texts with edit toggle */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">Textos gerados pela IA</p>
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
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">Referências ({referenceUrls.length}){logoUrl ? " + Logo" : ""}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {logoUrl && (
                            <div className="w-10 h-10 rounded-md overflow-hidden border-2 border-primary">
                              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain bg-white p-0.5" />
                            </div>
                          )}
                          {referenceUrls.map((url, i) => (
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
                      <span>{selectedFormat?.label} ({selectedFormat?.ratio})</span>

                      {visualIdentity && <>
                        <span className="text-muted-foreground">Identidade:</span>
                        <span className="text-primary">✓ Aplicada</span>
                      </>}
                    </div>

                    <div className="pt-2 border-t mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Custo total</span>
                        <Badge variant="secondary" className="text-xs">{totalCost} créditos</Badge>
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

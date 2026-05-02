import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ART_FORMATS, PRINT_FORMATS } from "./constants";
import { ContentItem } from "@/hooks/useClienteContentV2";
import { VisualIdentity } from "@/hooks/useVisualIdentity";
import { Sparkles, ArrowLeft } from "lucide-react";
import { ArtWizardStep } from "./ArtWizardSteps";
import { ArtWizardStepReview } from "./ArtWizardStepReview";
import { useStrategyData } from "@/hooks/useStrategyData";
import { getSmartSuggestions } from "@/utils/smartSuggestions";
import { useReferenceMemory } from "@/hooks/useReferenceMemory";

interface ArtWizardProps {
  orgId: string | undefined;
  visualIdentity: VisualIdentity | null | undefined;
  contentHistory: ContentItem[] | undefined;
  contentData: Record<string, unknown>;
  setContentData: (d: Record<string, unknown>) => void;
  contentId: string | null;
  setContentId: (id: string | null) => void;
  briefingFilled: boolean;
  setBriefingFilled: (v: boolean) => void;
  onGenerate: (payload: ArtGeneratePayload) => void;
  onFillWithAI: (briefingText: string, contentData: Record<string, unknown>) => Promise<ArtBriefingResult | null>;
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
  artTexts?: ArtTextItem[];
  caption?: string;
  // New fields from the art direction engine
  topic?: string;
  audience?: string;
  textMode?: "ai" | "manual";
  restrictions?: string;
  elements?: string[];
  baseImageUrl?: string;
  characterImageUrl?: string;
  backgroundImageUrl?: string;
  // Carousel-only series metadata
  seriesTitle?: string;
  slideTopics?: string[];
  // Layout customization (Step 8)
  logoPosition?: "top_left" | "top_right" | "bottom_left" | "bottom_right" | "none";
  titlePosition?: "top" | "center" | "bottom";
  backgroundType?: "ai_photo" | "solid_color" | "gradient" | "clean";
  colorTone?: "brand" | "neutral" | "vibrant" | "dark" | "pastel";
  primaryColor?: string;
  secondaryColor?: string;
}

export interface ArtBriefingResult {
  headline: string;
  subheadline: string;
  headlines?: string[];
  subheadlines?: string[];
  cta: string;
  cena: string;
  elementos_visuais: string;
  supporting_text: string;
  bullet_points: string;
  suggested_format: string;
  suggested_tipo: string;
  legenda?: string;
}

export interface ArtTextItem {
  headline: string;
  subheadline: string;
  supportingText: string;
  cta: string;
  approvedHeadline: boolean;
  approvedSub: boolean;
  approvedSupport: boolean;
  approvedCta: boolean;
  headlineOptions?: string[];
  subheadlineOptions?: string[];
}

const TOTAL_STEPS = 14;

export function ArtWizard({
  orgId, visualIdentity, contentHistory, contentData, setContentData,
  contentId, setContentId, briefingFilled, setBriefingFilled,
  onGenerate, onFillWithAI, isFillingAI, canAfford, creditCost, onBack,
}: ArtWizardProps) {
  const [step, setStep] = useState(1);
  const strategyData = useStrategyData();
  const suggestions = useMemo(() => getSmartSuggestions(strategyData), [strategyData]);
  const referenceMemory = useReferenceMemory(orgId);

  // Auto-fill from GPS on first open
  useEffect(() => {
    if (strategyData.hasStrategy) {
      // Pré-preenche público com ICP do GPS
      if (!audience && strategyData.publicoAlvo) {
        setAudience(strategyData.publicoAlvo.slice(0, 200));
      }
      // Pré-preenche objetivo com base no objetivo do GPS
      if (!objective && strategyData.objetivoPrincipal) {
        const objMap: Record<string, string> = {
          gerar_leads: "leads",
          aumentar_vendas: "sales",
          aumentar_autoridade: "authority",
          fidelizar: "engagement",
          lancar_produto: "sales",
        };
        const mapped = objMap[strategyData.objetivoPrincipal as string];
        if (mapped) setObjective(mapped);
      }
    }
  }, [strategyData.hasStrategy]);

  // Step 1: Material type
  const [outputMode, setOutputMode] = useState<"digital" | "print">("digital");
  const [printType, setPrintType] = useState("flyer");

  // Step 2: Format
  const [artFormat, setArtFormat] = useState("portrait");
  const [artFormats, setArtFormats] = useState<string[]>([]);
  const [printFormat, setPrintFormat] = useState("flyer_a5");

  // Step 3: Type + quantity
  const [tipoPostagem, setTipoPostagem] = useState("post_unico");
  const [quantity, setQuantity] = useState(1);
  const [carouselSlides, setCarouselSlides] = useState(5);
  // Carousel-only metadata: series title + per-slide topics
  const [seriesTitle, setSeriesTitle] = useState("");
  const [slideTopics, setSlideTopics] = useState<string[]>([]);

  // Step 4: Objective
  const [objective, setObjective] = useState("sales");

  // Step 5: Topic
  const [topic, setTopic] = useState("");

  // Step 6: Text mode
  const [textMode, setTextMode] = useState<"ai" | "manual">("ai");
  const [briefingText, setBriefingText] = useState("");
  const [mandatoryPhrase, setMandatoryPhrase] = useState("");

  // Step 7: Audience
  const [audience, setAudience] = useState("");

  // Step 8: Layout + customization
  const [layoutType, setLayoutType] = useState("hero_center");
  const [logoPosition, setLogoPosition] = useState<"top_left" | "top_right" | "bottom_left" | "bottom_right" | "none">("top_right");
  const [titlePosition, setTitlePosition] = useState<"top" | "center" | "bottom">("center");
  const [backgroundType, setBackgroundType] = useState<"ai_photo" | "solid_color" | "gradient" | "clean">("ai_photo");
  const [colorTone, setColorTone] = useState<"brand" | "neutral" | "vibrant" | "dark" | "pastel">("brand");
  const [primaryColor, setPrimaryColor] = useState<string>("#000000");
  const [secondaryColor, setSecondaryColor] = useState<string>("#ffffff");

  // Step 9: References
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [primaryRefIndex, setPrimaryRefIndex] = useState(0);

  // Step 10: Logo
  const [logoUrl, setLogoUrl] = useState("");

  // Step 11: Images (3 categories)
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [baseImageUrl, setBaseImageUrl] = useState("");
  const [characterImageUrl, setCharacterImageUrl] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");

  // Step 12: Elements
  const [elements, setElements] = useState<string[]>([]);

  // Step 13: Restrictions
  const [restrictions, setRestrictions] = useState("");

  // Step 14: Review texts
  const [artTexts, setArtTexts] = useState<ArtTextItem[]>([]);
  const [brandName, setBrandName] = useState("");
  const [cena, setCena] = useState("");
  const [elementosVisuais, setElementosVisuais] = useState("");
  const [bulletPoints, setBulletPoints] = useState("");
  const [editingPieceIndex, setEditingPieceIndex] = useState<number | null>(null);
  const [caption, setCaption] = useState("");

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
    // Hydrate brand colors from palette → used as defaults for "brand" tone + custom solid/gradient
    const palette = visualIdentity?.palette;
    if (palette && palette.length > 0) {
      if (primaryColor === "#000000") setPrimaryColor(palette[0].hex);
      if (secondaryColor === "#ffffff" && palette[1]) setSecondaryColor(palette[1].hex);
    }
  }, [visualIdentity]);

  // Pre-fill logo from reference memory (last used)
  useEffect(() => {
    if (!logoUrl && !visualIdentity?.logo_url && referenceMemory.lastLogoUrl) {
      setLogoUrl(referenceMemory.lastLogoUrl);
    }
  }, [referenceMemory.lastLogoUrl]);

  const totalPieces = tipoPostagem === "carrossel" ? carouselSlides : quantity;

  // Keep slideTopics array length in sync with the number of carousel slides
  useEffect(() => {
    if (tipoPostagem !== "carrossel") return;
    setSlideTopics(prev => {
      const next = [...prev];
      if (next.length < carouselSlides) {
        while (next.length < carouselSlides) next.push("");
      } else if (next.length > carouselSlides) {
        next.length = carouselSlides;
      }
      return next;
    });
  }, [carouselSlides, tipoPostagem]);

  const handleAutoFillTexts = async () => {
    const enrichedBriefing = textMode === "ai"
      ? `Tema: ${topic}\nObjetivo: ${objective}\nPúblico: ${audience}\nElementos: ${elements.join(", ")}\nRestrições: ${restrictions}${mandatoryPhrase ? `\nFrase obrigatória: ${mandatoryPhrase}` : ""}\nQuantidade de peças: ${totalPieces}`
      : `${briefingText}\nObjetivo: ${objective}${mandatoryPhrase ? `\nFrase obrigatória: ${mandatoryPhrase}` : ""}\nQuantidade de peças: ${totalPieces}`;
    const result = await onFillWithAI(enrichedBriefing, contentData);
    if (result) {
      const headlineOpts = result.headlines && result.headlines.length > 0 ? result.headlines : [result.headline || ""];
      const subheadlineOpts = result.subheadlines && result.subheadlines.length > 0 ? result.subheadlines : [result.subheadline || ""];
      const baseTexts: ArtTextItem[] = Array.from({ length: totalPieces }, (_, i) => ({
        headline: i === 0 && mandatoryPhrase ? mandatoryPhrase : (headlineOpts[0] || ""),
        subheadline: subheadlineOpts[0] || "",
        supportingText: result.supporting_text || "",
        cta: result.cta || "",
        approvedHeadline: false,
        approvedSub: false,
        approvedSupport: false,
        approvedCta: false,
        headlineOptions: i === 0 && mandatoryPhrase ? undefined : headlineOpts,
        subheadlineOptions: subheadlineOpts,
      }));
      setArtTexts(baseTexts);
      setCena(result.cena || "");
      setElementosVisuais(result.elementos_visuais || "");
      setBulletPoints(result.bullet_points || "");
      setCaption(result.legenda || "");
      setBriefingFilled(true);
    }
  };

  const updateArtText = (index: number, field: keyof ArtTextItem, value: string | boolean) => {
    setArtTexts(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const allTextsApproved = artTexts.length > 0 && artTexts.every(
    t => t.approvedHeadline && t.approvedSub && t.approvedSupport && t.approvedCta
  );

  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return !!artFormat;
      case 3: return !!tipoPostagem;
      case 4: return !!objective;
      case 5: return !!topic.trim();
      case 6: return textMode === "ai" || !!(briefingText.trim());
      case 7: return true;
      case 8: return true;
      case 9: return referenceUrls.length >= 1;
      case 10: return true;
      case 11: return true;
      case 12: return true;
      case 13: return true;
      case 14: return allTextsApproved;
      default: return true;
    }
  };

  const handleStepChange = (nextStep: number) => {
    if (nextStep === 14 && !briefingFilled) {
      if (textMode === "ai") {
        handleAutoFillTexts();
      } else {
        // Manual mode: create text slots for manual editing
        if (artTexts.length === 0) {
          setArtTexts(Array.from({ length: totalPieces }, () => ({
            headline: mandatoryPhrase || "",
            subheadline: "",
            supportingText: "",
            cta: "",
            approvedHeadline: false,
            approvedSub: false,
            approvedSupport: false,
            approvedCta: false,
          })));
          setBriefingFilled(true);
        }
      }
    }
    setStep(nextStep);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, category?: "base" | "character" | "background") => {
    const files = e.target.files;
    if (!files || !orgId) return;
    setUploadingPhotos(true);
    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `photos/${orgId}/${Date.now()}_${safeName}`;
      const { error } = await (await import("@/lib/supabase")).supabase.storage.from("social-arts").upload(path, file);
      if (!error) {
        const { data: urlData } = (await import("@/lib/supabase")).supabase.storage.from("social-arts").getPublicUrl(path);
        const url = urlData.publicUrl;
        if (category === "base") setBaseImageUrl(url);
        else if (category === "character") setCharacterImageUrl(url);
        else if (category === "background") setBackgroundImageUrl(url);
        else setPhotoUrls(prev => [...prev, url]);
      }
    }
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

  const handleGenerate = () => {
    if (!allTextsApproved) {
      toast({ title: "Aprove todos os textos de todas as peças", variant: "destructive" });
      return;
    }
    const finalFormats = outputMode === "print"
      ? Array(totalPieces).fill(printFormat)
      : (artFormats.length === totalPieces ? artFormats : Array(totalPieces).fill(artFormat));

    // Combine all photo URLs
    const allPhotos = [...photoUrls];
    if (baseImageUrl) allPhotos.unshift(baseImageUrl);
    if (characterImageUrl) allPhotos.push(characterImageUrl);
    if (backgroundImageUrl) allPhotos.push(backgroundImageUrl);

    onGenerate({
      format: outputMode === "print" ? printFormat : artFormat,
      formats: totalPieces > 1 ? finalFormats : undefined,
      style: layoutType,
      tipoPostagem,
      headline: artTexts[0]?.headline || "",
      subheadline: artTexts[0]?.subheadline || "",
      cta: artTexts[0]?.cta || "",
      cena, elementosVisuais,
      manualColors: "", manualStyle: "",
      brandName, supportingText: artTexts[0]?.supportingText || "", bulletPoints,
      referenceUrls, contentId, quantity,
      carouselSlides: tipoPostagem === "carrossel" ? carouselSlides : 0,
      layoutTypes: [layoutType],
      logoUrl,
      primaryRefIndex,
      objective,
      photoUrls: allPhotos.length > 0 ? allPhotos : undefined,
      outputMode,
      printFormat: outputMode === "print" ? printFormat : undefined,
      artTexts,
      topic,
      audience,
      textMode,
      restrictions,
      elements,
      baseImageUrl: baseImageUrl || undefined,
      characterImageUrl: characterImageUrl || undefined,
      backgroundImageUrl: backgroundImageUrl || undefined,
      caption: caption || undefined,
      seriesTitle: tipoPostagem === "carrossel" ? (seriesTitle || undefined) : undefined,
      slideTopics: tipoPostagem === "carrossel" ? slideTopics : undefined,
      logoPosition,
      titlePosition,
      backgroundType,
      colorTone,
      primaryColor,
      secondaryColor,
    });
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
    else onBack();
  };

  const StepProgress = () => (
    <div className="flex items-center gap-1 mb-4">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? "bg-primary" : "bg-muted"}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-2">{step}/{TOTAL_STEPS}</span>
    </div>
  );

  const stepLabels: Record<number, string> = {
    1: "Destino", 2: "Formato", 3: "Tipo", 4: "Objetivo",
    5: "Tema", 6: "Texto", 7: "Público", 8: "Layout",
    9: "Referências", 10: "Logo", 11: "Imagens",
    12: "Elementos", 13: "Restrições", 14: "Revisão",
  };

  const renderStep = () => {
    if (step >= 1 && step <= 13) {
      return (
        <ArtWizardStep
          step={step}
          outputMode={outputMode} setOutputMode={setOutputMode}
          printType={printType} setPrintType={setPrintType}
          briefingText={briefingText} setBriefingText={setBriefingText}
          objective={objective} setObjective={setObjective}
          mandatoryPhrase={mandatoryPhrase} setMandatoryPhrase={setMandatoryPhrase}
          tipoPostagem={tipoPostagem} setTipoPostagem={setTipoPostagem}
          quantity={quantity} setQuantity={setQuantity}
          carouselSlides={carouselSlides} setCarouselSlides={setCarouselSlides}
          seriesTitle={seriesTitle} setSeriesTitle={setSeriesTitle}
          slideTopics={slideTopics} setSlideTopics={setSlideTopics}
          creditCost={creditCost}
          logoUrl={logoUrl} setLogoUrl={setLogoUrl}
          referenceUrls={referenceUrls} setReferenceUrls={setReferenceUrls}
          orgId={orgId} uploading={uploading} setUploading={setUploading}
          primaryRefIndex={primaryRefIndex} setPrimaryRefIndex={setPrimaryRefIndex}
          visualIdentity={visualIdentity}
          photoUrls={photoUrls} setPhotoUrls={setPhotoUrls}
          uploadingPhotos={uploadingPhotos}
          artFormat={artFormat} setArtFormat={setArtFormat}
          artFormats={artFormats} setArtFormats={setArtFormats}
          printFormat={printFormat} setPrintFormat={setPrintFormat}
          totalPieces={totalPieces}
          onLogoUpload={handleLogoUpload}
          onPhotoUpload={handlePhotoUpload}
          contentData={contentData}
          topic={topic} setTopic={setTopic}
          audience={audience} setAudience={setAudience}
          textMode={textMode} setTextMode={setTextMode}
          layoutType={layoutType} setLayoutType={setLayoutType}
          logoPosition={logoPosition} setLogoPosition={setLogoPosition}
          titlePosition={titlePosition} setTitlePosition={setTitlePosition}
          backgroundType={backgroundType} setBackgroundType={setBackgroundType}
          colorTone={colorTone} setColorTone={setColorTone}
          primaryColor={primaryColor} setPrimaryColor={setPrimaryColor}
          secondaryColor={secondaryColor} setSecondaryColor={setSecondaryColor}
          restrictions={restrictions} setRestrictions={setRestrictions}
          elements={elements} setElements={setElements}
          baseImageUrl={baseImageUrl} setBaseImageUrl={setBaseImageUrl}
          characterImageUrl={characterImageUrl} setCharacterImageUrl={setCharacterImageUrl}
          backgroundImageUrl={backgroundImageUrl} setBackgroundImageUrl={setBackgroundImageUrl}
          suggestions={suggestions}
          referenceMemory={referenceMemory}
        />
      );
    }

    if (step === 14) {
      return (
        <ArtWizardStepReview
          artTexts={artTexts} updateArtText={updateArtText}
          editingPieceIndex={editingPieceIndex} setEditingPieceIndex={setEditingPieceIndex}
          totalPieces={totalPieces} creditCost={creditCost}
          isFillingAI={isFillingAI} briefingFilled={briefingFilled}
          allTextsApproved={allTextsApproved}
          referenceUrls={referenceUrls} logoUrl={logoUrl}
          photoUrls={photoUrls} primaryRefIndex={primaryRefIndex}
          outputMode={outputMode} printFormat={printFormat}
          artFormat={artFormat} tipoPostagem={tipoPostagem}
          visualIdentity={visualIdentity}
          textMode={textMode}
          onRegenerateTexts={() => {
            setBriefingFilled(false);
            setArtTexts([]);
            handleAutoFillTexts();
          }}
          setBriefingFilled={setBriefingFilled}
          setArtTexts={setArtTexts}
        />
      );
    }

    return null;
  };

  const isLastStep = step === TOTAL_STEPS;
  const totalCost = totalPieces * creditCost;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="icon" onClick={goBack} aria-label="Voltar"><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h2 className="text-lg font-bold">Criar Arte</h2>
          <p className="text-xs text-muted-foreground">Passo {step} de {TOTAL_STEPS} — {stepLabels[step]}</p>
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

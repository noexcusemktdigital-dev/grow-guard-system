import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  ART_FORMATS, PRINT_FORMATS,
} from "./constants";
import { ContentItem } from "@/hooks/useClienteContentV2";
import { VisualIdentity } from "@/hooks/useVisualIdentity";
import { Sparkles, ArrowLeft } from "lucide-react";
import { ArtWizardStep, ArtWizardStep8Review } from "./ArtWizardSteps";

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

export interface ArtTextItem {
  headline: string;
  subheadline: string;
  supportingText: string;
  cta: string;
  approvedHeadline: boolean;
  approvedSub: boolean;
  approvedSupport: boolean;
  approvedCta: boolean;
}

const TOTAL_STEPS = 8;

export function ArtWizard({
  orgId, visualIdentity, contentHistory, contentData, setContentData,
  contentId, setContentId, briefingFilled, setBriefingFilled,
  onGenerate, onFillWithAI, isFillingAI, canAfford, creditCost, onBack,
}: ArtWizardProps) {
  const [step, setStep] = useState(1);
  const [briefingText, setBriefingText] = useState("");
  const [objective, setObjective] = useState("vender");
  const [mandatoryPhrase, setMandatoryPhrase] = useState("");

  // Step 1: Output mode
  const [outputMode, setOutputMode] = useState<"digital" | "print">("digital");
  const [printType, setPrintType] = useState("flyer");

  // Step 3: Type + quantity
  const [tipoPostagem, setTipoPostagem] = useState("post_unico");
  const [quantity, setQuantity] = useState(1);
  const [carouselSlides, setCarouselSlides] = useState(5);

  // Step 4: Logo (dedicated)
  const [logoUrl, setLogoUrl] = useState("");

  // Step 5: References (with tutorial)
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [primaryRefIndex, setPrimaryRefIndex] = useState(0);

  // Step 6: Photos
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Step 7: Format
  const [artFormat, setArtFormat] = useState("portrait");
  const [artFormats, setArtFormats] = useState<string[]>([]);
  const [printFormat, setPrintFormat] = useState("flyer_a5");

  // Step 8: Per-art texts with individual approval
  const [artTexts, setArtTexts] = useState<ArtTextItem[]>([]);
  const [brandName, setBrandName] = useState("");
  const [cena, setCena] = useState("");
  const [elementosVisuais, setElementosVisuais] = useState("");
  const [bulletPoints, setBulletPoints] = useState("");
  const [editingPieceIndex, setEditingPieceIndex] = useState<number | null>(null);

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

  const totalPieces = tipoPostagem === "carrossel" ? carouselSlides : quantity;

  const handleAutoFillTexts = async () => {
    const enrichedBriefing = `${briefingText}\nObjetivo: ${objective}${mandatoryPhrase ? `\nFrase obrigatória: ${mandatoryPhrase}` : ""}\nQuantidade de peças: ${totalPieces}`;
    const result = await onFillWithAI(enrichedBriefing, contentData);
    if (result) {
      const baseTexts: ArtTextItem[] = Array.from({ length: totalPieces }, (_, i) => ({
        headline: i === 0 && mandatoryPhrase ? mandatoryPhrase : (result.headline || ""),
        subheadline: result.subheadline || "",
        supportingText: result.supporting_text || "",
        cta: result.cta || "",
        approvedHeadline: false,
        approvedSub: false,
        approvedSupport: false,
        approvedCta: false,
      }));
      setArtTexts(baseTexts);
      setCena(result.cena || "");
      setElementosVisuais(result.elementos_visuais || "");
      setBulletPoints(result.bullet_points || "");
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
      case 2: return !!(briefingText.trim() || contentData);
      case 3: return true;
      case 4: return !!logoUrl;
      case 5: return referenceUrls.length >= 3;
      case 6: return true; // photos optional
      case 7: return true;
      case 8: return allTextsApproved;
      default: return true;
    }
  };

  const handleStepChange = (nextStep: number) => {
    if (nextStep === 8 && !briefingFilled) {
      handleAutoFillTexts();
    }
    setStep(nextStep);
  };

  const handleGenerate = () => {
    if (!allTextsApproved) {
      toast({ title: "Aprove todos os textos de todas as peças", variant: "destructive" });
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
      style: "auto",
      tipoPostagem,
      headline: artTexts[0]?.headline || "",
      subheadline: artTexts[0]?.subheadline || "",
      cta: artTexts[0]?.cta || "",
      cena, elementosVisuais,
      manualColors: "", manualStyle: "",
      brandName, supportingText: artTexts[0]?.supportingText || "", bulletPoints,
      referenceUrls, contentId, quantity,
      carouselSlides: tipoPostagem === "carrossel" ? carouselSlides : 0,
      layoutTypes: ["auto"],
      logoUrl,
      primaryRefIndex,
      objective,
      photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      outputMode,
      printFormat: outputMode === "print" ? printFormat : undefined,
      artTexts,
    });
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
    else onBack();
  };

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
    if (step >= 1 && step <= 7) {
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
        />
      );
    }

    if (step === 8) {
      return (
        <ArtWizardStep8Review
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

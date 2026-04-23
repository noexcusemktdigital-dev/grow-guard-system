// @ts-nocheck
import React, { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ART_FORMATS, POST_TYPES, ART_OBJECTIVES, TEXT_MODES,
  PRINT_FORMATS, PRINT_TYPES,
} from "./constants";
import type { SmartSuggestions } from "@/utils/smartSuggestions";
import type { ReferenceMemory } from "@/hooks/useReferenceMemory";
import { LayoutPicker } from "./LayoutPicker";
import { LayoutPreviewSvg } from "./LayoutPreviewSvg";
import { VisualIdentity } from "@/hooks/useVisualIdentity";
import type { ArtTextItem } from "./ArtWizard";
import {
  Step9References, Step10Logo, Step11Images, Step12Elements, Step13Restrictions,
} from "./ArtWizardStepsMedia";

interface SelectCardProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const SelectCard = ({ selected, onClick, children, className }: SelectCardProps) => (
  <Card
    className={`cursor-pointer transition-all hover:shadow-md ${selected ? "ring-2 ring-primary bg-primary/5" : ""} ${className || ""}`}
    onClick={onClick}
  >
    {children}
  </Card>
);

export interface StepProps {
  step: number;
  outputMode: "digital" | "print";
  setOutputMode: (v: "digital" | "print") => void;
  printType: string;
  setPrintType: (v: string) => void;
  briefingText: string;
  setBriefingText: (v: string) => void;
  objective: string;
  setObjective: (v: string) => void;
  mandatoryPhrase: string;
  setMandatoryPhrase: (v: string) => void;
  tipoPostagem: string;
  setTipoPostagem: (v: string) => void;
  quantity: number;
  setQuantity: (v: number) => void;
  carouselSlides: number;
  setCarouselSlides: (v: number) => void;
  seriesTitle: string;
  setSeriesTitle: (v: string) => void;
  slideTopics: string[];
  setSlideTopics: (v: string[]) => void;
  creditCost: number;
  logoUrl: string;
  setLogoUrl: (v: string) => void;
  referenceUrls: string[];
  setReferenceUrls: (v: string[]) => void;
  orgId: string | undefined;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  primaryRefIndex: number;
  setPrimaryRefIndex: (v: number) => void;
  visualIdentity: VisualIdentity | null | undefined;
  photoUrls: string[];
  setPhotoUrls: (v: string[]) => void;
  uploadingPhotos: boolean;
  artFormat: string;
  setArtFormat: (v: string) => void;
  artFormats: string[];
  setArtFormats: (v: string[]) => void;
  printFormat: string;
  setPrintFormat: (v: string) => void;
  totalPieces: number;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>, category?: "base" | "character" | "background") => void;
  contentData: Record<string, unknown>;
  topic: string;
  setTopic: (v: string) => void;
  audience: string;
  setAudience: (v: string) => void;
  textMode: "ai" | "manual";
  setTextMode: (v: "ai" | "manual") => void;
  layoutType: string;
  setLayoutType: (v: string) => void;
  logoPosition: "top_left" | "top_right" | "bottom_left" | "bottom_right" | "none";
  setLogoPosition: (v: "top_left" | "top_right" | "bottom_left" | "bottom_right" | "none") => void;
  titlePosition: "top" | "center" | "bottom";
  setTitlePosition: (v: "top" | "center" | "bottom") => void;
  backgroundType: "ai_photo" | "solid_color" | "gradient" | "clean";
  setBackgroundType: (v: "ai_photo" | "solid_color" | "gradient" | "clean") => void;
  colorTone: "brand" | "neutral" | "vibrant" | "dark" | "pastel";
  setColorTone: (v: "brand" | "neutral" | "vibrant" | "dark" | "pastel") => void;
  primaryColor: string;
  setPrimaryColor: (v: string) => void;
  secondaryColor: string;
  setSecondaryColor: (v: string) => void;
  restrictions: string;
  setRestrictions: (v: string) => void;
  elements: string[];
  setElements: (v: string[]) => void;
  baseImageUrl: string;
  setBaseImageUrl: (v: string) => void;
  characterImageUrl: string;
  setCharacterImageUrl: (v: string) => void;
  backgroundImageUrl: string;
  setBackgroundImageUrl: (v: string) => void;
  suggestions?: SmartSuggestions;
  referenceMemory?: ReferenceMemory;
}

export function ArtWizardStep(props: StepProps) {
  switch (props.step) {
    case 1:  return <Step1MaterialType {...props} />;
    case 2:  return <Step2Format {...props} />;
    case 3:  return <Step3TypeQuantity {...props} />;
    case 4:  return <Step4Objective {...props} />;
    case 5:  return <Step5Topic {...props} />;
    case 6:  return <Step6TextMode {...props} />;
    case 7:  return <Step7Audience {...props} />;
    case 8:  return <Step8Layout {...props} />;
    case 9:  return <Step9References {...props} />;
    case 10: return <Step10Logo {...props} />;
    case 11: return <Step11Images {...props} />;
    case 12: return <Step12Elements {...props} />;
    case 13: return <Step13Restrictions {...props} />;
    default: return null;
  }
}

/* ── Step 1: Material Type ── */
function Step1MaterialType({ outputMode, setOutputMode, printType, setPrintType }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold mb-1">🎯 Onde essa arte será usada?</h3>
        <p className="text-sm text-muted-foreground">Escolha o destino para otimizar formato e cores</p>
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
}

/* ── Step 2: Format ── */
function Step2Format({ outputMode, printType, printFormat, setPrintFormat, artFormat, setArtFormat }: StepProps) {
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
          <p className="text-sm text-muted-foreground">Dimensões em centímetros a 300dpi</p>
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
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">📐 Qual formato você quer?</h3>
        <p className="text-sm text-muted-foreground">Escolha o enquadramento ideal</p>
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

/* ── Step 3: Type + Quantity ── */
function Step3TypeQuantity({
  tipoPostagem, setTipoPostagem, quantity, setQuantity,
  carouselSlides, setCarouselSlides, creditCost,
  seriesTitle, setSeriesTitle, slideTopics, setSlideTopics,
}: StepProps) {
  const updateSlideTopic = (idx: number, value: string) => {
    const next = [...slideTopics];
    while (next.length < carouselSlides) next.push("");
    next[idx] = value;
    setSlideTopics(next);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold mb-1">📋 O que vamos criar?</h3>
        <p className="text-sm text-muted-foreground">Escolha o tipo e quantas peças gerar</p>
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
      {tipoPostagem === "carrossel" ? (
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Quantos slides no carrossel?</Label>
            <div className="flex gap-2 mt-2">
              {[2, 3, 5, 7, 10].map(n => (
                <Button key={n} variant={carouselSlides === n ? "default" : "outline"} size="sm" onClick={() => setCarouselSlides(n)}>{n}</Button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{creditCost} créditos/slide</p>
          </div>

          <div>
            <Label className="text-xs">Título da série <span className="text-muted-foreground">(opcional)</span></Label>
            <Input
              placeholder="Ex: 5 erros que travam suas vendas"
              value={seriesTitle}
              onChange={(e) => setSeriesTitle(e.target.value)}
              className="mt-1"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Aparece como tema unificador em todos os slides</p>
          </div>

          <div>
            <Label className="text-xs">Tópico de cada slide <span className="text-muted-foreground">(opcional)</span></Label>
            <div className="space-y-2 mt-2">
              {Array.from({ length: carouselSlides }, (_, i) => (
                <Input
                  key={i}
                  placeholder={
                    i === 0 ? "Slide 1 — Capa (chamada principal)"
                    : i === carouselSlides - 1 ? `Slide ${i + 1} — CTA (chamada para ação)`
                    : `Slide ${i + 1} — Tópico`
                  }
                  value={slideTopics[i] || ""}
                  onChange={(e) => updateSlideTopic(i, e.target.value)}
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Deixe em branco para a IA decidir o tópico de cada slide</p>
          </div>
        </div>
      ) : (
        <div>
          <Label className="text-xs">Quantas peças gerar?</Label>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3, 4, 5].map(n => (
              <Button key={n} variant={quantity === n ? "default" : "outline"} size="sm" onClick={() => setQuantity(n)}>{n}</Button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Custo: {quantity * creditCost} créditos</p>
        </div>
      )}
    </div>
  );
}

/* ── Step 4: Objective ── */
function Step4Objective({ objective, setObjective }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">🎯 O que você quer que essa arte gere?</h3>
        <p className="text-sm text-muted-foreground">O objetivo define o estilo e a abordagem visual</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ART_OBJECTIVES.map((obj) => (
          <SelectCard key={obj.value} selected={objective === obj.value} onClick={() => setObjective(obj.value)}>
            <CardContent className="p-3 text-center">
              <p className="font-semibold text-sm">{obj.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{obj.desc}</p>
            </CardContent>
          </SelectCard>
        ))}
      </div>
    </div>
  );
}

/* ── Step 5: Topic ── */
function Step5Topic({ topic, setTopic, suggestions }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">💡 Sobre o que é essa arte?</h3>
        <p className="text-sm text-muted-foreground">Descreva o assunto principal</p>
      </div>
      <Textarea
        placeholder={suggestions?.topicPlaceholder || "Ex: consórcio de imóveis, clínica odontológica, lançamento de curso, evento corporativo..."}
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        rows={3}
        className="resize-none"
      />
      <div className="flex flex-wrap gap-1.5">
        {(suggestions?.topics || ["Consórcio", "Imóvel", "Clínica", "Curso", "Evento", "Seguro", "Produto novo"]).map(s => (
          <Badge key={s} variant="outline" className="cursor-pointer hover:bg-primary/10 text-xs" onClick={() => setTopic(s)}>
            {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}

/* ── Step 6: Text Mode ── */
function Step6TextMode({ textMode, setTextMode, briefingText, setBriefingText, mandatoryPhrase, setMandatoryPhrase }: StepProps) {
  const totalChars = useMemo(() => {
    return (briefingText?.length || 0) + (mandatoryPhrase?.length || 0);
  }, [briefingText, mandatoryPhrase]);
  const isOverLimit = totalChars > 150;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">✍️ Quem vai escrever o texto da arte?</h3>
        <p className="text-sm text-muted-foreground">A IA pode criar os textos ou você escreve manualmente</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TEXT_MODES.map((m) => (
          <SelectCard key={m.value} selected={textMode === m.value} onClick={() => setTextMode(m.value as "ai" | "manual")}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl mb-1">{m.icon}</p>
              <p className="font-semibold text-sm">{m.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
            </CardContent>
          </SelectCard>
        ))}
      </div>
      {textMode === "manual" && (
        <div>
          <Textarea
            placeholder="Descreva o que quer comunicar na arte..."
            value={briefingText}
            onChange={(e) => setBriefingText(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <span className={`text-[10px] ${isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}>
              {totalChars}/150 caracteres
            </span>
            {isOverLimit && (
              <span className="text-[10px] text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Texto longo pode poluir a arte
              </span>
            )}
          </div>
        </div>
      )}
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
}

/* ── Step 7: Audience ── */
function Step7Audience({ audience, setAudience, suggestions }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">👤 Para quem é essa arte?</h3>
        <p className="text-sm text-muted-foreground">Defina o público-alvo para a IA adaptar linguagem e visual</p>
      </div>
      <Input
        placeholder={suggestions?.audiencePlaceholder || "Ex: empresários, mulheres 25-45, médicos, público geral..."}
        value={audience}
        onChange={(e) => setAudience(e.target.value)}
      />
      <div className="flex flex-wrap gap-1.5">
        {(suggestions?.audiences || []).map(s => (
          <Badge key={s} variant="outline" className="cursor-pointer hover:bg-primary/10 text-xs" onClick={() => setAudience(s)}>
            {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}

/* ── Step 8: Layout + Customizer + Live Preview ── */
function Step8Layout(props: StepProps) {
  const {
    layoutType, setLayoutType,
    logoPosition, setLogoPosition,
    titlePosition, setTitlePosition,
    backgroundType, setBackgroundType,
    colorTone, setColorTone,
    primaryColor, setPrimaryColor,
    secondaryColor, setSecondaryColor,
    artFormat,
  } = props;

  // Preview aspect: default to user's chosen format (story → 9:16, otherwise 1:1)
  const defaultAspect: "1:1" | "9:16" = artFormat === "story" ? "9:16" : "1:1";
  const [previewAspect, setPreviewAspect] = React.useState<"1:1" | "9:16">(defaultAspect);

  const logoOpts: { value: typeof logoPosition; label: string }[] = [
    { value: "top_left",     label: "↖ Sup. Esq." },
    { value: "top_right",    label: "↗ Sup. Dir." },
    { value: "bottom_left",  label: "↙ Inf. Esq." },
    { value: "bottom_right", label: "↘ Inf. Dir." },
    { value: "none",         label: "✕ Sem logo" },
  ];

  const titleOpts: { value: typeof titlePosition; label: string }[] = [
    { value: "top",    label: "Topo" },
    { value: "center", label: "Centro" },
    { value: "bottom", label: "Inferior" },
  ];

  const bgOpts: { value: typeof backgroundType; label: string; emoji: string }[] = [
    { value: "ai_photo",    label: "Foto IA",    emoji: "📸" },
    { value: "solid_color", label: "Cor sólida", emoji: "🎨" },
    { value: "gradient",    label: "Gradiente",  emoji: "🌈" },
    { value: "clean",       label: "Limpo",      emoji: "⬜" },
  ];

  const toneOpts: { value: typeof colorTone; label: string }[] = [
    { value: "brand",   label: "Marca" },
    { value: "neutral", label: "Neutro" },
    { value: "vibrant", label: "Vibrante" },
    { value: "dark",    label: "Dark" },
    { value: "pastel",  label: "Pastel" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold mb-1">📐 Escolha como sua arte será organizada</h3>
        <p className="text-sm text-muted-foreground">Selecione um template e personalize os detalhes — o preview atualiza em tempo real</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Esquerda: grid de templates */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Template</Label>
          <LayoutPicker
            selected={[layoutType]}
            onSelect={(v) => setLayoutType(v[0] || "hero_center")}
          />
        </div>

        {/* Direita: personalizador + preview */}
        <div className="space-y-4">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personalizar</Label>

          {/* Preview */}
          <Card className="overflow-hidden bg-muted/40">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium text-muted-foreground">Preview ao vivo</span>
                <div className="flex gap-1">
                  <Button
                    type="button" size="sm" variant={previewAspect === "1:1" ? "default" : "outline"}
                    onClick={() => setPreviewAspect("1:1")}
                    className="h-6 px-2 text-[10px]"
                  >1:1</Button>
                  <Button
                    type="button" size="sm" variant={previewAspect === "9:16" ? "default" : "outline"}
                    onClick={() => setPreviewAspect("9:16")}
                    className="h-6 px-2 text-[10px]"
                  >9:16</Button>
                </div>
              </div>
              <div className={`mx-auto ${previewAspect === "9:16" ? "w-[160px]" : "w-full max-w-[260px]"}`}>
                <LayoutPreviewSvg
                  layoutType={layoutType}
                  logoPosition={logoPosition}
                  titlePosition={titlePosition}
                  backgroundType={backgroundType}
                  colorTone={colorTone}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  aspect={previewAspect}
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo position */}
          <div>
            <Label className="text-[11px] font-semibold">Posição do logo</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1.5">
              {logoOpts.map(o => (
                <Button
                  key={o.value} type="button" size="sm"
                  variant={logoPosition === o.value ? "default" : "outline"}
                  onClick={() => setLogoPosition(o.value)}
                  className="h-7 text-[10px] px-1"
                >{o.label}</Button>
              ))}
            </div>
          </div>

          {/* Title position */}
          <div>
            <Label className="text-[11px] font-semibold">Posição do título</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1.5">
              {titleOpts.map(o => (
                <Button
                  key={o.value} type="button" size="sm"
                  variant={titlePosition === o.value ? "default" : "outline"}
                  onClick={() => setTitlePosition(o.value)}
                  className="h-7 text-[11px]"
                >{o.label}</Button>
              ))}
            </div>
          </div>

          {/* Background type */}
          <div>
            <Label className="text-[11px] font-semibold">Tipo de fundo</Label>
            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
              {bgOpts.map(o => (
                <Button
                  key={o.value} type="button" size="sm"
                  variant={backgroundType === o.value ? "default" : "outline"}
                  onClick={() => setBackgroundType(o.value)}
                  className="h-7 text-[11px] gap-1"
                >
                  <span>{o.emoji}</span>{o.label}
                </Button>
              ))}
            </div>

            {backgroundType === "solid_color" && (
              <div className="flex items-center gap-2 mt-2">
                <Label className="text-[10px] text-muted-foreground">Cor:</Label>
                <Input
                  type="color" value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-8 w-14 p-1 cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-8 text-[11px] flex-1"
                />
              </div>
            )}

            {backgroundType === "gradient" && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] text-muted-foreground w-10">De:</Label>
                  <Input
                    type="color" value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-8 w-14 p-1 cursor-pointer"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-8 text-[11px] flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] text-muted-foreground w-10">Para:</Label>
                  <Input
                    type="color" value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-8 w-14 p-1 cursor-pointer"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-8 text-[11px] flex-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Color tone */}
          <div>
            <Label className="text-[11px] font-semibold">Tom de cor</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {toneOpts.map(o => (
                <Button
                  key={o.value} type="button" size="sm"
                  variant={colorTone === o.value ? "default" : "outline"}
                  onClick={() => setColorTone(o.value)}
                  className="h-7 text-[11px]"
                >{o.label}</Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

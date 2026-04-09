// @ts-nocheck
import React from "react";
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
function Step3TypeQuantity({ tipoPostagem, setTipoPostagem, quantity, setQuantity, carouselSlides, setCarouselSlides, creditCost }: StepProps) {
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
        <div>
          <Label className="text-xs">Quantos slides no carrossel?</Label>
          <div className="flex gap-2 mt-2">
            {[2, 3, 5, 7, 10].map(n => (
              <Button key={n} variant={carouselSlides === n ? "default" : "outline"} size="sm" onClick={() => setCarouselSlides(n)}>{n}</Button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{creditCost} créditos/slide</p>
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
        <Textarea
          placeholder="Descreva o que quer comunicar na arte..."
          value={briefingText}
          onChange={(e) => setBriefingText(e.target.value)}
          rows={3}
          className="resize-none"
        />
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

/* ── Step 8: Layout ── */
function Step8Layout({ layoutType, setLayoutType }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">📐 Escolha como sua arte será organizada</h3>
        <p className="text-sm text-muted-foreground">A diagramação define o posicionamento dos elementos</p>
      </div>
      <LayoutPicker
        selected={[layoutType]}
        onSelect={(v) => setLayoutType(v[0] || "hero_center")}
      />
    </div>
  );
}

// @ts-nocheck
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RefUploader } from "./RefUploader";
import {
  ART_FORMATS, POST_TYPES, ART_OBJECTIVES, TEXT_MODES,
  PRINT_FORMATS, PRINT_TYPES, LAYOUT_TYPES,
} from "./constants";
import type { SmartSuggestions } from "@/utils/smartSuggestions";
import { LayoutPicker } from "./LayoutPicker";
import { VisualIdentity } from "@/hooks/useVisualIdentity";
import {
  Check, X, Loader2, Plus, Upload, Star, Camera, Info, Pencil, Wand2,
} from "lucide-react";
import type { ArtTextItem } from "./ArtWizard";

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

/* ─── Steps 1-13 ─── */

interface StepProps {
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
  // New fields
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
}

export function ArtWizardStep(props: StepProps) {
  switch (props.step) {
    case 1: return <Step1MaterialType {...props} />;
    case 2: return <Step2Format {...props} />;
    case 3: return <Step3TypeQuantity {...props} />;
    case 4: return <Step4Objective {...props} />;
    case 5: return <Step5Topic {...props} />;
    case 6: return <Step6TextMode {...props} />;
    case 7: return <Step7Audience {...props} />;
    case 8: return <Step8Layout {...props} />;
    case 9: return <Step9References {...props} />;
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
      {tipoPostagem === "carrossel" && (
        <div>
          <Label className="text-xs">Quantos slides no carrossel?</Label>
          <div className="flex gap-2 mt-2">
            {[2, 3, 5, 7, 10].map(n => (
              <Button key={n} variant={carouselSlides === n ? "default" : "outline"} size="sm" onClick={() => setCarouselSlides(n)}>{n}</Button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{creditCost} créditos/slide</p>
        </div>
      )}
      {tipoPostagem !== "carrossel" && (
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
function Step5Topic({ topic, setTopic }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">💡 Sobre o que é essa arte?</h3>
        <p className="text-sm text-muted-foreground">Descreva o assunto principal</p>
      </div>
      <Textarea
        placeholder={props.suggestions?.topicPlaceholder || "Ex: consórcio de imóveis, clínica odontológica, lançamento de curso, evento corporativo..."}
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        rows={3}
        className="resize-none"
      />
      <div className="flex flex-wrap gap-1.5">
        {(props.suggestions?.topics || ["Consórcio", "Imóvel", "Clínica", "Curso", "Evento", "Seguro", "Produto novo"]).map(s => (
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
        <div className="space-y-3">
          <Textarea
            placeholder="Descreva o que quer comunicar na arte..."
            value={briefingText}
            onChange={(e) => setBriefingText(e.target.value)}
            rows={3}
            className="resize-none"
          />
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
function Step7Audience({ audience, setAudience }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">👤 Para quem é essa arte?</h3>
        <p className="text-sm text-muted-foreground">Defina o público-alvo para a IA adaptar linguagem e visual</p>
      </div>
      <Input
        placeholder="Ex: empresários, mulheres 25-45, médicos, público geral..."
        value={audience}
        onChange={(e) => setAudience(e.target.value)}
      />
      <div className="flex flex-wrap gap-1.5">
        {AUDIENCE_SUGGESTIONS.map(s => (
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

/* ── Step 9: References ── */
function Step9References({ referenceUrls, setReferenceUrls, orgId, uploading, setUploading, visualIdentity, primaryRefIndex, setPrimaryRefIndex }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold mb-1">🎨 Referências visuais</h3>
        <p className="text-sm text-muted-foreground">
          Envie pelo menos <strong>3 referências</strong> para a IA entender o estilo da sua marca
        </p>
      </div>
      <Card className="bg-accent/30 border-accent">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">O que são referências visuais?</p>
              <p>São <strong>exemplos de artes que você gosta</strong> — posts de outras marcas, materiais antigos, paletas de cores.</p>
              <p className="text-xs"><strong>Dica:</strong> Marque com ⭐ a referência principal. Mínimo 3 referências.</p>
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
      {referenceUrls.length < 3 && (
        <p className="text-xs text-destructive">Envie pelo menos 3 referências para continuar</p>
      )}
    </div>
  );
}

/* ── Step 10: Logo ── */
function Step10Logo({ logoUrl, setLogoUrl, onLogoUpload }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold mb-1">🏷️ Logo da sua empresa</h3>
        <p className="text-sm text-muted-foreground">
          Sua logo será aplicada na arte final sem ser redesenhada ou alterada.
        </p>
      </div>
      <Card className="bg-accent/30 border-accent">
        <CardContent className="p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong>PNG com fundo transparente</strong> é o ideal. A IA reserva espaço na arte e sobrepõe sua logo original, garantindo fidelidade total.
          </p>
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
            <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => setLogoUrl("")}>
              Trocar logo
            </Button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Clique para enviar sua logo</p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou SVG</p>
          <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
        </label>
      )}
    </div>
  );
}

/* ── Step 11: Images (3 categories) ── */
function Step11Images({ baseImageUrl, setBaseImageUrl, characterImageUrl, setCharacterImageUrl, backgroundImageUrl, setBackgroundImageUrl, onPhotoUpload, uploadingPhotos }: StepProps) {
  const renderImageSlot = (label: string, desc: string, url: string, onClear: () => void, category: "base" | "character" | "background") => (
    <div className="space-y-2">
      <Label className="text-xs font-semibold">{label}</Label>
      <p className="text-[10px] text-muted-foreground">{desc}</p>
      {url ? (
        <div className="relative group w-24 h-24 rounded-xl overflow-hidden border-2 border-primary">
          <img src={url} alt={label} className="w-full h-full object-cover" />
          <button
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            onClick={onClear}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary cursor-pointer">
          <Plus className="w-5 h-5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Enviar</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhotoUpload(e, category)} />
        </label>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold mb-1">📷 Imagens para a arte</h3>
        <Badge variant="outline" className="text-[10px]">Opcional</Badge>
        <p className="text-sm text-muted-foreground mt-1">
          Fotos reais que devem aparecer na composição
        </p>
      </div>
      <Card className="bg-accent/30 border-accent">
        <CardContent className="p-3 flex items-start gap-2">
          <Camera className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong>Diferença de referência vs foto:</strong> Referências definem o estilo visual. Fotos são inseridas diretamente na arte final.
          </p>
        </CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-4">
        {renderImageSlot("Imagem base", "Foto principal / produto", baseImageUrl, () => setBaseImageUrl(""), "base")}
        {renderImageSlot("Pessoa / Rosto", "Foto de pessoa para incluir", characterImageUrl, () => setCharacterImageUrl(""), "character")}
        {renderImageSlot("Fundo", "Imagem de fundo específica", backgroundImageUrl, () => setBackgroundImageUrl(""), "background")}
      </div>
      <p className="text-xs text-muted-foreground">Você pode pular esta etapa se não tiver fotos.</p>
    </div>
  );
}

/* ── Step 12: Elements ── */
function Step12Elements({ elements, setElements }: StepProps) {
  const toggleElement = (el: string) => {
    if (elements.includes(el)) setElements(elements.filter(e => e !== el));
    else setElements([...elements, el]);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">🧩 O que você quer que apareça na arte?</h3>
        <Badge variant="outline" className="text-[10px]">Opcional</Badge>
        <p className="text-sm text-muted-foreground mt-1">Selecione elementos visuais desejados</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {ELEMENT_SUGGESTIONS.map(el => (
          <Badge
            key={el}
            variant={elements.includes(el) ? "default" : "outline"}
            className="cursor-pointer text-xs py-1.5 px-3"
            onClick={() => toggleElement(el)}
          >
            {elements.includes(el) && <Check className="w-3 h-3 mr-1" />}
            {el}
          </Badge>
        ))}
      </div>
    </div>
  );
}

/* ── Step 13: Restrictions ── */
function Step13Restrictions({ restrictions, setRestrictions }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">🚫 Tem algo que você NÃO quer na arte?</h3>
        <Badge variant="outline" className="text-[10px]">Opcional</Badge>
        <p className="text-sm text-muted-foreground mt-1">A IA vai evitar esses elementos</p>
      </div>
      <Textarea
        placeholder="Ex: não usar vermelho, não colocar pessoas, não usar fundo escuro, não deixar poluído..."
        value={restrictions}
        onChange={(e) => setRestrictions(e.target.value)}
        rows={3}
        className="resize-none"
      />
      <div className="flex flex-wrap gap-1.5">
        {["Sem vermelho", "Sem pessoas", "Sem fundo escuro", "Sem poluição visual", "Sem visual infantil"].map(s => (
          <Badge
            key={s}
            variant="outline"
            className="cursor-pointer hover:bg-destructive/10 text-xs"
            onClick={() => setRestrictions(prev => prev ? `${prev}, ${s.toLowerCase()}` : s.toLowerCase())}
          >
            {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 14: Review ─── */

interface StepReviewProps {
  artTexts: ArtTextItem[];
  updateArtText: (index: number, field: keyof ArtTextItem, value: string | boolean) => void;
  editingPieceIndex: number | null;
  setEditingPieceIndex: (v: number | null) => void;
  totalPieces: number;
  creditCost: number;
  isFillingAI: boolean;
  briefingFilled: boolean;
  allTextsApproved: boolean;
  referenceUrls: string[];
  logoUrl: string;
  photoUrls: string[];
  primaryRefIndex: number;
  outputMode: "digital" | "print";
  printFormat: string;
  artFormat: string;
  tipoPostagem: string;
  visualIdentity: VisualIdentity | null | undefined;
  textMode: "ai" | "manual";
  onRegenerateTexts: () => void;
  setBriefingFilled: (v: boolean) => void;
  setArtTexts: (v: ArtTextItem[]) => void;
}

export function ArtWizardStepReview({
  artTexts, updateArtText, editingPieceIndex, setEditingPieceIndex,
  totalPieces, creditCost, isFillingAI, briefingFilled, allTextsApproved,
  referenceUrls, logoUrl, photoUrls, primaryRefIndex,
  outputMode, printFormat, artFormat, tipoPostagem, visualIdentity,
  textMode,
  onRegenerateTexts, setBriefingFilled, setArtTexts,
}: StepReviewProps) {
  const reviewTotalCost = totalPieces * creditCost;
  const selectedFormat = outputMode === "print"
    ? PRINT_FORMATS.find(f => f.value === printFormat)
    : ART_FORMATS.find(f => f.value === artFormat);
  const selectedType = POST_TYPES.find(t => t.value === tipoPostagem);
  const approvedCount = artTexts.reduce((acc, t) =>
    acc + (t.approvedHeadline ? 1 : 0) + (t.approvedSub ? 1 : 0) + (t.approvedSupport ? 1 : 0) + (t.approvedCta ? 1 : 0), 0);
  const totalApprovals = artTexts.length * 4;

  // For manual mode, always show editing
  const isManual = textMode === "manual";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">✅ Revisão final</h3>
        <p className="text-sm text-muted-foreground">
          {isFillingAI ? "A nossa IA está gerando os textos..." : isManual ? "Escreva e aprove os textos de cada peça." : "Revise e aprove os textos gerados pela IA."}
        </p>
      </div>

      {isFillingAI && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-sm text-primary">Gerando textos com a nossa IA...</p>
          </CardContent>
        </Card>
      )}

      {!isFillingAI && briefingFilled && artTexts.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${totalApprovals > 0 ? (approvedCount / totalApprovals) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{approvedCount}/{totalApprovals} aprovados</span>
          </div>

          {artTexts.map((art, i) => {
            const isEditing = isManual || editingPieceIndex === i;
            const pieceApproved = art.approvedHeadline && art.approvedSub && art.approvedSupport && art.approvedCta;

            return (
              <Card key={i} className={pieceApproved ? "border-primary/40 bg-primary/5" : ""}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={pieceApproved ? "default" : "outline"} className="text-[10px]">
                      {pieceApproved && <Check className="w-3 h-3 mr-1" />}
                      Peça {i + 1} de {totalPieces}
                    </Badge>
                    {!isManual && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setEditingPieceIndex(isEditing ? null : i)}>
                        <Pencil className="w-3 h-3" />{isEditing ? "Fechar" : "Editar"}
                      </Button>
                    )}
                  </div>

                  {/* Headline */}
                  <div className="flex items-start gap-2">
                    <Checkbox checked={art.approvedHeadline} onCheckedChange={(v) => updateArtText(i, "approvedHeadline", !!v)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-muted-foreground">Headline</p>
                      {isEditing ? (
                        <Input value={art.headline} onChange={(e) => updateArtText(i, "headline", e.target.value)} className="mt-0.5 h-8 text-xs" />
                      ) : (
                        <p className="text-xs font-semibold">{art.headline || "—"}</p>
                      )}
                    </div>
                  </div>

                  {/* Subheadline */}
                  <div className="flex items-start gap-2">
                    <Checkbox checked={art.approvedSub} onCheckedChange={(v) => updateArtText(i, "approvedSub", !!v)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-muted-foreground">Subtítulo</p>
                      {isEditing ? (
                        <Input value={art.subheadline} onChange={(e) => updateArtText(i, "subheadline", e.target.value)} className="mt-0.5 h-8 text-xs" />
                      ) : (
                        <p className="text-xs">{art.subheadline || "—"}</p>
                      )}
                    </div>
                  </div>

                  {/* Supporting text */}
                  <div className="flex items-start gap-2">
                    <Checkbox checked={art.approvedSupport} onCheckedChange={(v) => updateArtText(i, "approvedSupport", !!v)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-muted-foreground">Texto de apoio</p>
                      {isEditing ? (
                        <Textarea value={art.supportingText} onChange={(e) => updateArtText(i, "supportingText", e.target.value)} rows={2} className="mt-0.5 resize-none text-xs" />
                      ) : (
                        <p className="text-xs line-clamp-2">{art.supportingText || "—"}</p>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-start gap-2">
                    <Checkbox checked={art.approvedCta} onCheckedChange={(v) => updateArtText(i, "approvedCta", !!v)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-muted-foreground">CTA</p>
                      {isEditing ? (
                        <Input value={art.cta} onChange={(e) => updateArtText(i, "cta", e.target.value)} className="mt-0.5 h-8 text-xs" />
                      ) : (
                        <p className="text-xs">{art.cta || "—"}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

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
                    {referenceUrls.slice(0, 5).map((url, i) => (
                      <div key={i} className={`w-10 h-10 rounded-md overflow-hidden border ${primaryRefIndex === i ? "border-primary border-2" : "border-border"}`}>
                        <img src={url} alt="Referência" className="w-full h-full object-cover" />
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
                <span className="text-muted-foreground">Formato:</span>
                <span>{selectedFormat?.label}</span>
              </div>
              <div className="pt-2 border-t mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Custo total</span>
                  <Badge variant="secondary" className="text-xs">{reviewTotalCost} créditos</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {textMode === "ai" && (
            <Button variant="outline" size="sm" onClick={onRegenerateTexts} disabled={isFillingAI} className="w-full">
              <Wand2 className="w-3 h-3 mr-1" /> Regenerar textos com IA
            </Button>
          )}
        </>
      )}
    </div>
  );
}

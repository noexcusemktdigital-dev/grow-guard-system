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
  ART_FORMATS, POST_TYPES, ART_OBJECTIVES,
  PRINT_FORMATS, PRINT_TYPES,
} from "./constants";
import { VisualIdentity } from "@/hooks/useVisualIdentity";
import {
  Check, X, Loader2, Sparkles, Plus, Upload, Star, Camera, Info, Pencil, Wand2,
} from "lucide-react";
import type { ArtTextItem, ArtBriefingResult } from "./ArtWizard";

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

/* ─── Steps 1-7 ─── */

interface StepProps {
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
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  contentData: Record<string, unknown>;
}

export function ArtWizardStep({ step, ...props }: StepProps & { step: number }) {
  switch (step) {
    case 1: return <Step1OutputMode {...props} />;
    case 2: return <Step2Briefing {...props} />;
    case 3: return <Step3Type {...props} />;
    case 4: return <Step4Logo {...props} />;
    case 5: return <Step5References {...props} />;
    case 6: return <Step6Photos {...props} />;
    case 7: return <Step7Format {...props} />;
    default: return null;
  }
}

function Step1OutputMode({ outputMode, setOutputMode, printType, setPrintType }: StepProps) {
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
}

function Step2Briefing({ briefingText, setBriefingText, objective, setObjective, mandatoryPhrase, setMandatoryPhrase }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">💡 O que você quer comunicar?</h3>
        <p className="text-sm text-muted-foreground">
          Descreva livremente. A nossa IA vai gerar todos os textos, cena e composição para você.
        </p>
      </div>
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
}

function Step3Type({ tipoPostagem, setTipoPostagem, quantity, setQuantity, carouselSlides, setCarouselSlides, creditCost }: StepProps) {
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
}

function Step4Logo({ logoUrl, setLogoUrl, onLogoUpload }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold mb-1">🏷️ Logo da marca</h3>
        <p className="text-sm text-muted-foreground">
          Sua logo será aplicada automaticamente na arte final gerada pela nossa IA.
        </p>
      </div>
      <Card className="bg-accent/30 border-accent">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Por que a logo é importante?</p>
            <p>A nossa IA reserva um espaço limpo na arte e sobrepõe sua logo original, sem redesenhá-la. Isso garante fidelidade visual total da sua marca.</p>
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
          <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
        </label>
      )}
    </div>
  );
}

function Step5References({ referenceUrls, setReferenceUrls, orgId, uploading, setUploading, visualIdentity, primaryRefIndex, setPrimaryRefIndex }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold mb-1">🎨 Referências visuais</h3>
        <p className="text-sm text-muted-foreground">
          A nossa IA extrai <strong>cores, fontes e estilo</strong> das referências para criar artes no mesmo padrão visual.
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
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-primary">
            <strong>A diagramação e o layout da arte serão criados com base na sua referência principal ⭐.</strong> Escolha referências que representem o estilo de composição desejado.
          </p>
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
}

function Step6Photos({ photoUrls, setPhotoUrls, uploadingPhotos, onPhotoUpload }: StepProps) {
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
            <img src={url} alt="Referência visual" className="w-full h-full object-cover" />
            <button
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              onClick={() => setPhotoUrls(photoUrls.filter((_, j) => j !== i))}
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
            input.onchange = (ev) => onPhotoUpload(ev as unknown as React.ChangeEvent<HTMLInputElement>);
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
}

function Step7Format({ outputMode, printType, printFormat, setPrintFormat, artFormat, setArtFormat, artFormats, setArtFormats, totalPieces, tipoPostagem }: StepProps) {
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

/* ─── Step 8: Review ─── */

interface Step8ReviewProps {
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
  onRegenerateTexts: () => void;
  setBriefingFilled: (v: boolean) => void;
  setArtTexts: (v: ArtTextItem[]) => void;
}

export function ArtWizardStep8Review({
  artTexts, updateArtText, editingPieceIndex, setEditingPieceIndex,
  totalPieces, creditCost, isFillingAI, briefingFilled, allTextsApproved,
  referenceUrls, logoUrl, photoUrls, primaryRefIndex,
  outputMode, printFormat, artFormat, tipoPostagem, visualIdentity,
  onRegenerateTexts, setBriefingFilled, setArtTexts,
}: Step8ReviewProps) {
  const reviewTotalCost = totalPieces * creditCost;
  const selectedFormat = outputMode === "print"
    ? PRINT_FORMATS.find(f => f.value === printFormat)
    : ART_FORMATS.find(f => f.value === artFormat);
  const selectedType = POST_TYPES.find(t => t.value === tipoPostagem);
  const approvedCount = artTexts.reduce((acc, t) =>
    acc + (t.approvedHeadline ? 1 : 0) + (t.approvedSub ? 1 : 0) + (t.approvedSupport ? 1 : 0) + (t.approvedCta ? 1 : 0), 0);
  const totalApprovals = artTexts.length * 4;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">✅ Revisão final</h3>
        <p className="text-sm text-muted-foreground">
          {isFillingAI ? "A IA está gerando os textos..." : "Revise e aprove os textos de cada peça individualmente."}
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

      {!isFillingAI && briefingFilled && artTexts.length > 0 && (
        <>
          {/* Approval progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${totalApprovals > 0 ? (approvedCount / totalApprovals) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{approvedCount}/{totalApprovals} aprovados</span>
          </div>

          {/* Per-art cards */}
          {artTexts.map((art, i) => {
            const isEditing = editingPieceIndex === i;
            const pieceApproved = art.approvedHeadline && art.approvedSub && art.approvedSupport && art.approvedCta;

            return (
              <Card key={i} className={pieceApproved ? "border-primary/40 bg-primary/5" : ""}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={pieceApproved ? "default" : "outline"} className="text-[10px]">
                        {pieceApproved && <Check className="w-3 h-3 mr-1" />}
                        Peça {i + 1} de {totalPieces}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1"
                      onClick={() => setEditingPieceIndex(isEditing ? null : i)}
                    >
                      <Pencil className="w-3 h-3" />
                      {isEditing ? "Fechar" : "Editar"}
                    </Button>
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
                      <p className="text-[10px] font-medium text-muted-foreground">Subheadline</p>
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
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">Referências ({referenceUrls.length}){logoUrl ? " + Logo" : ""}{photoUrls.length > 0 ? ` + ${photoUrls.length} fotos` : ""}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {logoUrl && (
                      <div className="w-10 h-10 rounded-md overflow-hidden border-2 border-primary">
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain bg-white p-0.5" />
                      </div>
                    )}
                    {referenceUrls.slice(0, 5).map((url, i) => (
                      <div key={i} className={`w-10 h-10 rounded-md overflow-hidden border ${primaryRefIndex === i ? "border-primary border-2" : "border-border"}`}>
                        <img src={url} alt="Referência visual" className="w-full h-full object-cover" />
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
                <span>{selectedFormat?.label} ({(selectedFormat as unknown as { ratio?: string; cm?: string })?.ratio || (selectedFormat as unknown as { ratio?: string; cm?: string })?.cm})</span>
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
            onClick={onRegenerateTexts}
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

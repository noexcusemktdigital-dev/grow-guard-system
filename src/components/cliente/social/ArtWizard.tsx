import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { RefUploader } from "./RefUploader";
import { ContentPickerDialog } from "./ContentPickerDialog";
import {
  ART_FORMATS, ART_STYLES, POST_TYPES, ELEMENT_SUGGESTIONS, SCENE_SUGGESTIONS,
} from "./constants";
import { ContentItem } from "@/hooks/useClienteContentV2";
import { VisualIdentity } from "@/hooks/useVisualIdentity";
import {
  Check, FileText, X, Wand2, Loader2, Plus, AlertTriangle, FileDown, Sparkles, ArrowLeft,
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

const TOTAL_STEPS = 8;

export function ArtWizard({
  orgId, visualIdentity, contentHistory, contentData, setContentData,
  contentId, setContentId, briefingFilled, setBriefingFilled,
  onGenerate, onFillWithAI, isFillingAI, canAfford, creditCost, onBack,
}: ArtWizardProps) {
  const [step, setStep] = useState(1);
  const [briefingText, setBriefingText] = useState("");
  const [showContentPicker, setShowContentPicker] = useState(false);

  // Step 2: Type + quantity
  const [tipoPostagem, setTipoPostagem] = useState("post_unico");
  const [quantity, setQuantity] = useState(1);
  const [carouselSlides, setCarouselSlides] = useState(5);

  // Step 3: Style
  const [artStyle, setArtStyle] = useState("minimalista");

  // Step 4: References
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Step 5: Format
  const [artFormat, setArtFormat] = useState("portrait");

  // Step 6: Text fields
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [cta, setCta] = useState("");
  const [supportingText, setSupportingText] = useState("");
  const [bulletPoints, setBulletPoints] = useState("");
  const [brandName, setBrandName] = useState("");

  // Step 7: Scene
  const [cena, setCena] = useState("");
  const [elementosVisuais, setElementosVisuais] = useState("");
  const [manualColors, setManualColors] = useState("");
  const [manualStyle, setManualStyle] = useState("");

  // Auto-load references from visual identity
  useEffect(() => {
    if (referenceUrls.length === 0 && visualIdentity) {
      if (visualIdentity.image_bank_urls?.length) {
        setReferenceUrls(visualIdentity.image_bank_urls.slice(0, 5));
      } else if (visualIdentity.logo_url) {
        setReferenceUrls([visualIdentity.logo_url]);
      }
    }
  }, [visualIdentity]);

  const fillTextFromContent = (content: ContentItem) => {
    const res = content.result as any;
    if (!res) return;
    const principal = res.conteudo_principal || res;
    setHeadline(principal.headline || principal.titulo || content.title || "");
    setSubheadline(principal.subtitulo || principal.subheadline || "");
    setSupportingText(res.legenda ? String(res.legenda).slice(0, 300) : principal.texto_apoio || "");
    setBulletPoints(
      Array.isArray(principal.bullet_points)
        ? principal.bullet_points.join(", ")
        : principal.bullet_points || ""
    );
    setCta(principal.cta || res.cta || content.cta || "");
    toast({ title: "Texto importado!", description: "Revise e ajuste os campos." });
  };

  const handleFillAI = async () => {
    const result = await onFillWithAI(briefingText, contentData);
    if (result) {
      setHeadline(result.headline || "");
      setSubheadline(result.subheadline || "");
      setCta(result.cta || "");
      setCena(result.cena || "");
      setElementosVisuais(result.elementos_visuais || "");
      setSupportingText(result.supporting_text || "");
      setBulletPoints(result.bullet_points || "");
      if (result.suggested_format) setArtFormat(result.suggested_format);
      if (result.suggested_tipo) setTipoPostagem(result.suggested_tipo);
      setBriefingFilled(true);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return true;
      case 3: return true;
      case 4: return referenceUrls.length >= 3;
      case 5: return true;
      case 6: return !!headline.trim();
      case 7: return true;
      case 8: return true;
      default: return true;
    }
  };

  const handleGenerate = () => {
    if (!headline.trim()) {
      toast({ title: "Insira a headline da arte", variant: "destructive" });
      return;
    }
    if (referenceUrls.length < 3) {
      toast({ title: "Envie pelo menos 3 referências", variant: "destructive" });
      return;
    }
    onGenerate({
      format: artFormat,
      style: artStyle,
      tipoPostagem,
      headline, subheadline, cta, cena, elementosVisuais,
      manualColors, manualStyle, brandName, supportingText, bulletPoints,
      referenceUrls, contentId, quantity,
      carouselSlides: tipoPostagem === "carrossel" ? carouselSlides : 0,
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
      // ─── Step 1: Briefing ───
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">💡 O que você quer comunicar?</h3>
              <p className="text-sm text-muted-foreground">
                Descreva livremente. A IA vai estruturar tudo para você.
                Ou vincule um conteúdo já gerado na plataforma.
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

            <div className="flex gap-2">
              <Button
                onClick={handleFillAI}
                disabled={isFillingAI || (!briefingText.trim() && !contentData)}
                className="flex-1"
                variant="secondary"
              >
                {isFillingAI ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                {isFillingAI ? "Preenchendo…" : "Preencher com IA"}
              </Button>
              <Button variant="outline" onClick={() => setShowContentPicker(true)}>
                <FileText className="w-4 h-4 mr-1" /> Vincular conteúdo
              </Button>
            </div>

            {briefingFilled && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-xs text-primary">Campos preenchidos! Avance para continuar.</p>
                </CardContent>
              </Card>
            )}

            <ContentPickerDialog
              open={showContentPicker}
              onOpenChange={setShowContentPicker}
              contentHistory={contentHistory}
              onSelect={(c) => {
                setContentId(c.id);
                setContentData(c);
                fillTextFromContent(c);
              }}
            />
          </div>
        );

      // ─── Step 2: Type + Quantity ───
      case 2:
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
                    <Button
                      key={n}
                      variant={carouselSlides === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCarouselSlides(n)}
                    >
                      {n} slides
                    </Button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Cada slide será gerado individualmente com a mesma identidade visual ({creditCost} créditos/slide)
                </p>
              </div>
            )}

            {tipoPostagem !== "carrossel" && (
              <div>
                <Label className="text-xs">Quantas peças gerar de uma vez?</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Button
                      key={n}
                      variant={quantity === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setQuantity(n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Custo total: {(tipoPostagem !== "carrossel" ? quantity : carouselSlides) * creditCost} créditos
                </p>
              </div>
            )}
          </div>
        );

      // ─── Step 3: Style ───
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">🎨 Estilo de diagramação</h3>
              <p className="text-sm text-muted-foreground">
                Escolha o estilo visual. A IA vai combinar com suas referências para manter a identidade.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ART_STYLES.map((s) => (
                <SelectCard key={s.value} selected={artStyle === s.value} onClick={() => setArtStyle(s.value)}>
                  <CardContent className="p-0 overflow-hidden">
                    <div className={`h-20 ${s.colors} flex items-center justify-center`}>
                      <span className="text-3xl">{s.emoji}</span>
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm">{s.label}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  </CardContent>
                </SelectCard>
              ))}
            </div>
          </div>
        );

      // ─── Step 4: References ───
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">📸 Referências visuais</h3>
              <p className="text-sm text-muted-foreground">
                A IA extrai <strong>cores, fontes e logo</strong> das suas referências.
                Envie pelo menos 3 imagens de qualidade.
              </p>
            </div>
            <Card className="bg-accent/30 border-accent">
              <CardContent className="p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <strong>Dica:</strong> Envie artes anteriores da marca, posts que você gostou, 
                  screenshots de referência ou materiais institucionais. 
                  Quanto mais referências, mais fiel ao seu estilo.
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
            />
          </div>
        );

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

      // ─── Step 6: Text ───
      case 6:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">✏️ Textos da arte</h3>
              <p className="text-sm text-muted-foreground">
                {briefingFilled
                  ? "Campos pré-preenchidos pela IA. Revise e ajuste."
                  : "Preencha os textos que aparecerão na arte. Ou importe de um conteúdo."}
              </p>
            </div>

            {contentData && (
              <Card className="bg-accent/50 border-accent">
                <CardContent className="p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-medium truncate">Conteúdo: {contentData.title}</span>
                  </div>
                  <Button size="sm" variant="secondary" className="shrink-0 text-xs" onClick={() => fillTextFromContent(contentData)}>
                    <FileDown className="w-3 h-3 mr-1" /> Usar texto
                  </Button>
                </CardContent>
              </Card>
            )}

            {!contentData && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => setShowContentPicker(true)}>
                <FileText className="w-4 h-4 mr-2" /> Importar de um conteúdo
              </Button>
            )}

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Headline principal <span className="text-destructive">*</span></Label>
                <Input placeholder="Ex: Escalar não é sorte" value={headline} onChange={(e) => setHeadline(e.target.value)} className="mt-1" />
                <p className="text-[10px] text-muted-foreground mt-0.5">Texto principal da arte (máx. 6 palavras para melhor impacto)</p>
              </div>
              <div>
                <Label className="text-xs">Subheadline</Label>
                <Input placeholder="Ex: É processo" value={subheadline} onChange={(e) => setSubheadline(e.target.value)} className="mt-1" />
                <p className="text-[10px] text-muted-foreground mt-0.5">Complemento da headline (2-4 palavras)</p>
              </div>
              <div>
                <Label className="text-xs">Texto de apoio</Label>
                <Textarea placeholder="Ex: Com a estratégia certa, seus resultados mudam." value={supportingText} onChange={(e) => setSupportingText(e.target.value)} rows={2} className="mt-1 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Bullet points</Label>
                  <Input placeholder="Ex: Tempo, Renda, Objetivo" value={bulletPoints} onChange={(e) => setBulletPoints(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Call to Action</Label>
                  <Input placeholder="Ex: Conheça o método" value={cta} onChange={(e) => setCta(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Nome da marca</Label>
                <Input placeholder="Ex: Klir, NoExcuse" value={brandName} onChange={(e) => setBrandName(e.target.value)} className="mt-1" />
              </div>
            </div>

            <ContentPickerDialog
              open={showContentPicker}
              onOpenChange={setShowContentPicker}
              contentHistory={contentHistory}
              onSelect={(c) => {
                setContentId(c.id);
                setContentData(c);
                fillTextFromContent(c);
              }}
            />
          </div>
        );

      // ─── Step 7: Scene ───
      case 7:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">🎬 Cena e elementos (opcional)</h3>
              <p className="text-sm text-muted-foreground">
                Descreva o cenário e objetos que devem aparecer. Se não preencher, a IA decide com base no estilo e referências.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Descrição da cena</Label>
                <Textarea
                  placeholder="Ex: Empresário analisando dashboard no notebook em escritório moderno com luz natural"
                  value={cena}
                  onChange={(e) => setCena(e.target.value)}
                  rows={3}
                  className="mt-1 resize-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SCENE_SUGGESTIONS.map((s) => (
                    <Badge key={s} variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors text-xs" onClick={() => setCena(s)}>
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Elementos visuais</Label>
                <Input
                  placeholder="Ex: Notebook, smartphone, gráfico subindo"
                  value={elementosVisuais}
                  onChange={(e) => setElementosVisuais(e.target.value)}
                  className="mt-1"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ELEMENT_SUGGESTIONS.map((s) => (
                    <Badge key={s} variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors text-xs" onClick={() => setElementosVisuais((prev) => prev ? `${prev}, ${s}` : s)}>
                      <Plus className="w-3 h-3 mr-1" /> {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {visualIdentity ? (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-primary" />
                      <p className="text-xs font-semibold text-primary">Identidade visual aplicada automaticamente</p>
                    </div>
                    {visualIdentity.palette && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {(Array.isArray(visualIdentity.palette) ? visualIdentity.palette : []).map((c: any, i: number) => (
                          <div key={i} className="w-5 h-5 rounded-full border" style={{ backgroundColor: c.hex || c }} title={c.label || c.hex || c} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Cores da marca (sem identidade cadastrada)</Label>
                    <Input placeholder="Ex: Azul profundo e branco" value={manualColors} onChange={(e) => setManualColors(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Estilo visual</Label>
                    <Input placeholder="Ex: Corporativo premium, minimalista" value={manualStyle} onChange={(e) => setManualStyle(e.target.value)} className="mt-1" />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      // ─── Step 8: Review ───
      case 8: {
        const totalPieces = tipoPostagem === "carrossel" ? carouselSlides : quantity;
        const totalCost = totalPieces * creditCost;
        const selectedStyle = ART_STYLES.find(s => s.value === artStyle);
        const selectedFormat = ART_FORMATS.find(f => f.value === artFormat);
        const selectedType = POST_TYPES.find(t => t.value === tipoPostagem);

        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">✅ Revisão final</h3>
              <p className="text-sm text-muted-foreground">Confira tudo antes de gerar</p>
            </div>

            {referenceUrls.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Referências ({referenceUrls.length})</p>
                <div className="flex flex-wrap gap-2">
                  {referenceUrls.map((url, i) => (
                    <div key={i} className="w-14 h-14 rounded-lg overflow-hidden border">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Card className="bg-muted/30">
              <CardContent className="p-4 space-y-2">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                  <span className="text-muted-foreground font-medium">Tipo:</span>
                  <span>{selectedType?.icon} {selectedType?.label}</span>

                  <span className="text-muted-foreground font-medium">Quantidade:</span>
                  <span>{totalPieces} {tipoPostagem === "carrossel" ? "slides" : "peça(s)"}</span>

                  <span className="text-muted-foreground font-medium">Estilo:</span>
                  <span>{selectedStyle?.emoji} {selectedStyle?.label}</span>

                  <span className="text-muted-foreground font-medium">Formato:</span>
                  <span>{selectedFormat?.label} ({selectedFormat?.ratio})</span>

                  <span className="text-muted-foreground font-medium">Headline:</span>
                  <span className="font-semibold">{headline || "—"}</span>

                  {subheadline && <>
                    <span className="text-muted-foreground font-medium">Sub:</span>
                    <span>{subheadline}</span>
                  </>}

                  {cta && <>
                    <span className="text-muted-foreground font-medium">CTA:</span>
                    <span>{cta}</span>
                  </>}

                  {brandName && <>
                    <span className="text-muted-foreground font-medium">Marca:</span>
                    <span>{brandName}</span>
                  </>}

                  {cena && <>
                    <span className="text-muted-foreground font-medium">Cena:</span>
                    <span className="line-clamp-2">{cena}</span>
                  </>}

                  <span className="text-muted-foreground font-medium">Refs:</span>
                  <span>{referenceUrls.length} imagens</span>

                  {visualIdentity && <>
                    <span className="text-muted-foreground font-medium">Identidade:</span>
                    <span className="text-primary">✓ Aplicada automaticamente</span>
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
          </div>
        );
      }

      default:
        return null;
    }
  };

  const isLastStep = step === TOTAL_STEPS;
  const totalPieces = tipoPostagem === "carrossel" ? carouselSlides : quantity;
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
            disabled={!canProceed() || !canAfford}
            className="flex-1"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar {totalPieces > 1 ? `${totalPieces} peças` : "Arte"} ({totalCost} créditos)
          </Button>
        ) : (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="flex-1" size="lg">
            Continuar
          </Button>
        )}
      </div>
    </div>
  );
}

// @ts-nocheck
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ART_FORMATS, POST_TYPES, PRINT_FORMATS } from "./constants";
import { VisualIdentity } from "@/hooks/useVisualIdentity";
import { Check, Loader2, Pencil, Wand2, X } from "lucide-react";
import type { ArtTextItem } from "./ArtWizard";

export interface StepReviewProps {
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

function OptionSelector({
  label,
  options,
  currentValue,
  onSelect,
}: {
  label: string;
  options: string[];
  currentValue: string;
  onSelect: (value: string) => void;
}) {
  if (!options || options.length <= 1) return null;

  return (
    <div className="mt-1.5 space-y-1">
      <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
        Opções de {label}:
      </p>
      <div className="flex flex-col gap-1">
        {options.map((opt, idx) => {
          const isSelected = opt === currentValue;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(opt)}
              className={`text-left text-[11px] px-2.5 py-1.5 rounded-md border transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:border-border"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {isSelected && <Check className="w-3 h-3 shrink-0" />}
                <span className="text-[9px] text-muted-foreground/60 shrink-0">
                  {idx === 0 ? "💥" : idx === 1 ? "❓" : "💎"}
                </span>
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
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
  const isManual = textMode === "manual";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">✅ Revisão final</h3>
        <p className="text-sm text-muted-foreground">
          {isFillingAI ? "A nossa IA está gerando os textos..." : isManual ? "Escreva e aprove os textos de cada peça." : "Revise e aprove os textos gerados pela IA. Escolha entre as opções sugeridas."}
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
            const hasHeadlineOptions = art.headlineOptions && art.headlineOptions.length > 1;
            const hasSubheadlineOptions = art.subheadlineOptions && art.subheadlineOptions.length > 1;

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

                  <div className="flex items-start gap-2">
                    <Checkbox checked={art.approvedHeadline} onCheckedChange={(v) => updateArtText(i, "approvedHeadline", !!v)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-muted-foreground">Headline</p>
                      {isEditing ? (
                        <Input value={art.headline} onChange={(e) => updateArtText(i, "headline", e.target.value)} className="mt-0.5 h-8 text-xs" />
                      ) : (
                        <p className="text-xs font-semibold">{art.headline || "—"}</p>
                      )}
                      {!isManual && hasHeadlineOptions && (
                        <OptionSelector
                          label="headline"
                          options={art.headlineOptions!}
                          currentValue={art.headline}
                          onSelect={(val) => updateArtText(i, "headline", val)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox checked={art.approvedSub} onCheckedChange={(v) => updateArtText(i, "approvedSub", !!v)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-muted-foreground">Subtítulo</p>
                      {isEditing ? (
                        <Input value={art.subheadline} onChange={(e) => updateArtText(i, "subheadline", e.target.value)} className="mt-0.5 h-8 text-xs" />
                      ) : (
                        <p className="text-xs">{art.subheadline || "—"}</p>
                      )}
                      {!isManual && hasSubheadlineOptions && (
                        <OptionSelector
                          label="subtítulo"
                          options={art.subheadlineOptions!}
                          currentValue={art.subheadline}
                          onSelect={(val) => updateArtText(i, "subheadline", val)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox checked={art.approvedSupport} onCheckedChange={(v) => updateArtText(i, "approvedSupport", !!v)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-muted-foreground">Texto de apoio</p>
                      {isEditing ? (
                        <Textarea value={art.supportingText} onChange={(e) => updateArtText(i, "supportingText", e.target.value)} rows={2} className="mt-0.5 resize-none text-xs" />
                      ) : (
                        <p className="text-xs">{art.supportingText || "—"}</p>
                      )}
                    </div>
                  </div>

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

          {/* Summary card */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold">Resumo do pedido</p>
              <div className="grid grid-cols-3 gap-2">
                {referenceUrls.slice(0, 3).map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt={`Ref ${i + 1}`} className="w-full h-16 object-cover rounded-lg border" />
                    {i === primaryRefIndex && (
                      <div className="absolute top-1 left-1 bg-primary rounded-full p-0.5">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {logoUrl && (
                <div className="flex items-center gap-2">
                  <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded border bg-white p-0.5" />
                  <span className="text-xs text-muted-foreground">Logo incluída</span>
                </div>
              )}
              {photoUrls.length > 0 && (
                <div className="flex items-center gap-2">
                  {photoUrls.slice(0, 3).map((url, i) => (
                    <img key={i} src={url} alt={`Foto ${i + 1}`} className="w-8 h-8 object-cover rounded border" />
                  ))}
                  <span className="text-xs text-muted-foreground">{photoUrls.length} foto(s)</span>
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

// @ts-nocheck
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RefUploader } from "./RefUploader";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Check, X, Plus, Upload, Star, Camera, Info } from "lucide-react";
import type { StepProps } from "./ArtWizardSteps";

/* ── Step 9: References ── */
export function Step9References({ referenceUrls, setReferenceUrls, orgId, uploading, setUploading, visualIdentity, primaryRefIndex, setPrimaryRefIndex, referenceMemory }: StepProps) {
  const addRef = (url: string) => {
    if (!referenceUrls.includes(url)) setReferenceUrls([...referenceUrls, url]);
  };
  const hasFrequent = referenceMemory && referenceMemory.frequentRefs.length > 0;
  const hasApproved = referenceMemory && referenceMemory.approvedArts.length > 0;

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

      {hasFrequent && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors w-full">
            <span>🧠 Referências que você já usou</span>
            <Badge variant="secondary" className="text-xs">{referenceMemory.frequentRefs.length}</Badge>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="grid grid-cols-4 gap-2">
              {referenceMemory.frequentRefs.map((url, i) => {
                const alreadyAdded = referenceUrls.includes(url);
                return (
                  <div key={i} className="relative group">
                    <img src={url} alt={`Ref ${i + 1}`} className={`w-full h-20 object-cover rounded-lg border ${alreadyAdded ? "opacity-40 border-primary" : "border-border"}`} />
                    {!alreadyAdded && (
                      <button onClick={() => addRef(url)} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    )}
                    {alreadyAdded && <div className="absolute top-1 right-1"><Check className="w-3.5 h-3.5 text-primary" /></div>}
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {hasApproved && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors w-full">
            <span>✅ Artes aprovadas</span>
            <Badge variant="secondary" className="text-xs">{referenceMemory.approvedArts.length}</Badge>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <p className="text-xs text-muted-foreground mb-2">A IA aprendeu com suas artes aprovadas. Clique para usar como referência.</p>
            <div className="grid grid-cols-4 gap-2">
              {referenceMemory.approvedArts.map((url, i) => {
                const alreadyAdded = referenceUrls.includes(url);
                return (
                  <div key={i} className="relative group">
                    <img src={url} alt={`Arte ${i + 1}`} className={`w-full h-20 object-cover rounded-lg border ${alreadyAdded ? "opacity-40 border-primary" : "border-border"}`} />
                    {!alreadyAdded && (
                      <button onClick={() => addRef(url)} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    )}
                    {alreadyAdded && <div className="absolute top-1 right-1"><Check className="w-3.5 h-3.5 text-primary" /></div>}
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

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
export function Step10Logo({ logoUrl, setLogoUrl, onLogoUpload }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold mb-1">🏷️ Logo da sua empresa</h3>
        <p className="text-sm text-muted-foreground">Sua logo será aplicada na arte final sem ser redesenhada ou alterada.</p>
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

/* ── Step 11: Images ── */
export function Step11Images({ baseImageUrl, setBaseImageUrl, characterImageUrl, setCharacterImageUrl, backgroundImageUrl, setBackgroundImageUrl, onPhotoUpload, uploadingPhotos }: StepProps) {
  const renderImageSlot = (label: string, desc: string, url: string, onClear: () => void, category: "base" | "character" | "background") => (
    <div className="space-y-2">
      <Label className="text-xs font-semibold">{label}</Label>
      <p className="text-[10px] text-muted-foreground">{desc}</p>
      {url ? (
        <div className="relative group w-24 h-24 rounded-xl overflow-hidden border-2 border-primary">
          <img src={url} alt={label} className="w-full h-full object-cover" />
          <button className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" onClick={onClear}>
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
        <p className="text-sm text-muted-foreground mt-1">Fotos reais que devem aparecer na composição</p>
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
export function Step12Elements({ elements, setElements, suggestions }: StepProps) {
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
        {(suggestions?.elements || []).map(el => (
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
export function Step13Restrictions({ restrictions, setRestrictions }: StepProps) {
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
            onClick={() => setRestrictions((prev: string) => prev ? `${prev}, ${s.toLowerCase()}` : s.toLowerCase())}
          >
            {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}

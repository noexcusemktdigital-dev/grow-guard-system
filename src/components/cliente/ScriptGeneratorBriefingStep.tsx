// @ts-nocheck
import { useState } from "react";
import { Sparkles, ArrowLeft, Loader2, Link, Plus, X, FileText, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCrmProducts } from "@/hooks/useCrmProducts";
import { useCrmFunnels } from "@/hooks/useCrmFunnels";
import { useSalesPlan } from "@/hooks/useSalesPlan";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { briefingQuestions } from "./ScriptGeneratorData";

interface ScriptGeneratorBriefingStepProps {
  stage: string;
  briefing: Record<string, string>;
  setBriefing: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  referenceLinks: string[];
  setReferenceLinks: React.Dispatch<React.SetStateAction<string[]>>;
  additionalContext: string;
  setAdditionalContext: (v: string) => void;
  isGenerating: boolean;
  onBack: () => void;
  onGenerate: (autoContext: Record<string, unknown>, orgId: string | null) => void;
}

export function ScriptGeneratorBriefingStep({
  stage, briefing, setBriefing,
  referenceLinks, setReferenceLinks,
  additionalContext, setAdditionalContext,
  isGenerating, onBack, onGenerate,
}: ScriptGeneratorBriefingStepProps) {
  const [newLink, setNewLink] = useState("");
  const { data: products } = useCrmProducts();
  const { data: funnels } = useCrmFunnels();
  const { data: salesPlan } = useSalesPlan();
  const { data: orgId } = useUserOrgId();

  // Suppress unused variable warning for funnels
  void funnels;

  const salesPlanAnswers = salesPlan?.answers || {};
  const autoContext = {
    products: products?.map(p => ({ name: p.name, price: p.price })) || [],
    segment: salesPlanAnswers.segmento || "",
    channels: Array.isArray(salesPlanAnswers.canais_aquisicao) ? salesPlanAnswers.canais_aquisicao : [],
    teamSize: salesPlanAnswers.tamanho_equipe || "",
    ticketMedio: salesPlanAnswers.ticket_medio || "",
    modeloNegocio: salesPlanAnswers.modelo_negocio || "",
    diferenciais: salesPlanAnswers.diferenciais || "",
    produtosServicos: salesPlanAnswers.produtos_servicos || "",
    dorPrincipal: salesPlanAnswers.dor_principal || "",
    tempoFechamento: salesPlanAnswers.tempo_fechamento || "",
    usaScripts: salesPlanAnswers.usa_scripts || "",
    etapasFunil: Array.isArray(salesPlanAnswers.etapas_funil) ? salesPlanAnswers.etapas_funil : [],
  };

  const hasContext = autoContext.products.length > 0 || autoContext.segment || autoContext.channels.length > 0 || autoContext.diferenciais;

  const addLink = () => {
    const trimmed = newLink.trim();
    if (trimmed && !referenceLinks.includes(trimmed)) {
      setReferenceLinks(prev => [...prev, trimmed]);
      setNewLink("");
    }
  };

  return (
    <div className="space-y-5">
      {hasContext && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <BookOpen className="w-3.5 h-3.5" />
            Contexto automático do Plano de Vendas
          </div>
          {autoContext.segment && (
            <p className="text-xs text-muted-foreground">Segmento: <span className="font-medium text-foreground">{autoContext.segment}</span></p>
          )}
          {autoContext.produtosServicos && (
            <p className="text-xs text-muted-foreground">Produtos: <span className="font-medium text-foreground">{autoContext.produtosServicos.substring(0, 100)}</span></p>
          )}
          {autoContext.diferenciais && (
            <p className="text-xs text-muted-foreground">Diferenciais: <span className="font-medium text-foreground">{autoContext.diferenciais.substring(0, 100)}</span></p>
          )}
          {autoContext.dorPrincipal && (
            <p className="text-xs text-muted-foreground">Dor do cliente: <span className="font-medium text-foreground">{autoContext.dorPrincipal.substring(0, 100)}</span></p>
          )}
          {autoContext.products.length > 0 && (
            <p className="text-xs text-muted-foreground">
              CRM: {autoContext.products.map(p => p.name).join(", ")}
            </p>
          )}
          {autoContext.channels.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Canais: {autoContext.channels.join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {briefingQuestions[stage]?.map(q => (
          <div key={q.key}>
            <Label className="text-xs">{q.label}</Label>
            <Input
              className="mt-1"
              placeholder={q.placeholder}
              value={briefing[q.key] || ""}
              onChange={e => setBriefing(prev => ({ ...prev, [q.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center gap-1.5">
          <Link className="w-3.5 h-3.5 text-primary" />
          <Label className="text-xs font-medium">Links de Referência</Label>
          <span className="text-[10px] text-muted-foreground">(opcional)</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Adicione links de concorrentes, artigos ou materiais que a nossa IA deve considerar ao gerar o script.
        </p>
        <div className="flex gap-2">
          <Input
            className="flex-1"
            placeholder="https://exemplo.com/material-referencia"
            value={newLink}
            onChange={e => setNewLink(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addLink()}
          />
          <Button size="sm" variant="outline" onClick={addLink} disabled={!newLink.trim()} aria-label="Adicionar">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        {referenceLinks.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {referenceLinks.map((link, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] gap-1 max-w-[200px]">
                <Link className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{link.replace(/^https?:\/\//, "").substring(0, 30)}</span>
                <button onClick={() => setReferenceLinks(prev => prev.filter((_, j) => j !== i))}>
                  <X className="w-2.5 h-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <Label className="text-xs font-medium">Contexto Adicional</Label>
          <span className="text-[10px] text-muted-foreground">(opcional)</span>
        </div>
        <Textarea
          rows={3}
          className="text-xs"
          placeholder="Cole aqui trechos de documentos, dados de pesquisa, informações sobre o mercado ou qualquer contexto adicional que a nossa IA deve usar para personalizar o script..."
          value={additionalContext}
          onChange={e => setAdditionalContext(e.target.value)}
        />
      </div>

      {!hasContext && (
        <div className="space-y-3 pt-2 border-t">
          <p className="text-[10px] text-muted-foreground">
            💡 Preencha o Plano de Vendas para contexto automático, ou informe abaixo:
          </p>
          <div>
            <Label className="text-xs">Segmento do negócio</Label>
            <Input
              className="mt-1"
              placeholder="Ex: Tecnologia SaaS, Consultoria, E-commerce"
              value={briefing["Segmento"] || ""}
              onChange={e => setBriefing(prev => ({ ...prev, Segmento: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs">Produto/Serviço principal</Label>
            <Input
              className="mt-1"
              placeholder="Ex: Software de gestão, consultoria financeira"
              value={briefing["Produto"] || ""}
              onChange={e => setBriefing(prev => ({ ...prev, Produto: e.target.value }))}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button onClick={() => onGenerate(autoContext, orgId ?? null)} disabled={isGenerating} className="gap-1">
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Gerando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Gerar Script
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

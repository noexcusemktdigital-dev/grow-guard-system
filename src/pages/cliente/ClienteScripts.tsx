// @ts-nocheck
import { useState } from "react";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import {
  BookOpen, Plus, Copy, Search, ChevronDown, ChevronUp, Sparkles,
  Pencil, Trash2, Crosshair, ShieldQuestion, Handshake, Target, Ban, Loader2, Check, X
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useClienteScripts, useClienteScriptMutations } from "@/hooks/useClienteScripts";
import { toast } from "@/hooks/use-toast";
import { useMemberPermissions } from "@/hooks/useMemberPermissions";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import ScriptGeneratorDialog from "@/components/cliente/ScriptGeneratorDialog";
import { ScriptContentRenderer } from "@/components/cliente/ScriptContentRenderer";
import { StrategyBanner } from "@/components/cliente/StrategyBanner";

import { useUserOrgId } from "@/hooks/useUserOrgId";
import { InsufficientCreditsDialog, isInsufficientCreditsError } from "@/components/cliente/InsufficientCreditsDialog";

const funnelStages = [
  { key: "prospeccao", label: "Prospecção", icon: Crosshair, gradient: "from-blue-500/15 to-blue-600/5", accent: "text-blue-400 border-blue-500/30" },
  { key: "diagnostico", label: "Diagnóstico", icon: ShieldQuestion, gradient: "from-cyan-500/15 to-cyan-600/5", accent: "text-cyan-400 border-cyan-500/30" },
  { key: "negociacao", label: "Negociação", icon: Handshake, gradient: "from-purple-500/15 to-purple-600/5", accent: "text-purple-400 border-purple-500/30" },
  { key: "fechamento", label: "Fechamento", icon: Target, gradient: "from-emerald-500/15 to-emerald-600/5", accent: "text-emerald-400 border-emerald-500/30" },
  { key: "objecoes", label: "Quebra de Objeções", icon: Ban, gradient: "from-amber-500/15 to-amber-600/5", accent: "text-amber-400 border-amber-500/30" },
];

export default function ClienteScripts() {
  const { data: scripts, isLoading, isError, error, refetch } = useClienteScripts();
  const { createScript, updateScript, deleteScript: deleteScriptMutation } = useClienteScriptMutations();
  const { permissions, isAdmin } = useMemberPermissions();
  const canGenerate = isAdmin || permissions.can_generate_scripts;
  
  const { data: orgId } = useUserOrgId();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [improvingId, setImprovingId] = useState<string | null>(null);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const allScripts = scripts ?? [];

  const filtered = (stageKey: string) =>
    allScripts
      .filter(s => s.category === stageKey)
      .filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.content?.toLowerCase().includes(search.toLowerCase()));

  const handleSaveFromDialog = (script: { title: string; content: string; category: string; tags: string[] }) => {
    createScript.mutate(
      { title: script.title, content: script.content, category: script.category, tags: script.tags },
      { onSuccess: () => toast({ title: "Script criado!" }) }
    );
  };

  const handleImproveWithAI = async (scriptId: string, currentContent: string, category: string) => {
    setImprovingId(scriptId);
    try {
      const { data, error } = await invokeEdge("generate-script", {
        body: {
          stage: category || "prospeccao",
          briefing: {},
          context: {
            products: [],
            segment: "",
            channels: [],
            teamSize: "",
          },
          mode: "improve",
          existingScript: currentContent,
          organization_id: orgId,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) {
        if (data.error.includes("INSUFFICIENT_CREDITS") || data.error.includes("Créditos insuficientes")) {
          setShowCreditsDialog(true);
          return;
        }
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return;
      }
      updateScript.mutate(
        { id: scriptId, content: data.content },
        { onSuccess: () => toast({ title: "Script melhorado com IA!" }) }
      );
    } catch (e: unknown) {
      if (isInsufficientCreditsError(e)) {
        setShowCreditsDialog(true);
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        const isFetchError = msg.includes("Failed to send") || msg.includes("FunctionsRelayError") || msg.includes("fetch");
        toast({ title: "Erro ao melhorar script", description: isFetchError ? "Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente." : msg, variant: "destructive" });
      }
    } finally {
      setImprovingId(null);
    }
  };

  if (isLoading && !scripts) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Scripts & Playbooks" subtitle="Scripts de prospecção e negociação" icon={<BookOpen className="w-5 h-5 text-primary" />} />
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Scripts & Playbooks" subtitle="Scripts de prospecção e negociação" icon={<BookOpen className="w-5 h-5 text-primary" />} />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <h3 className="font-semibold text-destructive mb-1">Erro ao carregar scripts</h3>
          <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "Não foi possível carregar os scripts."}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Scripts & Playbooks"
        subtitle="Scripts de prospecção e negociação organizados por etapa do funil"
        icon={<BookOpen className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <FeatureTutorialButton slug="scripts" />
            <Button size="sm" onClick={() => setShowCreate(true)} disabled={!canGenerate} title={!canGenerate ? "Sem permissão para criar scripts" : undefined}>
              <Plus className="w-4 h-4 mr-1" /> Novo Script
            </Button>
          </div>
        }
      />

      <StrategyBanner toolName="seus scripts" dataUsed="ICP, dores, objeções e proposta de valor" />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar scripts..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar scripts" className="pl-10" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {funnelStages.map(stage => {
          const count = allScripts.filter(s => s.category === stage.key).length;
          return (
            <div key={stage.key} className={`flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-br ${stage.gradient}`}>
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${stage.accent} bg-background/50`}>
                <stage.icon className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-medium">{stage.label}</p>
                <p className="text-lg font-bold">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {allScripts.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="Nenhum script cadastrado"
          description="Crie scripts com IA ou escreva manualmente para padronizar suas abordagens comerciais."
          action={canGenerate ? { label: "Novo Script", onClick: () => setShowCreate(true) } : undefined}
        />
      ) : (
        <Tabs defaultValue={funnelStages[0].key}>
          <TabsList className="flex-wrap">
            {funnelStages.map(s => (
              <TabsTrigger key={s.key} value={s.key} className="text-xs gap-1.5">
                <s.icon className="w-3 h-3" /> {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {funnelStages.map(stage => (
            <TabsContent key={stage.key} value={stage.key} className="space-y-3 mt-4">
              {filtered(stage.key).map(s => (
                <Card
                  key={s.id}
                  className={`relative isolate overflow-hidden transition-shadow transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer ${expandedId === s.id ? "ring-1 ring-primary/30 shadow-lg" : ""}`}
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stage.gradient} opacity-50 pointer-events-none`} />
                  <CardContent className="relative z-10 py-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${stage.accent} bg-background/50`}>
                          <stage.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{s.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.tags?.join(", ") || "Sem tags"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(s.content || ""); toast({ title: "Copiado!" }); }}
                         aria-label="Copiar">
                          <Copy className="w-3 h-3" />
                        </Button>
                        {expandedId === s.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {expandedId === s.id && (
                      <div className="animate-fade-in mt-3 space-y-3">
                        {editingId === s.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              className="text-sm font-semibold"
                              placeholder="Título do script"
                            />
                            <Textarea
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              rows={12}
                              className="font-mono text-xs leading-relaxed"
                            />
                          </div>
                        ) : (
                          <div className="p-4 bg-background/80 rounded-lg border max-h-[500px] overflow-y-auto">
                            <ScriptContentRenderer content={s.content || ""} />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-muted-foreground">Atualizado em {new Date(s.updated_at).toLocaleDateString("pt-BR")}</p>
                          <div className="flex gap-1.5">
                            {editingId === s.id ? (
                              <>
                                <Button
                                  size="sm" variant="default"
                                  className="text-[10px] h-6 px-2 gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateScript.mutate(
                                      { id: s.id, title: editTitle, content: editContent },
                                      { onSuccess: () => { toast({ title: "Script atualizado!" }); setEditingId(null); } }
                                    );
                                  }}
                                >
                                  <Check className="w-2.5 h-2.5" /> Salvar
                                </Button>
                                <Button
                                  size="sm" variant="outline"
                                  className="text-[10px] h-6 px-2 gap-1"
                                  onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                                >
                                  <X className="w-2.5 h-2.5" /> Cancelar
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm" variant="outline"
                                  className="text-[10px] h-6 px-2 gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(s.id);
                                    setEditTitle(s.title);
                                    setEditContent(s.content || "");
                                  }}
                                >
                                  <Pencil className="w-2.5 h-2.5" /> Editar
                                </Button>
                                <Button
                                  size="sm" variant="outline"
                                  className="text-[10px] h-6 px-2 gap-1"
                                  disabled={improvingId === s.id}
                                  onClick={(e) => { e.stopPropagation(); handleImproveWithAI(s.id, s.content || "", s.category || "prospeccao"); }}
                                >
                                  {improvingId === s.id ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-2.5 h-2.5" />
                                  )}
                                  Melhorar com IA
                                </Button>
                                <Button
                                  size="sm" variant="outline"
                                  className="text-[10px] h-6 px-2 text-destructive hover:text-destructive"
                                  onClick={(e) => { e.stopPropagation(); deleteScriptMutation.mutate(s.id); toast({ title: "Script excluído!" }); }}
                                >
                                  <Trash2 className="w-2.5 h-2.5 mr-1" /> Excluir
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {expandedId !== s.id && (
                      <p className="text-[10px] text-muted-foreground">Atualizado em {new Date(s.updated_at).toLocaleDateString("pt-BR")}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {filtered(stage.key).length === 0 && (
                <div className="text-center py-12">
                  <stage.icon className={`w-8 h-8 mx-auto mb-3 opacity-30 ${stage.accent}`} />
                  <p className="text-sm text-muted-foreground mb-3">
                    {search ? `Nenhum resultado para "${search}"` : `Nenhum script de ${stage.label}`}
                  </p>
                  {!search && (
                    <Button size="sm" variant="outline" onClick={() => setShowCreate(true)} className="gap-1" disabled={!canGenerate} title={!canGenerate ? "Sem permissão para criar scripts" : undefined}>
                      <Plus className="w-3.5 h-3.5" /> Criar Script de {stage.label}
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      <ScriptGeneratorDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSave={handleSaveFromDialog}
      />

      <InsufficientCreditsDialog
        open={showCreditsDialog}
        onOpenChange={setShowCreditsDialog}
        actionLabel="melhorar este script"
        creditCost={20}
      />
    </div>
  );
}

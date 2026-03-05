import { useState } from "react";
import {
  BookOpen, Plus, Copy, Search, ChevronDown, ChevronUp, Sparkles,
  Pencil, Trash2, Crosshair, ShieldQuestion, Handshake, Target, Ban, Loader2
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useClienteScripts, useClienteScriptMutations } from "@/hooks/useClienteScripts";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ScriptGeneratorDialog from "@/components/cliente/ScriptGeneratorDialog";
import { StrategyBanner } from "@/components/cliente/StrategyBanner";
import { useStrategyData } from "@/hooks/useStrategyData";

const funnelStages = [
  { key: "prospeccao", label: "Prospecção", icon: Crosshair, gradient: "from-blue-500/15 to-blue-600/5", accent: "text-blue-400 border-blue-500/30" },
  { key: "diagnostico", label: "Diagnóstico", icon: ShieldQuestion, gradient: "from-cyan-500/15 to-cyan-600/5", accent: "text-cyan-400 border-cyan-500/30" },
  { key: "negociacao", label: "Negociação", icon: Handshake, gradient: "from-purple-500/15 to-purple-600/5", accent: "text-purple-400 border-purple-500/30" },
  { key: "fechamento", label: "Fechamento", icon: Target, gradient: "from-emerald-500/15 to-emerald-600/5", accent: "text-emerald-400 border-emerald-500/30" },
  { key: "objecoes", label: "Quebra de Objeções", icon: Ban, gradient: "from-amber-500/15 to-amber-600/5", accent: "text-amber-400 border-amber-500/30" },
];

export default function ClienteScripts() {
  const { data: scripts, isLoading } = useClienteScripts();
  const { createScript, updateScript, deleteScript: deleteScriptMutation } = useClienteScriptMutations();
  const { hasStrategy, dores, objecoes, gatilhosCompra, propostaValor } = useStrategyData();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [improvingId, setImprovingId] = useState<string | null>(null);

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
      const { data, error } = await supabase.functions.invoke("generate-script", {
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
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return;
      }
      updateScript.mutate(
        { id: scriptId, content: data.content },
        { onSuccess: () => toast({ title: "Script melhorado com IA!" }) }
      );
    } catch (e: any) {
      toast({ title: "Erro ao melhorar script", description: e.message, variant: "destructive" });
    } finally {
      setImprovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Scripts & Playbooks" subtitle="Scripts de prospecção e negociação" icon={<BookOpen className="w-5 h-5 text-primary" />} />
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
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
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Novo Script
          </Button>
        }
      />

      <StrategyBanner toolName="seus scripts" dataUsed="ICP, dores, objeções e proposta de valor" />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar scripts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium">Nenhum script cadastrado</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Crie scripts com IA ou escreva manualmente para padronizar suas abordagens comerciais.</p>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-1" /> Novo Script
            </Button>
          </CardContent>
        </Card>
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
                  className={`overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer ${expandedId === s.id ? "ring-1 ring-primary/30 shadow-lg" : ""}`}
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stage.gradient} opacity-50`} />
                  <CardContent className="relative py-4 space-y-2">
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
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        {expandedId === s.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {expandedId === s.id && (
                      <div className="animate-fade-in mt-3 space-y-3">
                        <div className="p-4 bg-background/60 backdrop-blur-sm rounded-lg text-sm whitespace-pre-wrap border font-mono text-xs leading-relaxed">
                          {s.content || "Sem conteúdo"}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-muted-foreground">Atualizado em {new Date(s.updated_at).toLocaleDateString("pt-BR")}</p>
                          <div className="flex gap-1.5">
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
                  <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {search ? `Nenhum resultado para "${search}"` : "Nenhum script nesta etapa"}
                  </p>
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
    </div>
  );
}

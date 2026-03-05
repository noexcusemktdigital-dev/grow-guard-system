import { useState } from "react";
import { Sparkles, CheckCircle2, RotateCcw, Clock, ChevronDown, ChevronUp, Target, Users, Lightbulb, Globe, DollarSign, TrendingUp, BarChart3, FileText, Megaphone } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActiveStrategy, useStrategyHistory, useSaveStrategy, useApproveStrategy, useGenerateStrategy } from "@/hooks/useMarketingStrategy";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { toast } from "@/hooks/use-toast";
import { ChatBriefing } from "@/components/cliente/ChatBriefing";
import { AGENTS, SOFIA_STEPS } from "@/components/cliente/briefingAgents";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ══════════════════════════════════════════════
   STRATEGY RESULT DISPLAY COMPONENTS
   ══════════════════════════════════════════════ */

function SectionCard({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <CardContent className="pt-0 pb-4">{children}</CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function TagList({ items, variant = "secondary" }: { items: string[]; variant?: "secondary" | "outline" | "default" }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <Badge key={i} variant={variant} className="text-xs">{item}</Badge>
      ))}
    </div>
  );
}

function StrategyResultView({ result, onApprove, onRegenerate, isApproving, status }: {
  result: any;
  onApprove: () => void;
  onRegenerate: () => void;
  isApproving: boolean;
  status: string;
}) {
  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* Action bar */}
      {status !== "approved" && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div>
              <p className="text-sm font-medium">Estratégia gerada com sucesso! 🎉</p>
              <p className="text-xs text-muted-foreground">Revise o resultado e aprove para consumir os créditos.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Regenerar
              </Button>
              <Button size="sm" onClick={onApprove} disabled={isApproving} className="gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {isApproving ? "Aprovando..." : "Aprovar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "approved" && (
        <Badge variant="default" className="gap-1.5">
          <CheckCircle2 className="w-3 h-3" /> Estratégia aprovada
        </Badge>
      )}

      {/* Resumo executivo */}
      {result.resumo_executivo && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{result.resumo_executivo}</p>
          </CardContent>
        </Card>
      )}

      {/* Diagnóstico */}
      {result.diagnostico && (
        <SectionCard title="Diagnóstico do Negócio" icon={BarChart3}>
          <p className="text-sm text-muted-foreground mb-3">{result.diagnostico.analise}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <p className="text-xs font-semibold mb-1.5 text-green-600">Pontos Fortes</p>
              <TagList items={result.diagnostico.pontos_fortes} variant="outline" />
            </div>
            <div>
              <p className="text-xs font-semibold mb-1.5 text-blue-600">Oportunidades</p>
              <TagList items={result.diagnostico.oportunidades} variant="outline" />
            </div>
            <div>
              <p className="text-xs font-semibold mb-1.5 text-orange-600">Riscos</p>
              <TagList items={result.diagnostico.riscos} variant="outline" />
            </div>
          </div>
        </SectionCard>
      )}

      {/* Posicionamento */}
      {result.posicionamento && (
        <SectionCard title="Posicionamento Estratégico" icon={Target}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><p className="text-xs font-semibold text-muted-foreground mb-1">Proposta de Valor</p><p className="text-sm">{result.posicionamento.proposta_valor}</p></div>
            <div><p className="text-xs font-semibold text-muted-foreground mb-1">Mensagem Central</p><p className="text-sm">{result.posicionamento.mensagem_central}</p></div>
            <div><p className="text-xs font-semibold text-muted-foreground mb-1">Diferenciação</p><p className="text-sm">{result.posicionamento.diferenciacao}</p></div>
            <div><p className="text-xs font-semibold text-muted-foreground mb-1">Tom de Voz</p><p className="text-sm">{result.posicionamento.tom_de_voz}</p></div>
          </div>
        </SectionCard>
      )}

      {/* Persona */}
      {result.persona && (
        <SectionCard title="Perfil do Cliente Ideal" icon={Users}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{result.persona.nome}</p>
                <p className="text-xs text-muted-foreground">{result.persona.idade} • {result.persona.profissao}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{result.persona.descricao}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><p className="text-xs font-semibold mb-1.5">Dores</p><TagList items={result.persona.dores} variant="outline" /></div>
              <div><p className="text-xs font-semibold mb-1.5">Desejos</p><TagList items={result.persona.desejos} variant="outline" /></div>
              <div><p className="text-xs font-semibold mb-1.5">Objeções</p><TagList items={result.persona.objecoes} variant="outline" /></div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Pilares de Conteúdo */}
      {result.pilares_conteudo && (
        <SectionCard title="Pilares de Conteúdo" icon={Lightbulb}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.pilares_conteudo.map((p: any, i: number) => (
              <Card key={i} className="border">
                <CardContent className="p-3">
                  <p className="font-semibold text-sm mb-1">{p.nome}</p>
                  <p className="text-xs text-muted-foreground mb-2">{p.descricao}</p>
                  <TagList items={p.exemplos} variant="secondary" />
                </CardContent>
              </Card>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Funil */}
      {result.funil && (
        <SectionCard title="Estrutura de Funil" icon={TrendingUp}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["topo", "meio", "fundo"] as const).map((etapa) => (
              <div key={etapa} className="space-y-2">
                <Badge variant={etapa === "topo" ? "secondary" : etapa === "meio" ? "outline" : "default"} className="text-xs capitalize">
                  {etapa === "topo" ? "Topo" : etapa === "meio" ? "Meio" : "Fundo"} de Funil
                </Badge>
                <p className="text-xs text-muted-foreground">{result.funil[etapa]?.objetivo}</p>
                <ul className="space-y-1">
                  {result.funil[etapa]?.acoes?.map((a: string, i: number) => (
                    <li key={i} className="text-xs flex gap-1.5"><span className="text-primary">•</span>{a}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Ideias de Conteúdo */}
      {result.ideias_conteudo && (
        <SectionCard title="Ideias de Conteúdo" icon={FileText} defaultOpen={false}>
          <div className="space-y-2">
            {result.ideias_conteudo.map((idea: any, i: number) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <Badge variant="outline" className="text-[10px] shrink-0">{idea.formato}</Badge>
                <span className="text-xs flex-1">{idea.titulo}</span>
                <Badge variant="secondary" className="text-[10px]">{idea.etapa_funil}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Estrutura de Site */}
      {result.estrutura_site && (
        <SectionCard title="Estrutura de Site Recomendada" icon={Globe} defaultOpen={false}>
          <div className="space-y-3">
            {result.estrutura_site.paginas?.map((p: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border">
                <p className="font-semibold text-sm">{p.nome}</p>
                <p className="text-xs text-muted-foreground mb-2">{p.objetivo}</p>
                <TagList items={p.secoes} variant="secondary" />
              </div>
            ))}
            {result.estrutura_site.recomendacoes?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1.5">Recomendações</p>
                <ul className="space-y-1">
                  {result.estrutura_site.recomendacoes.map((r: string, i: number) => (
                    <li key={i} className="text-xs flex gap-1.5"><span className="text-primary">•</span>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Tráfego Pago */}
      {result.trafego_pago && (
        <SectionCard title="Estratégia de Tráfego Pago" icon={DollarSign} defaultOpen={false}>
          <div className="space-y-3">
            <p className="text-xs"><span className="font-semibold">Orçamento sugerido:</span> {result.trafego_pago.orcamento_sugerido}</p>
            {result.trafego_pago.campanhas?.map((c: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">{c.nome}</p>
                  <Badge variant="outline" className="text-[10px]">{c.plataforma}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{c.objetivo}</p>
                <p className="text-xs mt-1"><span className="font-medium">Público:</span> {c.publico}</p>
                <p className="text-xs"><span className="font-medium">Formato:</span> {c.formato}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Indicadores */}
      {result.indicadores && (
        <SectionCard title="Indicadores de Performance" icon={BarChart3} defaultOpen={false}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">CPL Estimado</p>
              <p className="text-lg font-bold text-primary">{result.indicadores.cpl_estimado}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">CAC Estimado</p>
              <p className="text-lg font-bold text-primary">{result.indicadores.cac_estimado}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">ROI Esperado</p>
              <p className="text-lg font-bold text-primary">{result.indicadores.roi_esperado}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Meta de Conversão</p>
              <p className="text-lg font-bold text-primary">{result.indicadores.taxa_conversao_meta}</p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Projeções */}
      {result.projecoes && (
        <SectionCard title="Projeções de Resultados" icon={TrendingUp}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.projecoes.leads && (
              <div>
                <p className="text-xs font-semibold mb-2">Projeção de Leads (6 meses)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={result.projecoes.leads}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="sem_estrategia" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground) / 0.1)" name="Sem estratégia" />
                    <Area type="monotone" dataKey="com_estrategia" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="Com estratégia" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            {result.projecoes.faturamento && (
              <div>
                <p className="text-xs font-semibold mb-2">Projeção de Faturamento (6 meses)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={result.projecoes.faturamento}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="sem_estrategia" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground) / 0.1)" name="Sem estratégia" />
                    <Area type="monotone" dataKey="com_estrategia" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="Com estratégia" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   HISTORY VIEW
   ══════════════════════════════════════════════ */

function StrategyHistoryItem({ strategy }: { strategy: any }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
        <div>
          <p className="text-sm font-medium">
            Estratégia de {format(new Date(strategy.created_at), "dd MMM yyyy", { locale: ptBR })}
          </p>
          <p className="text-xs text-muted-foreground">
            {strategy.status === "approved" ? "✅ Aprovada" : "⏳ Pendente"}
          </p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && strategy.strategy_result && (
        <CardContent className="pt-0">
          <StrategyResultView
            result={strategy.strategy_result}
            onApprove={() => {}}
            onRegenerate={() => {}}
            isApproving={false}
            status={strategy.status || "approved"}
          />
        </CardContent>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */

export default function ClientePlanoMarketing() {
  const [showChat, setShowChat] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: activeStrategy, isLoading } = useActiveStrategy();
  const { data: history } = useStrategyHistory();
  const { data: orgId } = useUserOrgId();
  const { data: wallet } = useClienteWallet();
  const saveStrategy = useSaveStrategy();
  const approveStrategy = useApproveStrategy();
  const generateStrategy = useGenerateStrategy();

  const hasResult = !!activeStrategy?.strategy_result;
  const status = activeStrategy?.status || "pending";

  const handleChatComplete = async (answers: Record<string, any>) => {
    if (!orgId) return;
    setIsGenerating(true);

    try {
      // 1. Generate strategy via AI
      const aiResult = await generateStrategy.mutateAsync({
        answers,
        organization_id: orgId,
      });

      // 2. Save strategy with result (credits NOT consumed yet)
      await saveStrategy.mutateAsync({
        answers,
        score_percentage: 0,
        nivel: "gerado",
        strategy_result: aiResult.result,
        status: "pending",
      });

      toast({ title: "Estratégia gerada!", description: "Revise o resultado e aprove para finalizar." });
    } catch (err: any) {
      toast({ title: "Erro ao gerar estratégia", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setShowChat(false);
    }
  };

  const handleApprove = async () => {
    if (!activeStrategy?.id) return;
    try {
      await approveStrategy.mutateAsync(activeStrategy.id);
      toast({ title: "Estratégia aprovada! ✅", description: "300 créditos foram consumidos." });
    } catch (err: any) {
      toast({ title: "Erro ao aprovar", description: err.message, variant: "destructive" });
    }
  };

  const handleRegenerate = () => {
    setShowChat(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <PageHeader title="Estratégia de Marketing" subtitle="Carregando..." icon={<Megaphone className="w-5 h-5 text-primary" />} />
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-xl bg-muted/50" />)}
        </div>
      </div>
    );
  }

  // Chat mode
  if (showChat || isGenerating) {
    return (
      <div className="p-6 space-y-4">
        <PageHeader title="Estratégia de Marketing" subtitle="Responda as perguntas para gerar sua estratégia" icon={<Megaphone className="w-5 h-5 text-primary" />} />
        {isGenerating ? (
          <Card>
            <CardContent className="p-12 flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-10 h-10 text-primary" />
              </motion.div>
              <div className="text-center">
                <p className="font-semibold">Gerando sua estratégia...</p>
                <p className="text-sm text-muted-foreground">Isso pode levar até 30 segundos</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ChatBriefing
            agent={AGENTS.sofia}
            steps={SOFIA_STEPS}
            onComplete={handleChatComplete}
            onCancel={() => setShowChat(false)}
          />
        )}
      </div>
    );
  }

  // Result view (has active strategy with result)
  if (hasResult) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <PageHeader title="Estratégia de Marketing" subtitle="Sua estratégia personalizada" icon={<Megaphone className="w-5 h-5 text-primary" />} />
          <div className="flex gap-2">
            {(history?.length ?? 0) > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Histórico ({history?.length})
              </Button>
            )}
          </div>
        </div>

        {showHistory && history && history.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Estratégias anteriores</p>
            {history.map((s) => <StrategyHistoryItem key={s.id} strategy={s} />)}
          </div>
        )}

        <StrategyResultView
          result={activeStrategy!.strategy_result}
          onApprove={handleApprove}
          onRegenerate={handleRegenerate}
          isApproving={approveStrategy.isPending}
          status={status}
        />
      </div>
    );
  }

  // Empty state — no strategy yet
  return (
    <div className="p-6 space-y-4">
      <PageHeader title="Estratégia de Marketing" subtitle="Crie sua estratégia personalizada com IA" icon={<Megaphone className="w-5 h-5 text-primary" />} />

      <Card className="border-dashed">
        <CardContent className="p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Crie sua Estratégia de Marketing</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1">
              Responda 10 perguntas simples e a IA vai gerar uma estratégia completa com diagnóstico,
              posicionamento, persona, pilares de conteúdo, funil, ideias de conteúdo, estrutura de site,
              tráfego pago e projeções de resultado.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~5 minutos</span>
            <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> 300 créditos</span>
            <span className="flex items-center gap-1">Saldo: {wallet?.balance ?? 0}</span>
          </div>
          <Button size="lg" onClick={() => setShowChat(true)} className="gap-2 mt-2">
            <Sparkles className="w-4 h-4" /> Iniciar Diagnóstico
          </Button>

          {(history?.length ?? 0) > 0 && (
            <div className="w-full mt-6 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Estratégias anteriores</p>
              {history!.map((s) => <StrategyHistoryItem key={s.id} strategy={s} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

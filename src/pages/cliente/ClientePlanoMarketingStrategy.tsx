// @ts-nocheck
import { useState } from "react";
import type { ClientePlanoVendasMetasProps } from "./ClientePlanoVendasMetas";
import { ClientePlanoVendasMetas as ClientePlanoVendasMetasLazy } from "./ClientePlanoVendasMetas";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, CheckCircle2, RotateCcw, Clock, Target, Users, Lightbulb,
  Globe, DollarSign, TrendingUp, BarChart3, ArrowRight,
  FileText, Palette, Monitor, Zap, PenTool,
  Trophy, Shield, Flame,
  Calendar, Briefcase, CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { ScoreRing } from "./ClientePlanoMarketingHelpers";
import { InfoTip } from "./ClientePlanoMarketingHelpers";
import {
  MktResumo, MktClienteIdeal, MktConcorrencia, MktTomVoz,
  MktAquisicao, MktConteudo, MktProjecao, MktExecucao,
} from "./ClientePlanoMarketingMktSections";
import {
  ComScoreRadar, ComFunilReverso, ComInsights,
  ComEstrategias, ComProjecoes, ComPlanoAcao,
} from "./ClientePlanoMarketingComSections";
import type {
  StrategyResult, HistoryStrategy,
} from "./ClientePlanoMarketingTypes";
import { useStrategyHistory } from "@/hooks/useMarketingStrategy";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { normalizeMarketingStrategyResult } from "@/lib/normalizeMarketingStrategyResult";

/* ═══════════════ STRATEGY DASHBOARD ═══════════════ */

export interface StrategyDashboardProps {
  result: StrategyResult;
  onApprove?: () => void;
  onRegenerate: () => void;
  isApproving: boolean;
  status: string;
  createdAt?: string;
  metasProps?: ClientePlanoVendasMetasProps;
  metasDialog?: React.ReactNode;
}

export function StrategyDashboard({ result, onApprove, onRegenerate, isApproving, status, createdAt, metasProps, metasDialog }: StrategyDashboardProps) {
  const navigate = useNavigate();
  const { isAdmin } = useRoleAccess();
  const { data: history } = useStrategyHistory();
  const isFirstGPS = !history || history.length === 0;
  if (!result) return null;

  const result_ = normalizeMarketingStrategyResult(result);

  const daysSinceCreation = createdAt ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const isStale = daysSinceCreation >= 30;
  const hasComercial = !!result_.diagnostico_comercial;

  return (
    <div className="space-y-4">
      {/* Header card with scores */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-transparent overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex gap-2">
                <ScoreRing score={result_.diagnostico?.score_geral ?? 0} label="Marketing" size={70} />
                {hasComercial && <ScoreRing score={(result_.diagnostico_comercial as { score_comercial?: number } | null)?.score_comercial ?? 0} label="Comercial" size={70} />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={status === "approved" ? "default" : "secondary"} className="gap-1"><CheckCircle2 className="w-3 h-3" /> {status === "approved" ? "Aprovada" : "Pendente"}</Badge>
                  {createdAt && <Badge variant="outline" className="text-[10px] gap-1"><Clock className="w-3 h-3" /> {format(new Date(createdAt), "dd MMM yyyy", { locale: ptBR })} ({daysSinceCreation} dias)</Badge>}
                </div>
                {isStale && <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">Sua estratégia tem {daysSinceCreation} dias. Considere atualizar!</p>}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Nova Estratégia</Button></AlertDialogTrigger>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Criar nova estratégia?</AlertDialogTitle><AlertDialogDescription>Sua estratégia atual será movida para o histórico.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onRegenerate}>Sim, criar nova</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
              </AlertDialog>
              )}
              {status !== "approved" && onApprove && (
                <Button size="sm" onClick={onApprove} disabled={isApproving} className="gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isApproving ? "Aprovando..." : isFirstGPS ? "Aprovar Grátis 🎉" : "Aprovar (50 créditos)"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions when approved */}
      {status === "approved" && (
        <Card className="border-primary/10"><CardContent className="p-4">
          <p className="text-xs font-semibold text-primary mb-3 flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5" /> Próximos Passos</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { key: "conteudos", label: "Gerar Conteúdos", desc: "Textos estratégicos com IA", icon: FileText, path: "/cliente/conteudos" },
              { key: "postagens", label: "Criar Postagens", desc: "Artes para redes sociais", icon: Palette, path: "/cliente/postagem" },
              { key: "sites", label: "Criar Site", desc: "Landing pages otimizadas", icon: Monitor, path: "/cliente/sites" },
              { key: "trafego", label: "Tráfego Pago", desc: "Estratégia de anúncios", icon: Sparkles, path: "/cliente/trafego-pago" },
              { key: "scripts", label: "Gerar Scripts", desc: "Roteiros de venda", icon: PenTool, path: "/cliente/scripts" },
            ].map((tool) => (
              <button key={tool.key} onClick={() => navigate(tool.path)} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 text-left transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><tool.icon className="w-4 h-4 text-primary" /></div>
                <div className="min-w-0"><p className="text-xs font-medium truncate">{tool.label}</p><p className="text-[10px] text-muted-foreground">{tool.desc}</p></div>
              </button>
            ))}
          </div>
        </CardContent></Card>
      )}

      {/* ═══ TWO-LEVEL TABS: Marketing / Comercial ═══ */}
      <Tabs defaultValue="marketing" className="w-full">
        <TabsList className="w-full flex h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="marketing" className="flex-1 gap-2 text-sm py-2.5">
            <BarChart3 className="w-4 h-4" /> Marketing
          </TabsTrigger>
          {hasComercial && (
            <TabsTrigger value="comercial" className="flex-1 gap-2 text-sm py-2.5">
              <Briefcase className="w-4 h-4" /> Comercial
            </TabsTrigger>
          )}
          {metasProps && (
            <TabsTrigger value="metas" className="flex-1 gap-2 text-sm py-2.5">
              <Target className="w-4 h-4" /> Metas
            </TabsTrigger>
          )}
        </TabsList>

        {/* ═══ MARKETING SUB-TABS ═══ */}
        <TabsContent value="marketing" className="mt-4">
          <Tabs defaultValue="mkt-resumo" className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/30 p-1">
              <TabsTrigger value="mkt-resumo" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" /> Resumo</TabsTrigger>
              <TabsTrigger value="mkt-icp" className="text-xs gap-1"><Users className="w-3.5 h-3.5" /> Cliente Ideal</TabsTrigger>
              <TabsTrigger value="mkt-concorrencia" className="text-xs gap-1"><Shield className="w-3.5 h-3.5" /> Concorrência</TabsTrigger>
              <TabsTrigger value="mkt-tom" className="text-xs gap-1"><Flame className="w-3.5 h-3.5" /> Tom de Voz</TabsTrigger>
              <TabsTrigger value="mkt-aquisicao" className="text-xs gap-1"><TrendingUp className="w-3.5 h-3.5" /> Aquisição</TabsTrigger>
              <TabsTrigger value="mkt-conteudo" className="text-xs gap-1"><Lightbulb className="w-3.5 h-3.5" /> Conteúdo</TabsTrigger>
              <TabsTrigger value="mkt-projecao" className="text-xs gap-1"><DollarSign className="w-3.5 h-3.5" /> Projeção</TabsTrigger>
              <TabsTrigger value="mkt-execucao" className="text-xs gap-1"><Target className="w-3.5 h-3.5" /> Execução</TabsTrigger>
            </TabsList>
            <TabsContent value="mkt-resumo"><MktResumo result={result_} /></TabsContent>
            <TabsContent value="mkt-icp"><MktClienteIdeal result={result_} /></TabsContent>
            <TabsContent value="mkt-concorrencia"><MktConcorrencia result={result_} /></TabsContent>
            <TabsContent value="mkt-tom"><MktTomVoz result={result_} /></TabsContent>
            <TabsContent value="mkt-aquisicao"><MktAquisicao result={result_} /></TabsContent>
            <TabsContent value="mkt-conteudo"><MktConteudo result={result_} /></TabsContent>
            <TabsContent value="mkt-projecao"><MktProjecao result={result_} /></TabsContent>
            <TabsContent value="mkt-execucao"><MktExecucao result={result_} /></TabsContent>
          </Tabs>
        </TabsContent>

        {/* ═══ COMERCIAL SUB-TABS ═══ */}
        {hasComercial && (
          <TabsContent value="comercial" className="mt-4">
            <Tabs defaultValue="com-score" className="w-full">
              <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/30 p-1">
                <TabsTrigger value="com-score" className="text-xs gap-1"><Trophy className="w-3.5 h-3.5" /> Score & Radar</TabsTrigger>
                <TabsTrigger value="com-funil" className="text-xs gap-1"><TrendingUp className="w-3.5 h-3.5" /> Funil Reverso</TabsTrigger>
                <TabsTrigger value="com-insights" className="text-xs gap-1"><Lightbulb className="w-3.5 h-3.5" /> Insights</TabsTrigger>
                <TabsTrigger value="com-estrategias" className="text-xs gap-1"><Target className="w-3.5 h-3.5" /> Estratégias</TabsTrigger>
                <TabsTrigger value="com-projecoes" className="text-xs gap-1"><DollarSign className="w-3.5 h-3.5" /> Projeções</TabsTrigger>
                <TabsTrigger value="com-plano" className="text-xs gap-1"><Calendar className="w-3.5 h-3.5" /> Plano de Ação</TabsTrigger>
              </TabsList>
              <TabsContent value="com-score"><ComScoreRadar dc={result_.diagnostico_comercial} /></TabsContent>
              <TabsContent value="com-funil"><ComFunilReverso dc={result_.diagnostico_comercial} /></TabsContent>
              <TabsContent value="com-insights"><ComInsights dc={result_.diagnostico_comercial} /></TabsContent>
              <TabsContent value="com-estrategias"><ComEstrategias dc={result_.diagnostico_comercial} /></TabsContent>
              <TabsContent value="com-projecoes"><ComProjecoes dc={result_.diagnostico_comercial} /></TabsContent>
              <TabsContent value="com-plano"><ComPlanoAcao dc={result_.diagnostico_comercial} /></TabsContent>
            </Tabs>
          </TabsContent>
        )}

        {/* ═══ METAS TAB ═══ */}
        {metasProps && (
          <TabsContent value="metas" className="mt-4 space-y-6">
            <ClientePlanoVendasMetasLazy {...metasProps} />
            {metasDialog}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

/* ═══════════════ HISTORY ITEM ═══════════════ */

export function StrategyHistoryItem({ strategy }: { strategy: HistoryStrategy }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
        <div>
          <p className="text-sm font-medium">Estratégia de {format(new Date(strategy.created_at), "dd MMM yyyy", { locale: ptBR })}</p>
          <p className="text-xs text-muted-foreground">{strategy.status === "approved" ? "Aprovada" : "Pendente"}</p>
        </div>
      </button>
      {expanded && strategy.strategy_result && (
        <CardContent className="pt-0">
          <StrategyDashboard result={strategy.strategy_result} onApprove={() => {}} onRegenerate={() => {}} isApproving={false} status={strategy.status || "approved"} />
        </CardContent>
      )}
    </Card>
  );
}

// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Megaphone, FileText, Share2, Globe, DollarSign,
  ChevronLeft, ChevronRight, ArrowRight, CheckCircle2,
  Clock, Sparkles, TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useActiveStrategy, useStrategyHistory } from "@/hooks/useMarketingStrategy";
import { useContentHistory } from "@/hooks/useClienteContentV2";
import { usePostHistory } from "@/hooks/useClientePosts";
import { useClienteSitesDB } from "@/hooks/useClienteSitesDB";
import { useActiveTrafficStrategy, useTrafficStrategyHistory } from "@/hooks/useTrafficStrategy";

function inMonth(dateStr: string | null | undefined, start: Date, end: Date) {
  if (!dateStr) return false;
  try {
    return isWithinInterval(parseISO(dateStr), { start, end });
  } catch { return false; }
}

const TOOLS = [
  { key: "strategy", label: "Estratégia", icon: Megaphone, path: "/cliente/plano-marketing", color: "text-orange-500 bg-orange-500/10" },
  { key: "content", label: "Conteúdos", icon: FileText, path: "/cliente/conteudos", color: "text-blue-500 bg-blue-500/10" },
  { key: "posts", label: "Postagens", icon: Share2, path: "/cliente/redes-sociais", color: "text-pink-500 bg-pink-500/10" },
  { key: "sites", label: "Sites", icon: Globe, path: "/cliente/sites", color: "text-emerald-500 bg-emerald-500/10" },
  { key: "traffic", label: "Tráfego Pago", icon: DollarSign, path: "/cliente/trafego-pago", color: "text-purple-500 bg-purple-500/10" },
] as const;

export default function ClienteMarketingHub() {
  const navigate = useNavigate();
  const [monthOffset, setMonthOffset] = useState(0);

  const baseDate = monthOffset === 0 ? new Date() : addMonths(new Date(), monthOffset);
  const monthStart = startOfMonth(baseDate);
  const monthEnd = endOfMonth(baseDate);
  const monthLabel = format(baseDate, "MMMM yyyy", { locale: ptBR });

  // Data hooks
  const { data: activeStrategy } = useActiveStrategy();
  const { data: strategyHistory } = useStrategyHistory();
  const { data: contents } = useContentHistory();
  const { data: posts } = usePostHistory();
  const { data: sites } = useClienteSitesDB();
  const { data: activeTraffic } = useActiveTrafficStrategy();
  const { data: trafficHistory } = useTrafficStrategyHistory();

  // Filter by month
  const allStrategies = [...(activeStrategy ? [activeStrategy] : []), ...(strategyHistory || [])];
  const monthStrategies = allStrategies.filter(s => inMonth(s.created_at, monthStart, monthEnd));
  const monthContents = (contents || []).filter(c => inMonth(c.created_at, monthStart, monthEnd));
  const monthPosts = (posts || []).filter(p => inMonth(p.created_at, monthStart, monthEnd));
  const monthSites = (sites || []).filter(s => inMonth(s.created_at, monthStart, monthEnd));
  const allTraffic = [...(activeTraffic ? [activeTraffic] : []), ...(trafficHistory || [])];
  const monthTraffic = allTraffic.filter(t => inMonth(t.created_at, monthStart, monthEnd));

  const counts: Record<string, { total: number; approved: number }> = {
    strategy: { total: monthStrategies.length, approved: monthStrategies.filter(s => s.status === "approved").length },
    content: { total: monthContents.length, approved: monthContents.filter(c => c.status === "approved").length },
    posts: { total: monthPosts.length, approved: monthPosts.filter(p => p.status === "approved").length },
    sites: { total: monthSites.length, approved: monthSites.filter(s => s.status === "Aprovado").length },
    traffic: { total: monthTraffic.length, approved: monthTraffic.filter(t => t.status === "approved").length },
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Hub de Marketing"
        subtitle="Visão mensal unificada de todas as ferramentas"
        icon={<TrendingUp className="w-5 h-5 text-primary" />}
      />

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setMonthOffset(p => p - 1)} aria-label="Voltar">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold capitalize min-w-[140px] text-center">{monthLabel}</span>
        <Button variant="ghost" size="icon" onClick={() => setMonthOffset(p => p + 1)} disabled={monthOffset >= 0} aria-label="Avançar">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {TOOLS.map(tool => {
          const c = counts[tool.key];
          return (
            <Card
              key={tool.key}
              className="cursor-pointer hover:shadow-md transition-all group"
              onClick={() => navigate(tool.path)}
            >
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tool.color}`}>
                    <tool.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">{tool.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{c.total}</span>
                  {c.approved > 0 && (
                    <Badge variant="secondary" className="text-[9px] gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> {c.approved}
                    </Badge>
                  )}
                  {c.total > 0 && c.approved === 0 && (
                    <Badge variant="outline" className="text-[9px] gap-0.5 text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" /> pendente
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                  Abrir <ArrowRight className="w-3 h-3 ml-0.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chain diagram */}
      <Card>
        <CardContent className="py-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Cadeia de Produção do Mês
          </h3>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {TOOLS.map((tool, i) => {
              const c = counts[tool.key];
              const hasData = c.total > 0;
              return (
                <div key={tool.key} className="flex items-center">
                  <div
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 min-w-[90px] cursor-pointer transition-all ${
                      hasData
                        ? "border-primary/30 bg-primary/5"
                        : "border-dashed border-muted-foreground/20 bg-muted/30"
                    }`}
                    onClick={() => navigate(tool.path)}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasData ? tool.color : "bg-muted text-muted-foreground"}`}>
                      <tool.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-center">{tool.label}</span>
                    <span className={`text-lg font-bold ${hasData ? "text-foreground" : "text-muted-foreground"}`}>
                      {c.total}
                    </span>
                  </div>
                  {i < TOOLS.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 mx-1 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick summary */}
      {monthStrategies.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="text-xs font-bold mb-2 text-muted-foreground uppercase tracking-wider">Resumo da Estratégia Ativa</h3>
            {(() => {
              const s = monthStrategies[0];
              const a = (s.answers || {}) as Record<string, any>;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {a.publico && <div><span className="text-muted-foreground">Público:</span> <span className="font-medium">{a.publico}</span></div>}
                  {a.objetivo && <div><span className="text-muted-foreground">Objetivo:</span> <span className="font-medium">{a.objetivo}</span></div>}
                  {a.diferencial && <div><span className="text-muted-foreground">Diferencial:</span> <span className="font-medium">{a.diferencial}</span></div>}
                  {a.empresa && <div><span className="text-muted-foreground">Empresa:</span> <span className="font-medium">{a.empresa}</span></div>}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

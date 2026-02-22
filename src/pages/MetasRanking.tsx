import { useState } from "react";
import { Trophy, BarChart3, Target, Zap, Settings, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoals, useRankings } from "@/hooks/useGoals";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10", desc: "Visão geral estratégica" },
  { id: "metas", label: "Metas", icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "Metas configuradas" },
  { id: "ranking", label: "Ranking", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10", desc: "Ranking gamificado" },
  { id: "campanhas", label: "Campanhas", icon: Zap, color: "text-purple-500", bg: "bg-purple-500/10", desc: "Premiações ativas" },
  { id: "config", label: "Configuração", icon: Settings, color: "text-rose-500", bg: "bg-rose-500/10", desc: "Pesos e regras" },
];

export default function MetasRanking() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: goals, isLoading: loadingGoals } = useGoals();
  const now = new Date();
  const { data: rankings, isLoading: loadingRankings } = useRankings(now.getMonth() + 1, now.getFullYear());

  const isLoading = loadingGoals || loadingRankings;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/20">
            <Trophy className="w-7 h-7 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-header-title">Metas & Ranking</h1>
              <Badge variant="secondary" className="text-[10px]">Franqueadora</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Performance, gamificação e metas da rede</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">
            {activeTab === "dashboard" && "Nenhuma meta configurada"}
            {activeTab === "metas" && "Nenhuma meta encontrada"}
            {activeTab === "ranking" && "Nenhum ranking disponível"}
            {activeTab === "campanhas" && "Nenhuma campanha ativa"}
            {activeTab === "config" && "Configure pesos e regras das metas"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {(goals ?? []).length === 0 ? "Crie suas primeiras metas para começar." : `${goals!.length} meta(s) encontrada(s).`}
          </p>
        </div>
      )}
    </div>
  );
}

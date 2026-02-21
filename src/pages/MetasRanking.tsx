import { useState } from "react";
import { Trophy, BarChart3, Target, Zap, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getNetworkTotals, formatBRL } from "@/data/metasRankingData";
import MetasDashboard from "@/components/metas/MetasDashboard";
import MetasGoals from "@/components/metas/MetasGoals";
import MetasRankingView from "@/components/metas/MetasRankingView";
import MetasCampaigns from "@/components/metas/MetasCampaigns";
import MetasConfig from "@/components/metas/MetasConfig";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10", desc: "Visão geral estratégica" },
  { id: "metas", label: "Metas", icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "Metas configuradas" },
  { id: "ranking", label: "Ranking", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10", desc: "Ranking gamificado" },
  { id: "campanhas", label: "Campanhas", icon: Zap, color: "text-purple-500", bg: "bg-purple-500/10", desc: "Premiações ativas" },
  { id: "config", label: "Configuração", icon: Settings, color: "text-rose-500", bg: "bg-rose-500/10", desc: "Pesos e regras" },
];

export default function MetasRanking() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const totals = getNetworkTotals("2026-02");

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
              <h1 className="text-2xl font-bold">Metas & Ranking</h1>
              <Badge variant="secondary" className="text-[10px]">Franqueadora</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Performance, gamificação e metas da rede</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Faturamento</p>
            <p className="font-bold text-sm">{formatBRL(totals.totalRevenue)}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Meta</p>
            <p className="font-bold text-sm">{totals.goalPercent.toFixed(0)}%</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Contratos</p>
            <p className="font-bold text-sm">{totals.totalContracts}</p>
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

      {/* Tab Content */}
      {activeTab === "dashboard" && <MetasDashboard />}
      {activeTab === "metas" && <MetasGoals />}
      {activeTab === "ranking" && <MetasRankingView />}
      {activeTab === "campanhas" && <MetasCampaigns />}
      {activeTab === "config" && <MetasConfig />}
    </div>
  );
}

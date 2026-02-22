import { DollarSign, Trophy, TrendingUp, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/types/metas";

interface ComercialData {
  faturamentoRede: number;
  topUnidades: { franchiseName: string; revenue: number; points: number }[];
  leadsNovos: number;
  chamadosAbertos: number;
}

interface Props {
  dados: ComercialData;
}

export function HomeComercial({ dados }: Props) {
  const stats = [
    { label: "Faturamento Rede", value: formatBRL(dados.faturamentoRede), icon: DollarSign, color: "text-emerald-500" },
    { label: "Leads CRM Expansão", value: String(dados.leadsNovos), icon: TrendingUp, color: "text-blue-500" },
    { label: "Chamados Abertos", value: String(dados.chamadosAbertos), icon: MessageSquare, color: "text-amber-500" },
  ];

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Visão Comercial
      </h3>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="text-center">
              <Icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-medium text-muted-foreground">Top 3 Unidades</span>
        </div>
        <div className="space-y-1.5">
          {dados.topUnidades.map((u, i) => (
            <div key={u.franchiseName} className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}º</span>
              <span className="text-sm flex-1 truncate">{u.franchiseName}</span>
              <Badge variant="outline" className="text-[10px]">{u.points} pts</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

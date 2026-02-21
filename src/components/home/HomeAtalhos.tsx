import { useNavigate } from "react-router-dom";
import {
  Zap, GraduationCap, Trophy, MessageSquare,
  Calendar, FileText, DollarSign, Building2,
} from "lucide-react";

const atalhos = [
  { label: "Marketing", icon: Zap, path: "/franqueadora/marketing" },
  { label: "Treinamentos", icon: GraduationCap, path: "/franqueadora/treinamentos" },
  { label: "Metas & Ranking", icon: Trophy, path: "/franqueadora/metas" },
  { label: "Atendimento", icon: MessageSquare, path: "/franqueadora/atendimento" },
  { label: "Agenda", icon: Calendar, path: "/franqueadora/agenda" },
  { label: "Contratos", icon: FileText, path: "/franqueadora/contratos" },
  { label: "Financeiro", icon: DollarSign, path: "/franqueadora/financeiro" },
  { label: "Unidades", icon: Building2, path: "/franqueadora/unidades" },
];

export function HomeAtalhos() {
  const navigate = useNavigate();

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Atalhos Rápidos
      </h3>
      <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
        {atalhos.map(a => {
          const Icon = a.icon;
          return (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 hover:scale-105 transition-all cursor-pointer"
            >
              <Icon className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-foreground">{a.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

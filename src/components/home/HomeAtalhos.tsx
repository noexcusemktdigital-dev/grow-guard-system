import { useNavigate } from "react-router-dom";
import {
  Zap, GraduationCap, Trophy, MessageSquare,
  Calendar, FileText, DollarSign, Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const franqueadoraAtalhos = [
  { label: "CRM", icon: Zap, path: "/franqueadora/crm" },
  { label: "NOE Academy", icon: GraduationCap, path: "/franqueadora/treinamentos" },
  { label: "Metas & Ranking", icon: Trophy, path: "/franqueadora/metas" },
  { label: "Atendimento", icon: MessageSquare, path: "/franqueadora/atendimento" },
  { label: "Agenda", icon: Calendar, path: "/franqueadora/agenda" },
  { label: "Contratos", icon: FileText, path: "/franqueadora/contratos" },
  { label: "Financeiro", icon: DollarSign, path: "/franqueadora/financeiro" },
  { label: "Unidades", icon: Building2, path: "/franqueadora/unidades" },
];

const franqueadoAtalhos = [
  { label: "CRM Vendas", icon: Zap, path: "/franqueado/crm" },
  { label: "Treinamentos", icon: GraduationCap, path: "/franqueado/academy" },
  { label: "Materiais", icon: FileText, path: "/franqueado/materiais" },
  { label: "Suporte", icon: MessageSquare, path: "/franqueado/suporte" },
  { label: "Agenda", icon: Calendar, path: "/franqueado/agenda" },
  { label: "Contratos", icon: FileText, path: "/franqueado/contratos" },
  { label: "Financeiro", icon: DollarSign, path: "/franqueado/financeiro" },
  { label: "Comunicados", icon: Building2, path: "/franqueado/comunicados" },
];

export function HomeAtalhos() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const atalhos = role === "franqueado" ? franqueadoAtalhos : franqueadoraAtalhos;

  return (
    <div className="glass-card p-6">
      <h3 className="section-label mb-4">
        Atalhos Rápidos
      </h3>
      <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
        {atalhos.map(a => {
          const Icon = a.icon;
          return (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 hover:scale-105 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="p-2.5 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[11px] font-semibold text-foreground">{a.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

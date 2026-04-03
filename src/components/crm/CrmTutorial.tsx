import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Layers, UserPlus, Zap, Shuffle, BarChart3,
  ChevronRight, ChevronLeft, X, Sparkles, Lightbulb,
} from "lucide-react";
import { useSalesPlan } from "@/hooks/useSalesPlan";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  tips: string[];
}

function getRecommendations(answers: Record<string, any> | null): Record<number, string[]> {
  if (!answers) return {};
  const recs: Record<number, string[]> = {};

  // Step 0: Funnel tips based on segment
  const segment = answers.segmento || "";
  recs[0] = [];
  if (segment === "servicos") recs[0].push("Para serviços, recomendamos etapas: Diagnóstico → Proposta → Negociação → Fechamento");
  else if (segment === "varejo") recs[0].push("No varejo, foque em velocidade: Contato → Demonstração → Venda");
  else if (segment === "saude") recs[0].push("Na saúde, adicione etapas de avaliação e retorno do paciente");
  else recs[0].push("Personalize as etapas do funil de acordo com seu ciclo de vendas");

  // Step 1: Lead tips based on ticket
  const ticket = answers.ticket_medio || "";
  recs[1] = [];
  if (ticket === "ate_500" || ticket === "500_2000") {
    recs[1].push("Com ticket mais baixo, volume é essencial — use importação CSV para acelerar");
  } else {
    recs[1].push("Com ticket alto, qualidade > quantidade — preencha todos os dados do lead");
  }

  // Step 2: Automation tips
  recs[2] = [];
  const ciclo = answers.ciclo_venda || "";
  if (ciclo === "mesmo_dia" || ciclo === "1_semana") {
    recs[2].push("Ciclo curto: configure follow-up automático em 24h para não perder timing");
  } else {
    recs[2].push("Ciclo longo: configure alertas de lead parado para manter o engajamento");
  }

  // Step 3: Roulette tips
  const equipe = answers.equipe_vendas || "";
  recs[3] = [];
  if (equipe === "sozinho") {
    recs[3].push("Quando crescer o time, a Roleta distribui leads automaticamente");
  } else {
    recs[3].push("Ative a Roleta para distribuir leads igualmente entre a equipe");
  }

  // Step 4: Metrics
  recs[4] = [];
  const diferenciais = answers.diferenciais || "";
  if (diferenciais) {
    recs[4].push(`Use tags para marcar leads que valorizam: "${diferenciais.slice(0, 50)}..."`);
  }

  return recs;
}

const BASE_STEPS: Step[] = [
  {
    icon: <Layers className="w-6 h-6" />,
    title: "Entenda seu Funil",
    description: "O funil organiza seus leads em etapas visuais. Arraste cards entre colunas para avançar negociações. Cada coluna mostra o valor total acumulado.",
    tips: ["Você pode criar múltiplos funis para diferentes produtos", "Personalize as etapas em Configurações"],
  },
  {
    icon: <UserPlus className="w-6 h-6" />,
    title: "Crie seu Primeiro Lead",
    description: "Leads são suas oportunidades de venda. Adicione manualmente, importe planilhas ou receba automaticamente via WhatsApp e formulários.",
    tips: ["Use tags para organizar (ex: 'quente', 'indicação')", "O telefone permite contato direto pelo WhatsApp"],
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Configure Automações",
    description: "Automações trabalham por você: criam tarefas, enviam mensagens e notificam quando algo precisa de atenção.",
    tips: ["Comece com 'Follow-up automático para leads novos'", "Automações com a nossa IA qualificam leads automaticamente"],
  },
  {
    icon: <Shuffle className="w-6 h-6" />,
    title: "Use a Roleta de Leads",
    description: "A Roleta distribui novos leads automaticamente entre membros da equipe, garantindo igualdade e velocidade no primeiro contato.",
    tips: ["Ative em Configurações > Roleta", "Funciona com Round-Robin: cada membro recebe na vez"],
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Acompanhe Métricas",
    description: "O resumo do pipeline mostra valor total, taxa de conversão e leads por etapa. Use filtros para análises específicas.",
    tips: ["Acompanhe a temperatura dos leads (Frio/Morno/Quente)", "Exporte dados para análise externa quando necessário"],
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CrmTutorial({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(0);
  const { data: salesPlan } = useSalesPlan();
  const recommendations = getRecommendations(salesPlan?.answers || null);
  const totalSteps = BASE_STEPS.length;
  const current = BASE_STEPS[step];
  const stepRecs = recommendations[step] || [];

  const handleClose = () => {
    localStorage.setItem("crm_tutorial_seen", "true");
    onOpenChange(false);
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Tutorial CRM</DialogTitle>
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary/90 to-primary px-6 pt-6 pb-8 text-primary-foreground relative">
          <button onClick={handleClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-primary-foreground/10 transition">
            <X className="w-4 h-4" />
          </button>
          <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-[10px] mb-3">
            {step + 1} de {totalSteps}
          </Badge>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
              {current.icon}
            </div>
            <h2 className="text-lg font-bold leading-tight">{current.title}</h2>
          </div>
          <Progress value={((step + 1) / totalSteps) * 100} className="h-1 bg-primary-foreground/20" />
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>

          {/* Default tips */}
          <div className="space-y-2">
            {current.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                <span>{tip}</span>
              </div>
            ))}
          </div>

          {/* Personalized recommendations */}
          {stepRecs.length > 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Recomendação personalizada
              </p>
              {stepRecs.map((rec, i) => (
                <p key={i} className="text-xs text-foreground leading-relaxed">{rec}</p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="gap-1 text-xs">
            <ChevronLeft className="w-3.5 h-3.5" /> Anterior
          </Button>
          {step < totalSteps - 1 ? (
            <Button size="sm" onClick={() => setStep(step + 1)} className="gap-1 text-xs">
              Próximo <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleClose} className="gap-1 text-xs">
              Começar a usar <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

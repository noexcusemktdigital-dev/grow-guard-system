import { MessageCircle, Sparkles, BarChart3, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const WHATSAPP_NUMBER = "5544991129613";

interface AssessoriaTeamBannerProps {
  servico?: string;
}

export function AssessoriaTeamBanner({ servico }: AssessoriaTeamBannerProps) {
  const servicoLabel = servico ?? "essa assessoria";
  const message = encodeURIComponent(
    `Olá! Tenho interesse em conhecer a assessoria de ${servicoLabel} — gostaria de mais informações.`
  );
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

  return (
    <div className="space-y-5">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold leading-tight">
            Quer um time de especialistas cuidando do seu {servicoLabel}?
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Nossa equipe pode executar essa frente para você — estratégia, execução e
            acompanhamento contínuo, com resultados mensuráveis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl border bg-card text-center space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mx-auto">
            <BarChart3 className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-[11px] font-semibold leading-tight">Análise</p>
        </div>
        <div className="p-3 rounded-xl border bg-card text-center space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto">
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-[11px] font-semibold leading-tight">Estratégia</p>
        </div>
        <div className="p-3 rounded-xl border bg-card text-center space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-[11px] font-semibold leading-tight">Resultados</p>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => window.open(waUrl, "_blank")}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Falar com nosso time
        </Button>
      </div>
    </div>
  );
}

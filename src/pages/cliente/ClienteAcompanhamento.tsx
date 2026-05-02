// @ts-nocheck
import { useClientFoldersForUnit } from "@/hooks/useClientFollowups";
import FranqueadoAcompanhamento from "@/pages/franqueado/FranqueadoAcompanhamento";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Sparkles, BarChart3, Target, TrendingUp } from "lucide-react";
import { AssessoriaPopup } from "@/components/shared/AssessoriaPopup";

const WHATSAPP_NUMBER = "5544991129613";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Olá! Tenho interesse em conhecer a assessoria de Acompanhamento mensal — gostaria de mais informações."
);

export default function ClienteAcompanhamento() {
  const { data: folders = [], isLoading } = useClientFoldersForUnit();

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <Card className="overflow-hidden border-primary/20">
          <div className="bg-gradient-to-br from-primary/10 via-violet-500/10 to-blue-500/10 px-6 py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-3">
              Acompanhamento Mensal Estratégico
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-2">
              Tenha uma equipe especialista cuidando do seu marketing todos os meses.
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Análise completa de resultados, planejamento de conteúdo, campanhas de tráfego pago,
              estratégias de vendas e relatórios detalhados — entregues em apresentações profissionais.
            </p>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border bg-card text-center space-y-2">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center mx-auto">
                  <BarChart3 className="w-5 h-5 text-violet-600" />
                </div>
                <p className="text-sm font-semibold">Análise de Performance</p>
                <p className="text-xs text-muted-foreground">
                  Score por área e indicadores ideal vs atual
                </p>
              </div>
              <div className="p-4 rounded-xl border bg-card text-center space-y-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm font-semibold">Plano Mensal</p>
                <p className="text-xs text-muted-foreground">
                  Pautas, campanhas e ações para o próximo ciclo
                </p>
              </div>
              <div className="p-4 rounded-xl border bg-card text-center space-y-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold">Apresentação Premium</p>
                <p className="text-xs text-muted-foreground">
                  Reunião mensal de resultados e próximos passos
                </p>
              </div>
            </div>

            <div className="text-center pt-2">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() =>
                  window.open(
                    `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`,
                    "_blank"
                  )
                }
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Quero conhecer a assessoria
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Fale agora com nosso time pelo WhatsApp
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cliente has projects → render in read-only mode
  return (
    <>
      <AssessoriaPopup storageKey="noexcuse_popup_acompanhamento_v1" servico="Acompanhamento Estratégico" />
      <FranqueadoAcompanhamento forceReadOnly />
    </>
  );
}

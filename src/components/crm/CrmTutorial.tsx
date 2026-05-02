import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Layers, UserPlus, Zap, Users, BarChart3,
  ChevronRight, ChevronLeft, X, Sparkles, Lightbulb,
  Clock, Navigation, Target,
} from "lucide-react";
import { useSalesPlan } from "@/hooks/useSalesPlan";
import { useActiveStrategy } from "@/hooks/useMarketingStrategy";

function buildPersonalizedSteps(answers: Record<string, unknown> | null, _strategyResult: unknown) {
  const segmento = answers?.segmento || "";
  const ticketMedio = answers?.ticket_medio || "";
  const tamanhoEquipe = answers?.tamanho_equipe || "1";
  const tempoFechamento = answers?.tempo_fechamento || "";
  const maiorPerda = answers?.maior_perda || "";
  const followup = answers?.followup || "";
  const controle = answers?.controle_leads || answers?.usa_crm || "";
  const etapasFunil = answers?.etapas_funil || "";
  const volumeLeads = answers?.volume_leads || "";
  const metaFaturamento = answers?.meta_faturamento || "";
  const faturamentoAtual = answers?.faturamento || "";

  const funil = (() => {
    let etapasSugeridas = "";
    let motivo = "";
    let alerta = "";

    if (etapasFunil && etapasFunil.length > 10) {
      etapasSugeridas = "Com base no que você descreveu no GPS, revise e ajuste os nomes das etapas se necessário.";
    } else if (segmento === "advocacia" || segmento === "psicologia" || segmento === "consultoria") {
      etapasSugeridas = "Sugestão: Primeiro Contato → Consulta Inicial → Proposta → Contrato Assinado → Cliente Ativo";
    } else if (segmento === "saude" || segmento === "odontologia") {
      etapasSugeridas = "Sugestão: Contato → Agendamento → Avaliação → Proposta → Paciente Ativo";
    } else if (segmento === "varejo" || segmento === "ecommerce") {
      etapasSugeridas = "Sugestão: Interesse → Demonstração → Proposta → Negociação → Venda Fechada";
    } else if (ticketMedio === "15k+" || ticketMedio === "5k-15k") {
      etapasSugeridas = "Com ticket alto: Qualificação → Reunião → Proposta Customizada → Negociação → Fechamento";
    } else {
      etapasSugeridas = "Personalize as etapas para refletir exatamente como sua venda acontece na prática.";
    }

    if (maiorPerda === "primeiro_contato") {
      motivo = "O GPS identificou que você perde mais leads no primeiro contato. Ter o funil configurado te ajuda a visualizar quantos leads estão parados nessa etapa e agir rápido.";
      alerta = "⚡ Leads sem resposta em até 5 minutos têm 80% menos chance de fechar.";
    } else if (maiorPerda === "proposta") {
      motivo = "Você perde leads na fase de proposta. O funil mostra quantas propostas estão abertas e há quanto tempo — para você fazer follow-up antes do lead esfriar.";
      alerta = "💡 Configure uma etapa 'Proposta Enviada' e ative alerta de 2 dias sem resposta.";
    } else if (maiorPerda === "negociacao") {
      motivo = "A negociação é seu maior gargalo. Com o funil visual, você vê exatamente onde cada lead travou e pode agir com o argumento certo.";
      alerta = "💡 Use as notas do lead para registrar objeções levantadas na negociação.";
    } else {
      motivo = "O funil organiza todas as suas oportunidades em etapas visuais — você vê o status de cada venda num só lugar.";
      alerta = "💡 Comece com 4-5 etapas. Você pode ajustar a qualquer momento em Configurações.";
    }

    return {
      icon: <Layers className="w-6 h-6" />,
      title: "Configure seu Funil de Vendas",
      description: motivo,
      tips: [etapasSugeridas, alerta],
      rec: `Clique em ⚙️ Configurações > Funis para ajustar as etapas do seu processo.`,
    };
  })();

  const leads = (() => {
    let descricao = "";
    let tip1 = "";
    let tip2 = "";
    let rec = "";

    if (controle === "nada" || controle === "whatsapp") {
      descricao = "Você ainda controla leads pelo WhatsApp ou na memória. O primeiro passo é transferir essas conversas para o CRM — cada contato sem retorno é uma oportunidade que ainda pode ser recuperada.";
      tip1 = "Abra seu WhatsApp agora e liste os últimos 10 contatos que pediram informação. Cadastre cada um aqui.";
      tip2 = "Use a importação CSV para trazer uma lista de contatos de uma vez.";
      rec = "Comece cadastrando manualmente os leads mais quentes — aqueles que demonstraram interesse nos últimos 30 dias.";
    } else if (controle === "planilha") {
      descricao = "Você usa planilha para controlar leads. Ótimo — isso significa que você já tem uma base para importar. No CRM, esses dados ficam organizados com etapas, histórico e alertas automáticos.";
      tip1 = "Use Importar CSV para trazer sua planilha atual de uma vez — economize horas de digitação.";
      tip2 = "Certifique-se que sua planilha tem colunas: Nome, Telefone, Email e Origem do lead.";
      rec = "Importe sua base e classifique cada lead na etapa correta do funil.";
    } else {
      descricao = "Cada lead é uma oportunidade de venda. Adicione manualmente, importe planilhas ou receba automaticamente via WhatsApp integrado.";
      tip1 = volumeLeads === "100-300" || volumeLeads === "300+" ? "Com alto volume, use a importação CSV e a Roleta para distribuir automaticamente." : "Com volume menor, capriche nos dados de cada lead — histórico completo aumenta a conversão.";
      tip2 = "Use tags para classificar: 'indicação', 'quente', 'retomar', 'sem resposta'.";
      rec = ticketMedio === "15k+" || ticketMedio === "5k-15k" ? "Com ticket alto, preencha o campo Valor estimado em cada lead — isso mostra o potencial real do seu pipeline." : "Use tags para priorizar leads mais quentes e não deixar oportunidades esfriarem.";
    }

    return {
      icon: <UserPlus className="w-6 h-6" />,
      title: "Cadastre seus Primeiros Leads",
      description: descricao,
      tips: [tip1, tip2],
      rec,
    };
  })();

  const automacoes = (() => {
    let descricao = "";
    let tip1 = "";
    let tip2 = "";
    let rec = "";

    if (followup === "nao") {
      descricao = "O GPS identificou que você não faz follow-up estruturado. 80% das vendas acontecem após o 5º contato, mas a maioria das empresas desiste no 1º. O CRM resolve isso automaticamente.";
      tip1 = "Configure uma automação: quando um lead fica 2 dias sem movimentação → cria tarefa de follow-up para você.";
      tip2 = "Use os scripts gerados automaticamente pelo GPS para guiar suas mensagens de follow-up.";
      rec = "Comece com 1 automação: 'Lead parado há 2 dias → Criar tarefa de contato'. Isso já vai recuperar vendas perdidas.";
    } else if (followup === "eventual") {
      descricao = "Você faz follow-up quando lembra — o que significa que muitos leads estão esfriando enquanto você está ocupado. O CRM vai te alertar automaticamente para não perder o timing.";
      tip1 = "Configure alertas de lead parado: 2 dias para leads quentes, 5 dias para leads frios.";
      tip2 = "Use a visão de lista para ver todos os leads ordenados por 'último contato' — os mais antigos primeiro.";
      rec = `Configure o alerta de follow-up baseado no seu ciclo de venda (${tempoFechamento || "1-7 dias"}). Leads sem contato dentro do prazo ficam com alerta vermelho.`;
    } else {
      descricao = "Automações trabalham por você 24h por dia — criam tarefas, enviam alertas e movem leads automaticamente baseado no comportamento deles.";
      tip1 = tempoFechamento === "mesmo_dia" ? "Ciclo rápido: configure alerta de lead novo sem contato em 2 horas." : "Configure follow-up automático baseado no tempo do seu ciclo de venda.";
      tip2 = "Automações com IA qualificam leads automaticamente via WhatsApp antes de chegarem para você.";
      rec = "Ative a automação 'Lead parado → Tarefa de follow-up' como ponto de partida.";
    }

    return {
      icon: <Zap className="w-6 h-6" />,
      title: "Automatize seu Follow-up",
      description: descricao,
      tips: [tip1, tip2],
      rec,
    };
  })();

  const equipe = (() => {
    const sozinho = tamanhoEquipe === "1" || tamanhoEquipe === "Só eu";
    return {
      icon: sozinho ? <Navigation className="w-6 h-6" /> : <Users className="w-6 h-6" />,
      title: sozinho ? "Mantenha o Foco nas Vendas" : "Configure sua Equipe",
      description: sozinho
        ? "Você é o responsável por todas as vendas agora. O CRM garante que você não perca nenhuma oportunidade — mesmo quando está em reunião, atendimento ou offline."
        : `Você tem uma equipe de vendas. O CRM permite ver o desempenho de cada vendedor, distribuir leads automaticamente e garantir que ninguém fique sobrecarregado.`,
      tips: sozinho
        ? ["Configure notificações para receber alerta quando um lead novo entrar pelo WhatsApp ou formulário.", "Quando crescer o time, a Roleta distribui leads automaticamente entre os vendedores."]
        : ["Adicione os membros da equipe em Configurações > Equipe e defina o responsável por cada lead.", "A Roleta distribui novos leads automaticamente — Round-Robin garante distribuição igual entre todos."],
      rec: sozinho
        ? "No momento, foque em manter o funil organizado e o follow-up em dia. Quando contratar o primeiro vendedor, configure a distribuição de leads."
        : "Configure a Roleta agora para que os próximos leads já entrem distribuídos automaticamente.",
    };
  })();

  const metricas = (() => {
    const tip1 = metaFaturamento
      ? `Sua meta é ${metaFaturamento}/mês. Monitore o pipeline diariamente — o valor total das propostas abertas indica se você vai atingir a meta.`
      : "Acompanhe o valor total do pipeline — ele mostra o potencial de receita das oportunidades em andamento.";

    const tip2 = `Taxa de conversão atual: ${answers?.conversao_etapa === "menos_10" ? "menos de 10%" : answers?.conversao_etapa === "10-30" ? "10-30%" : answers?.conversao_etapa === "nao" ? "não medida ainda — comece a medir agora" : "em desenvolvimento"}. Use os filtros para identificar em qual etapa você perde mais.`;

    return {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Acompanhe seu Pipeline",
      description: `O resumo do pipeline mostra em tempo real o valor acumulado em cada etapa — assim você sabe se está no caminho certo para bater a meta${metaFaturamento ? ` de ${metaFaturamento}/mês` : ""}.`,
      tips: [tip1, tip2],
      rec: "Configure a meta mensal nas Metas do sistema para acompanhar o progresso em tempo real no dashboard.",
    };
  })();

  return [funil, leads, automacoes, equipe, metricas];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CrmTutorial({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(0);
  const { data: salesPlan } = useSalesPlan();
  const { data: strategy } = useActiveStrategy();

  const steps = buildPersonalizedSteps(
    salesPlan?.answers || null,
    strategy?.strategy_result || null
  );

  const totalSteps = steps.length;
  const current = steps[step];

  const handleClose = () => {
    localStorage.setItem("crm_gps_tutorial_v2", "true");
    onOpenChange(false);
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Guia do CRM</DialogTitle>

        {/* Header */}
        <div className="bg-gradient-to-br from-primary/90 to-primary px-6 pt-6 pb-8 text-primary-foreground relative">
          <button onClick={handleClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-primary-foreground/10 transition">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-[10px]">
              <Target className="w-3 h-3 mr-1" /> Guia GPS
            </Badge>
            <span className="text-[10px] text-primary-foreground/70">
              {step + 1} de {totalSteps}
            </span>
          </div>

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

          <div className="space-y-2">
            {current.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                <span>{tip}</span>
              </div>
            ))}
          </div>

          {current.rec && (
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> O que fazer agora
              </p>
              <p className="text-xs text-foreground leading-relaxed">{current.rec}</p>
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
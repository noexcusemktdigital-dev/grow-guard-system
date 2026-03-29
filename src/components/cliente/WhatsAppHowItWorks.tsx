import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Plug,
  Webhook,
  MessageSquareText,
  Send,
  ExternalLink,
  Smartphone,
  Server,
  ArrowDown,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

interface WhatsAppHowItWorksProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  {
    icon: Plug,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    title: "Conexão",
    description:
      "Você conecta seu WhatsApp ao sistema pela Easytech, nosso parceiro oficial de integração. O sistema cria a instância automaticamente.",
  },
  {
    icon: Webhook,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    title: "Webhook automático",
    description:
      'Quando você conecta, o sistema configura automaticamente um webhook. Isso é como um "endereço" que o WhatsApp usa para enviar todas as mensagens e eventos para o seu sistema Grow.',
  },
  {
    icon: MessageSquareText,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    title: "Recebimento de eventos",
    description:
      "Toda mensagem recebida, enviada, lida ou status de conexão é enviado automaticamente para o Grow via webhook. Você não precisa fazer nada.",
  },
  {
    icon: Send,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Envio de mensagens",
    description:
      "Para enviar mensagens, o Grow chama a API do WhatsApp diretamente. A resposta volta pelo webhook.",
  },
  {
    icon: ExternalLink,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    title: "Webhook externo (opcional)",
    description:
      "Se você usa outro sistema (CRM, ERP, etc.) que também precisa receber eventos do WhatsApp, configure o webhook desse sistema nas integrações. O Grow pode repassar eventos para URLs externas.",
  },
];

const FAQ = [
  {
    question: "Quem configura o webhook?",
    answer:
      "O sistema configura automaticamente. Você não precisa saber o que é webhook.",
  },
  {
    question: "Preciso de servidor próprio?",
    answer:
      "Não para Z-API. Para Evolution API, sim (ou use o servidor compartilhado).",
  },
  {
    question: "E se eu quiser conectar outro sistema?",
    answer:
      "Nas configurações, você pode adicionar uma URL de webhook externo.",
  },
];

export function WhatsAppHowItWorks({ open, onOpenChange }: WhatsAppHowItWorksProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Como funciona a integração WhatsApp
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mt-2">
            Entenda o fluxo completo de conexão, envio e recebimento de
            mensagens pelo WhatsApp no Grow.
          </p>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Steps */}
          <div className="space-y-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center shrink-0`}
                    >
                      <Icon className={`w-5 h-5 ${step.color}`} />
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className="w-px h-6 bg-border mt-1" />
                    )}
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">{step.title}</h3>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0"
                      >
                        {index + 1}/{STEPS.length}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Visual Diagram */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
              Diagrama do fluxo
            </h4>
            <div className="rounded-xl border border-border bg-muted/30 p-5">
              <div className="flex flex-col items-center gap-2">
                {/* Phone */}
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold">
                    Celular WhatsApp
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    QR Code
                  </span>
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* API */}
                <div className="flex items-center gap-2 rounded-lg border-2 border-blue-500/30 bg-blue-500/5 px-4 py-2.5">
                  <Server className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-semibold">
                    Evolution API / Z-API
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 border-primary/30 text-primary"
                  >
                    webhook automatico
                  </Badge>
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Grow */}
                <div className="flex items-center gap-2 rounded-lg border-2 border-primary/30 bg-primary/5 px-4 py-2.5">
                  <MessageSquareText className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-primary">
                    Grow (seu sistema)
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-500"
                  >
                    opcional
                  </Badge>
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* External */}
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-2.5">
                  <ExternalLink className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold text-muted-foreground">
                    Sistema externo (CRM, ERP)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* FAQ */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              Perguntas frequentes
            </h4>
            <div className="space-y-2">
              {FAQ.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-xs font-semibold">
                      {item.question}
                    </span>
                    {expandedFaq === index ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 pb-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Entendi, fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

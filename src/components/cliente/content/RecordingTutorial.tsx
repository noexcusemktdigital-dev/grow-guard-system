import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Camera, Smartphone, Monitor, Lightbulb, Scissors, Music, Clock, Video, Eye } from "lucide-react";

interface RecordingTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  format: string;
  script?: any;
}

const TUTORIALS: Record<string, {
  title: string;
  icon: any;
  orientation: string;
  duration: string;
  resolution: string;
  steps: { title: string; desc: string; icon: any }[];
  tips: string[];
}> = {
  stories: {
    title: "Stories",
    icon: Smartphone,
    orientation: "Vertical (9:16)",
    duration: "Até 15s por slide",
    resolution: "1080×1920",
    steps: [
      { title: "Prepare o ambiente", desc: "Boa iluminação frontal, fundo limpo. Use luz natural ou ring light.", icon: Lightbulb },
      { title: "Posicione a câmera", desc: "Câmera frontal, na altura dos olhos. Enquadre do peito pra cima.", icon: Camera },
      { title: "Grave o hook", desc: "Comece falando direto o gancho do roteiro. Nos Stories, os 2 primeiros segundos decidem se a pessoa vai pular.", icon: Eye },
      { title: "Fale naturalmente", desc: "Stories pedem autenticidade. Fale como se estivesse conversando com um amigo. Não leia, conte.", icon: Video },
      { title: "Finalize com CTA", desc: "No último slide, peça para responder, clicar no link ou arrastar pra cima.", icon: Smartphone },
    ],
    tips: [
      "Adicione legendas — 80% assistem sem som",
      "Use stickers e enquetes para engajamento",
      "Grave vários takes de 15s, não tente fazer tudo de uma vez",
      "Mantenha energia alta e fala rápida",
    ],
  },
  reels: {
    title: "Reels",
    icon: Smartphone,
    orientation: "Vertical (9:16)",
    duration: "30–90 segundos",
    resolution: "1080×1920",
    steps: [
      { title: "Prepare o cenário", desc: "Fundo organizado, iluminação frontal. Evite contraluz.", icon: Lightbulb },
      { title: "Hook nos 3 primeiros segundos", desc: "CRUCIAL: A primeira frase do roteiro deve prender atenção imediatamente. Comece com uma pergunta ou afirmação forte.", icon: Eye },
      { title: "Grave em takes curtos", desc: "Grave cada parte do roteiro separadamente (hook, desenvolvimento, CTA). Depois junte na edição.", icon: Camera },
      { title: "Movimente-se", desc: "Troque ângulos entre takes. Aproxime/afaste. Cortes dinâmicos mantêm retenção.", icon: Video },
      { title: "Texto de tela", desc: "Adicione o texto de tela indicado no roteiro usando o editor do Instagram. Ajuda na retenção.", icon: Smartphone },
      { title: "CTA final", desc: "Termine com o CTA do roteiro. Peça pra salvar, compartilhar ou comentar.", icon: Eye },
    ],
    tips: [
      "Use transições e cortes a cada 3-5s para manter retenção",
      "Adicione legendas sempre — aumenta retenção em 40%",
      "Use áudio trending quando possível (vá em Reels > Áudio)",
      "O ideal é 30-60s para melhor distribuição",
      "Grave em 4K e exporte em 1080p para máxima qualidade",
    ],
  },
  tiktok: {
    title: "TikTok",
    icon: Smartphone,
    orientation: "Vertical (9:16)",
    duration: "15–60 segundos",
    resolution: "1080×1920",
    steps: [
      { title: "Setup rápido", desc: "O TikTok valoriza autenticidade. Não precisa de cenário perfeito, mas boa iluminação é essencial.", icon: Lightbulb },
      { title: "Hook imediato", desc: "No TikTok, você tem 1-2 segundos. Comece com frase de impacto ou ação visual que pare o scroll.", icon: Eye },
      { title: "Cortes rápidos", desc: "Grave takes de 3-5 segundos e junte. Quanto mais dinâmico, melhor a retenção.", icon: Scissors },
      { title: "Use tendências", desc: "Adapte seu roteiro ao formato de tendências atuais (POV, Storytime, Tutorial rápido).", icon: Video },
      { title: "Legenda e texto", desc: "Adicione texto na tela em cada corte. O TikTok é consumido em mute.", icon: Smartphone },
    ],
    tips: [
      "Grave nativo no app do TikTok para melhor qualidade",
      "Use sons trending — confira a aba Descobrir",
      "Responda comentários com vídeo para mais alcance",
      "Poste 1-3 vezes por dia para crescimento rápido",
      "Hashtags: 3-5 relevantes, misture amplas e nichadas",
    ],
  },
  youtube: {
    title: "YouTube",
    icon: Monitor,
    orientation: "Horizontal (16:9)",
    duration: "3–15 minutos",
    resolution: "1920×1080 (mínimo)",
    steps: [
      { title: "Prepare o estúdio", desc: "Fundo profissional, iluminação de 3 pontos se possível. Use microfone externo (lapela ou condensador).", icon: Lightbulb },
      { title: "Câmera na horizontal", desc: "Grave em 16:9, resolução mínima 1080p (ideal 4K). Câmera na altura dos olhos.", icon: Camera },
      { title: "Introdução com hook", desc: "Os primeiros 30 segundos definem a retenção. Apresente o que a pessoa vai aprender/ganhar assistindo.", icon: Eye },
      { title: "Siga o roteiro completo", desc: "O YouTube permite conteúdo longo. Siga cada seção do roteiro com calma, dando exemplos práticos.", icon: Video },
      { title: "Timestamps", desc: "Grave de forma que permita criar capítulos. Cada seção do roteiro pode virar um timestamp.", icon: Clock },
      { title: "Edição profissional", desc: "Adicione B-roll, zoom-ins nos pontos importantes, legendas e gráficos.", icon: Scissors },
      { title: "CTA e encerramento", desc: "Peça para se inscrever, ativar notificações e compartilhar. Indique próximo vídeo.", icon: Eye },
    ],
    tips: [
      "Thumbnail é 50% do sucesso — crie uma thumbnail chamativa",
      "Título com palavra-chave principal + curiosidade",
      "Descrição: 2-3 parágrafos + links + timestamps",
      "Adicione cards e telas finais para aumentar watch time",
      "Música de fundo baixa melhora experiência (use música sem copyright)",
      "Ideal: áudio claro sem eco. Grave num ambiente fechado.",
    ],
  },
};

export function RecordingTutorial({ open, onOpenChange, format, script }: RecordingTutorialProps) {
  const normalizedFormat = format?.toLowerCase().replace(/[^a-z]/g, "") || "reels";
  const tutorial = TUTORIALS[normalizedFormat] || TUTORIALS.reels;
  const TutorialIcon = tutorial.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <TutorialIcon className="w-5 h-5 text-primary" />
            Como Gravar — {tutorial.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Specs */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 text-xs"><Smartphone className="w-3 h-3" /> {tutorial.orientation}</Badge>
            <Badge variant="outline" className="gap-1 text-xs"><Clock className="w-3 h-3" /> {tutorial.duration}</Badge>
            <Badge variant="outline" className="gap-1 text-xs"><Camera className="w-3 h-3" /> {tutorial.resolution}</Badge>
          </div>

          {/* Script reference */}
          {script && (
            <div className="bg-muted/50 rounded-lg p-3 border">
              <p className="text-[11px] font-semibold text-foreground mb-1">📝 Seu Roteiro</p>
              <p className="text-xs text-muted-foreground font-medium">{script.titulo || script.title}</p>
              {script.conteudo_principal?.hook && (
                <p className="text-[11px] text-muted-foreground mt-1"><strong>Hook:</strong> {script.conteudo_principal.hook}</p>
              )}
            </div>
          )}

          {/* Steps */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-foreground">Passo a passo</p>
            {tutorial.steps.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <StepIcon className="w-3.5 h-3.5 text-primary" /> {step.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tips */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
            <p className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" /> Dicas extras para {tutorial.title}
            </p>
            <ul className="space-y-1.5">
              {tutorial.tips.map((tip, i) => (
                <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5">
                  <span className="text-primary shrink-0">•</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

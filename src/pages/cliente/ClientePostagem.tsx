// @ts-nocheck
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image, CalendarDays, Printer, ArrowRight, Sparkles } from "lucide-react";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const ClienteRedesSociais = lazy(() => import("./ClienteRedesSociais"));

type PostMode = "selector" | "unitaria" | "automatizada" | "impressao";

const MODES = [
  {
    key: "unitaria" as const,
    title: "Unitária",
    subtitle: "Crie uma arte específica sob demanda",
    description: "Ideal para postagens pontuais. Use o wizard para definir tema, estilo e textos.",
    icon: Image,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    key: "automatizada" as const,
    title: "Automatizada",
    subtitle: "Geração mensal em lote",
    description: "Defina quantidade, temas e frequência. O sistema gera todas as artes do mês automaticamente.",
    icon: CalendarDays,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    badge: "Em breve",
  },
  {
    key: "impressao" as const,
    title: "Impressão",
    subtitle: "Artes para materiais offline",
    description: "Cartões de visita, banners, flyers e outros materiais em alta resolução para impressão.",
    icon: Printer,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    badge: "Em breve",
  },
];

export default function ClientePostagem() {
  const [searchParams] = useSearchParams();
  const initialMode = (searchParams.get("mode") as PostMode) || "selector";
  const [mode, setMode] = useState<PostMode>(initialMode);

  // Mode unitária — reutiliza o componente existente
  if (mode === "unitaria") {
    return (
      <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
        <ClienteRedesSociais />
      </Suspense>
    );
  }

  // Modo automatizada (coming soon)
  if (mode === "automatizada") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Postagem Automatizada"
          subtitle="Geração mensal em lote"
          backButton={<Button variant="ghost" size="sm" onClick={() => setMode("selector")}>← Voltar</Button>}
        />
        <Card>
          <CardContent className="py-16 text-center">
            <CalendarDays className="w-12 h-12 mx-auto text-emerald-500/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Em breve</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Defina a quantidade de postagens mensais, escolha temas e deixe a IA gerar todo o conteúdo visual automaticamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Modo impressão (coming soon)
  if (mode === "impressao") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Impressão"
          subtitle="Artes para materiais offline"
          backButton={<Button variant="ghost" size="sm" onClick={() => setMode("selector")}>← Voltar</Button>}
        />
        <Card>
          <CardContent className="py-16 text-center">
            <Printer className="w-12 h-12 mx-auto text-amber-500/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Em breve</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Crie artes em alta resolução para cartões de visita, banners, flyers e outros materiais impressos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Selector
  return (
    <div className="space-y-6">
      <PageHeader
        title="Postagem"
        subtitle="Escolha como deseja criar seus materiais"
        icon={<Sparkles className="w-5 h-5 text-primary" />}
        actions={<FeatureTutorialButton slug="redes_sociais" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((m) => {
          const Icon = m.icon;
          const isDisabled = !!m.badge;
          return (
            <Card
              key={m.key}
              className={`relative overflow-hidden transition-all duration-200 ${
                isDisabled ? "opacity-60" : "hover:shadow-md hover:scale-[1.01] cursor-pointer"
              } border ${m.border}`}
              onClick={isDisabled ? undefined : () => setMode(m.key)}
            >
              {m.badge && (
                <Badge className="absolute top-3 right-3 text-[10px]" variant="secondary">
                  {m.badge}
                </Badge>
              )}
              <CardContent className="p-6 space-y-4">
                <div className={`w-12 h-12 rounded-xl ${m.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${m.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-base">{m.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.subtitle}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
                {!isDisabled && (
                  <Button variant="ghost" size="sm" className="gap-1.5 p-0 h-auto text-primary">
                    Começar <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

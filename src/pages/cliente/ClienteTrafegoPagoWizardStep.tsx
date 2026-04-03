import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import type { TrafficWizardData } from "@/hooks/useTrafficStrategy";
import { BrazilLocationAutocomplete } from "@/components/traffic/BrazilLocationAutocomplete";
import {
  OBJECTIVES, AUDIENCES, DESTINATIONS, PLATFORMS, ASSETS, STEPS,
} from "./ClienteTrafegoPagoConstants";

interface WizardStepProps {
  step: number;
  wizardData: TrafficWizardData;
  setWizardData: React.Dispatch<React.SetStateAction<TrafficWizardData>>;
  toggleArrayItem: (field: keyof TrafficWizardData, val: string) => void;
  marketingStrategyPublicoAlvo?: string;
  sitesData?: Array<{ name: string; status?: string; url?: string; type?: string }>;
  detectedAssets: string[];
}

export function ClienteTrafegoPagoWizardStep({
  step,
  wizardData,
  setWizardData,
  toggleArrayItem,
  marketingStrategyPublicoAlvo,
  sitesData,
  detectedAssets,
}: WizardStepProps) {
  const stepId = STEPS[step].id;

  switch (stepId) {
    case "objetivo":
      return (
        <div className="space-y-3">
          <p className="text-sm font-medium">Qual é o principal objetivo das campanhas?</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {OBJECTIVES.map((o) => (
              <Card
                key={o.value}
                className={`cursor-pointer transition-all hover:shadow-md ${wizardData.objetivo === o.value ? "ring-2 ring-primary border-primary" : "border-muted"}`}
                onClick={() => setWizardData((p) => ({ ...p, objetivo: o.value }))}
              >
                <CardContent className="py-4 flex flex-col items-center gap-2 text-center">
                  <o.icon className={`w-6 h-6 ${wizardData.objetivo === o.value ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-xs font-medium">{o.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );

    case "produto":
      return (
        <div className="space-y-3">
          <p className="text-sm font-medium">Qual produto ou serviço será anunciado?</p>
          <Textarea
            placeholder="Descreva o produto ou serviço principal que será anunciado..."
            value={wizardData.produto}
            onChange={(e) => setWizardData((p) => ({ ...p, produto: e.target.value }))}
            rows={4}
          />
        </div>
      );

    case "publico":
      return (
        <div className="space-y-4">
          <p className="text-sm font-medium">Quem você deseja atingir com os anúncios?</p>
          {marketingStrategyPublicoAlvo && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-[10px] font-semibold text-primary uppercase">📋 Da sua Estratégia de Marketing</p>
              <p className="text-xs mt-1 text-muted-foreground">{marketingStrategyPublicoAlvo}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {AUDIENCES.map((a) => (
              <Badge
                key={a}
                variant={wizardData.publico.includes(a) ? "default" : "outline"}
                className="cursor-pointer text-xs py-1.5 px-3"
                onClick={() => toggleArrayItem("publico", a)}
              >
                {a}
              </Badge>
            ))}
          </div>
          <Input
            placeholder="Ou descreva seu público personalizado..."
            value={wizardData.publico_custom}
            onChange={(e) => setWizardData((p) => ({ ...p, publico_custom: e.target.value }))}
          />
        </div>
      );

    case "destino":
      return (
        <div className="space-y-3">
          <p className="text-sm font-medium">Para onde o anúncio deve levar o usuário?</p>
          {sitesData && sitesData.length > 0 && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-[10px] font-semibold text-primary uppercase">🌐 Sites detectados</p>
              <p className="text-xs mt-1 text-muted-foreground">{sitesData.map((s) => s.name).join(", ")}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DESTINATIONS.map((d) => (
              <Card
                key={d.value}
                className={`cursor-pointer transition-all hover:shadow-md ${wizardData.pagina_destino === d.value ? "ring-2 ring-primary border-primary" : "border-muted"}`}
                onClick={() => setWizardData((p) => ({ ...p, pagina_destino: d.value }))}
              >
                <CardContent className="py-4 flex flex-col items-center gap-2 text-center">
                  <d.icon className={`w-6 h-6 ${wizardData.pagina_destino === d.value ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-xs font-medium">{d.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );

    case "orcamento":
      return (
        <div className="space-y-5">
          <p className="text-sm font-medium">Qual orçamento mensal para anúncios?</p>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">R$ {wizardData.orcamento.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground mt-1">por mês</p>
          </div>
          <Slider
            value={[wizardData.orcamento]}
            onValueChange={([v]) => setWizardData((p) => ({ ...p, orcamento: v }))}
            min={500}
            max={50000}
            step={500}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>R$ 500</span>
            <span>R$ 50.000</span>
          </div>
        </div>
      );

    case "plataformas":
      return (
        <div className="space-y-3">
          <p className="text-sm font-medium">Em quais plataformas deseja anunciar?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLATFORMS.map((p) => {
              const selected = wizardData.plataformas.includes(p.value);
              return (
                <Card
                  key={p.value}
                  className={`cursor-pointer transition-all hover:shadow-md ${selected ? "ring-2 ring-primary border-primary" : "border-muted"}`}
                  onClick={() => toggleArrayItem("plataformas", p.value)}
                >
                  <CardContent className="py-4 flex flex-col items-center gap-2 text-center">
                    <div className={`p-2 rounded-xl ${p.color}`}>
                      <p.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium">{p.label}</span>
                    {selected && <span className="text-primary text-xs">✓</span>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      );

    case "regiao":
      return (
        <div className="space-y-3">
          <p className="text-sm font-medium">Em qual região deseja anunciar?</p>
          <BrazilLocationAutocomplete
            value={wizardData.regiao}
            onChange={(v) => setWizardData((p) => ({ ...p, regiao: v }))}
          />
        </div>
      );

    case "ativos":
      return (
        <div className="space-y-4">
          <p className="text-sm font-medium">Quais ativos você já possui?</p>
          {detectedAssets.length > 0 && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-[10px] font-semibold text-primary uppercase">✅ Detectados automaticamente</p>
              <p className="text-xs mt-1 text-muted-foreground">{detectedAssets.join(", ")}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ASSETS.map((a) => {
              const selected = wizardData.ativos.includes(a.value);
              return (
                <Card
                  key={a.value}
                  className={`cursor-pointer transition-all hover:shadow-md ${selected ? "ring-2 ring-primary border-primary" : "border-muted"}`}
                  onClick={() => toggleArrayItem("ativos", a.value)}
                >
                  <CardContent className="py-4 flex flex-col items-center gap-2 text-center">
                    <a.icon className={`w-6 h-6 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium">{a.label}</span>
                    {detectedAssets.includes(a.value) && !selected && (
                      <Badge variant="outline" className="text-[8px]">detectado</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      );

    default:
      return null;
  }
}

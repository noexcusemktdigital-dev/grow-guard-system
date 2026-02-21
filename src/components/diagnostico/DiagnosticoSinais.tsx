import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";

const sinaisPorNivel: Record<string, { sinais: string[]; problema: string; icon: typeof AlertTriangle; iconColor: string }> = {
  "Caótico": {
    icon: AlertTriangle,
    iconColor: "text-red-500",
    problema: "Ausência total de processos e estratégia digital. O negócio depende 100% de indicações ou demanda espontânea.",
    sinais: [
      "Não possui presença digital estruturada",
      "Não utiliza CRM ou funil de vendas",
      "Marketing é feito sem planejamento ou métricas",
      "Não sabe quanto custa adquirir um cliente (CAC)",
      "Vendas acontecem por acaso, não por processo",
    ],
  },
  "Reativo": {
    icon: AlertCircle,
    iconColor: "text-orange-500",
    problema: "Existem ações pontuais de marketing, mas sem estratégia integrada. Os resultados são inconsistentes e difíceis de replicar.",
    sinais: [
      "Tem redes sociais mas sem consistência de postagens",
      "Já investiu em tráfego pago sem retorno claro",
      "Possui site mas sem otimização ou geração de leads",
      "Não tem processo definido de follow-up comercial",
      "Decisões baseadas em achismo, não em dados",
    ],
  },
  "Estruturado": {
    icon: Info,
    iconColor: "text-yellow-500",
    problema: "A base está montada, mas faltam otimização e escala. Os dados existem mas não são usados estrategicamente para crescer.",
    sinais: [
      "Possui CRM mas não utiliza todo o potencial",
      "Tem campanhas ativas mas sem testes A/B",
      "Gera leads mas taxa de conversão pode melhorar",
      "Equipe comercial existe mas sem treinamento contínuo",
      "Métricas são acompanhadas mas sem plano de ação",
    ],
  },
  "Analítico": {
    icon: CheckCircle2,
    iconColor: "text-green-500",
    problema: "O negócio já opera com dados e processos. O próximo passo é escalar o que funciona e implementar growth loops.",
    sinais: [
      "Dashboard de métricas ativo e atualizado",
      "CAC, LTV e ROI calculados mensalmente",
      "Equipe treinada com processos documentados",
      "Tráfego pago com otimização contínua",
      "Falta expandir canais e criar automações avançadas",
    ],
  },
};

interface Props {
  nivel: { label: string };
}

export function DiagnosticoSinais({ nivel }: Props) {
  const data = sinaisPorNivel[nivel.label];
  if (!data) return null;
  const Icon = data.icon;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Icon className={`w-4 h-4 ${data.iconColor}`} /> Sinais do Nível {nivel.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-muted/30 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Problema Principal</p>
          <p className="text-sm leading-relaxed">{data.problema}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Sinais Comuns</p>
          <ul className="space-y-2">
            {data.sinais.map((s, i) => (
              <li key={i} className="text-sm flex gap-2 items-start">
                <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: sinaisPorNivel[nivel.label]?.icon === AlertTriangle ? "#dc2626" : sinaisPorNivel[nivel.label]?.icon === AlertCircle ? "#ea580c" : sinaisPorNivel[nivel.label]?.icon === Info ? "#eab308" : "#16a34a" }} />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target, TrendingUp, Package, CheckCircle2, Layers, BarChart3, Rocket } from "lucide-react";

// ── Fases Estratégicas ──
const fases = [
  {
    id: 1,
    titulo: "FASE 01 — ESTRUTURAÇÃO",
    icon: Layers,
    cor: "text-red-500",
    bgCor: "bg-red-500/10",
    borderCor: "border-red-500/20",
    items: [
      "Diagnóstico completo do funil de vendas e comunicação",
      "Mapeamento de produto e jornada de compra",
      "Criação/revisão de identidade de marca e presença digital",
      "Linha editorial estratégica e calendário de conteúdo",
      "Implantação técnica de canais digitais",
      "Padronização de processos comerciais",
      "Criação e integração de CRM",
      "Treinamento da equipe comercial",
    ],
  },
  {
    id: 2,
    titulo: "FASE 02 — COLETA DE DADOS",
    icon: BarChart3,
    cor: "text-yellow-500",
    bgCor: "bg-yellow-500/10",
    borderCor: "border-yellow-500/20",
    items: [
      "Campanhas de tráfego pago (Meta + Google + LinkedIn)",
      "Criação de dashboards e relatórios",
      "Otimização de funil e jornada",
      "Testes A/B contínuos",
      "Cálculo e padronização de indicadores financeiros",
      "Implementação de benchmark interno",
      "Criação de plano de retenção e recompra",
    ],
  },
  {
    id: 3,
    titulo: "FASE 03 — ESCALA",
    icon: Rocket,
    cor: "text-green-500",
    bgCor: "bg-green-500/10",
    borderCor: "border-green-500/20",
    items: [
      "Planejamento de escala e redistribuição de mídia",
      "Criação e otimização de estratégias de monetização",
      "Fluxos de remarketing e reativação",
      "Retenção e aumento de LTV",
      "Expansão comercial e treinamento de escala",
      "Implementação de growth loops",
    ],
  },
];

function getFasesParaNivel(nivelLabel: string): number[] {
  switch (nivelLabel) {
    case "Caótico": return [1];
    case "Reativo": return [1, 2];
    case "Estruturado": return [2, 3];
    case "Analítico": return [3];
    default: return [1, 2, 3];
  }
}

function getProjecaoPorNivel(nivelLabel: string) {
  switch (nivelLabel) {
    case "Caótico":
      return [
        { mes: "Mês 1", leads: 5, conversoes: 0, faturamento: "R$ 0" },
        { mes: "Mês 3", leads: 15, conversoes: 2, faturamento: "R$ 8.000" },
        { mes: "Mês 6", leads: 35, conversoes: 5, faturamento: "R$ 20.000" },
        { mes: "Mês 12", leads: 70, conversoes: 14, faturamento: "R$ 56.000" },
      ];
    case "Reativo":
      return [
        { mes: "Mês 1", leads: 10, conversoes: 1, faturamento: "R$ 4.000" },
        { mes: "Mês 3", leads: 30, conversoes: 5, faturamento: "R$ 20.000" },
        { mes: "Mês 6", leads: 55, conversoes: 10, faturamento: "R$ 40.000" },
        { mes: "Mês 12", leads: 100, conversoes: 22, faturamento: "R$ 88.000" },
      ];
    case "Estruturado":
      return [
        { mes: "Mês 1", leads: 20, conversoes: 3, faturamento: "R$ 12.000" },
        { mes: "Mês 3", leads: 45, conversoes: 8, faturamento: "R$ 32.000" },
        { mes: "Mês 6", leads: 80, conversoes: 16, faturamento: "R$ 64.000" },
        { mes: "Mês 12", leads: 150, conversoes: 35, faturamento: "R$ 140.000" },
      ];
    default:
      return [
        { mes: "Mês 1", leads: 30, conversoes: 5, faturamento: "R$ 20.000" },
        { mes: "Mês 3", leads: 60, conversoes: 12, faturamento: "R$ 48.000" },
        { mes: "Mês 6", leads: 100, conversoes: 22, faturamento: "R$ 88.000" },
        { mes: "Mês 12", leads: 200, conversoes: 50, faturamento: "R$ 200.000" },
      ];
  }
}

function getEntregasPorNivel(nivel: string): string[] {
  if (nivel === "Caótico" || nivel === "Reativo") {
    return [
      "Branding completo (Logo + Manual de Marca)",
      "Site institucional com SEO",
      "Gestão de redes sociais (Artes + Programação)",
      "Configuração CRM + Funil de vendas",
      "Gestão de Tráfego Meta (Facebook/Instagram)",
    ];
  }
  if (nivel === "Estruturado") {
    return [
      "Artes e Vídeos/Reels mensais",
      "Gestão de Tráfego Meta + Google",
      "Landing Pages de captura e vendas",
      "Configuração CRM + Acompanhamento RD Station",
      "Artes e vídeos de campanha para tráfego pago",
    ];
  }
  return [
    "Vídeos/Reels premium com edição avançada",
    "Gestão multi-canal (Meta + Google + LinkedIn)",
    "E-commerce WooCommerce ou Landing Pages avançadas",
    "Fluxo/Funil completo com roteiro comercial",
    "Ebook + Apresentação Comercial estratégica",
  ];
}

interface DiagnosticoEstrategiaProps {
  pontuacao: number;
  nivel: string;
  gargalos: string[];
  empresa: string;
}

export function DiagnosticoEstrategia({ pontuacao, nivel, gargalos, empresa }: DiagnosticoEstrategiaProps) {
  const entregas = getEntregasPorNivel(nivel);
  const fasesVisiveis = getFasesParaNivel(nivel);
  const projecao = getProjecaoPorNivel(nivel);

  return (
    <>
      {/* Estratégia em 3 Fases */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Estratégia Recomendada
            <Badge variant="outline" className="ml-auto text-[10px]">Nível {nivel}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Com base no nível <strong>{nivel}</strong> ({pontuacao}%), a <strong>{empresa}</strong> deve focar nas seguintes fases:
          </p>
          {fases.filter(f => fasesVisiveis.includes(f.id)).map(fase => {
            const Icon = fase.icon;
            const isPrimary = fase.id === fasesVisiveis[0];
            return (
              <div key={fase.id} className={`rounded-xl border p-4 ${fase.borderCor} ${isPrimary ? fase.bgCor : "bg-muted/20"}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 ${fase.cor}`} />
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${fase.cor}`}>{fase.titulo}</h3>
                  {isPrimary && <Badge className="ml-auto text-[10px] bg-primary text-primary-foreground">Prioridade</Badge>}
                </div>
                <ul className="space-y-1.5">
                  {fase.items.map((item, i) => (
                    <li key={i} className="text-sm flex gap-2 items-start">
                      <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${fase.cor}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Projeção de Resultados */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Projeção de Resultados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Conversões</TableHead>
                <TableHead>Faturamento Est.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projecao.map(p => (
                <TableRow key={p.mes}>
                  <TableCell className="font-medium">{p.mes}</TableCell>
                  <TableCell>{p.leads}</TableCell>
                  <TableCell>{p.conversoes}</TableCell>
                  <TableCell className="font-semibold text-primary">{p.faturamento}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Entregas do Projeto */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Entregas Recomendadas
            <Badge variant="outline" className="ml-auto text-[10px]">Nível {nivel}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {entregas.map((e, i) => (
              <li key={i} className="text-sm flex gap-2 items-start">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {e}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-4 italic">
            Estas entregas podem ser adicionadas à Calculadora de Propostas para gerar o orçamento.
          </p>
        </CardContent>
      </Card>

      {/* Justificativa Técnica */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider">📄 Justificativa Técnica</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Com base no diagnóstico realizado, identificamos que a {empresa} se encontra no nível <strong>{nivel}</strong> de maturidade digital ({pontuacao}%).
            Os principais gargalos estão em{" "}
            {gargalos.slice(0, 2).join(" e ").toLowerCase() || "áreas identificadas"}, que podem ser resolvidos com as entregas propostas.
            A projeção conservadora indica ROI positivo a partir do 3º mês de operação, com escala progressiva nos meses seguintes.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

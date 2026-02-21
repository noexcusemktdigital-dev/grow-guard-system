import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target, TrendingUp, Lightbulb, CheckCircle2, Package } from "lucide-react";

const projecaoMock = [
  { mes: "Mês 1", leads: 15, conversoes: 2, faturamento: "R$ 8.000" },
  { mes: "Mês 3", leads: 35, conversoes: 6, faturamento: "R$ 22.000" },
  { mes: "Mês 6", leads: 60, conversoes: 12, faturamento: "R$ 48.000" },
  { mes: "Mês 12", leads: 120, conversoes: 28, faturamento: "R$ 112.000" },
];

const planoAcaoMock = [
  "Diagnóstico completo e alinhamento de expectativas com o cliente",
  "Setup de ferramentas, canais prioritários e CRM",
  "Criação de conteúdo e campanhas iniciais com foco em quick wins",
  "Otimização contínua com base em métricas e dados de performance",
  "Escala e expansão de canais com aumento progressivo de investimento",
];

function getEntregasPorNivel(nivel: string): string[] {
  if (nivel === "Inicial") {
    return [
      "Branding completo (Logo + Manual de Marca)",
      "Site institucional com SEO",
      "Gestão de redes sociais (Artes + Programação)",
      "Configuração CRM + Funil de vendas",
      "Gestão de Tráfego Meta (Facebook/Instagram)",
    ];
  }
  if (nivel === "Intermediário") {
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

  return (
    <>
      {/* Plano de Ação */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Plano de Ação Recomendado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {planoAcaoMock.map((item, i) => (
              <li key={i} className="text-sm flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
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
              {projecaoMock.map(p => (
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

      {/* Como Bater a Meta */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" /> Como Bater a Meta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Com base no diagnóstico realizado ({pontuacao}% — nível {nivel}), a {empresa} precisa priorizar
            a resolução dos seguintes gargalos: {gargalos.slice(0, 3).join(", ").toLowerCase() || "pontos identificados"}.
            Recomendamos uma estratégia integrada focando nos primeiros 90 dias para gerar quick wins e
            validar o modelo antes de escalar. O investimento em tráfego pago deve ser progressivo,
            iniciando com testes e otimizando conforme os dados de conversão.
          </p>
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
            Com base no diagnóstico realizado, identificamos que a {empresa} possui potencial significativo de crescimento
            através de uma estratégia integrada de marketing digital. Os principais gargalos estão em{" "}
            {gargalos.slice(0, 2).join(" e ").toLowerCase() || "áreas identificadas"}, que podem ser resolvidos com as entregas propostas.
            A projeção conservadora indica ROI positivo a partir do 3º mês de operação.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

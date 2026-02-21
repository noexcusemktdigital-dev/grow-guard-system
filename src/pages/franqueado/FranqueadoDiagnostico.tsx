import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ClipboardCheck, FileText, ChevronRight, BarChart3, AlertTriangle, Lightbulb } from "lucide-react";
import { getDiagnosticoPerguntas, getDiagnosticosNOE, getFranqueadoLeads, DiagnosticoNOEPergunta } from "@/data/franqueadoData";
import { toast } from "sonner";

function calcularPontuacao(respostas: Record<number, string>, perguntas: DiagnosticoNOEPergunta[]): number {
  let totalPeso = 0;
  let totalPontos = 0;
  perguntas.forEach(p => {
    totalPeso += p.peso;
    const r = respostas[p.id];
    if (!r) return;
    if (p.tipo === "sim_nao") {
      totalPontos += r === "Sim" ? p.peso : 0;
    } else if (p.opcoes) {
      const idx = p.opcoes.indexOf(r);
      const max = p.opcoes.length - 1;
      if (idx >= 0 && max > 0) totalPontos += (idx / max) * p.peso;
    }
  });
  return totalPeso > 0 ? Math.round((totalPontos / totalPeso) * 100) : 0;
}

function getNivel(pontuacao: number): { label: string; color: string } {
  if (pontuacao <= 40) return { label: "Inicial", color: "bg-red-500" };
  if (pontuacao <= 70) return { label: "Intermediário", color: "bg-yellow-500" };
  return { label: "Avançado", color: "bg-green-500" };
}

function gerarGargalos(respostas: Record<number, string>, perguntas: DiagnosticoNOEPergunta[]): string[] {
  const gargalos: string[] = [];
  perguntas.forEach(p => {
    const r = respostas[p.id];
    if (!r) return;
    if (p.tipo === "sim_nao" && r === "Não") gargalos.push(p.pergunta.replace("?", ""));
    if (p.opcoes) {
      const idx = p.opcoes.indexOf(r);
      if (idx >= 0 && idx <= 1) gargalos.push(`${p.pergunta.replace("?", "")}: ${r}`);
    }
  });
  return gargalos.slice(0, 5);
}

const recomendacoesMock = [
  "Implementar automação de marketing para reduzir CAC",
  "Estruturar funil de vendas com CRM integrado",
  "Investir em tráfego pago segmentado por persona",
  "Criar processo de nutrição de leads por e-mail",
  "Definir metas SMART com acompanhamento semanal",
];

export default function FranqueadoDiagnostico() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadIdParam = searchParams.get("leadId");

  const perguntas = getDiagnosticoPerguntas();
  const diagnosticosExistentes = getDiagnosticosNOE();
  const leads = getFranqueadoLeads();

  const leadPreenchido = leads.find(l => l.id === leadIdParam);
  const diagnosticoExistente = diagnosticosExistentes.find(d => d.leadId === leadIdParam);

  const [clienteNome, setClienteNome] = useState(leadPreenchido?.nome || "");
  const [clienteEmpresa, setClienteEmpresa] = useState(leadPreenchido?.empresa || "");
  const [respostas, setRespostas] = useState<Record<number, string>>(diagnosticoExistente?.respostas || {});
  const [concluido, setConcluido] = useState(!!diagnosticoExistente);

  const blocos = [...new Set(perguntas.map(p => p.bloco))];
  const progresso = (Object.keys(respostas).length / perguntas.length) * 100;

  const pontuacao = useMemo(() => calcularPontuacao(respostas, perguntas), [respostas, perguntas]);
  const nivel = getNivel(pontuacao);
  const gargalos = useMemo(() => gerarGargalos(respostas, perguntas), [respostas, perguntas]);

  const setResposta = (id: number, val: string) => setRespostas(prev => ({ ...prev, [id]: val }));

  const finalizar = () => {
    if (!clienteNome.trim()) { toast.error("Informe o nome do cliente"); return; }
    setConcluido(true);
    toast.success("Diagnóstico NOE concluído!");
  };

  // ── RESULTADO ──
  if (concluido) {
    const pontuacaoFinal = diagnosticoExistente?.pontuacao ?? pontuacao;
    const nivelFinal = diagnosticoExistente ? getNivel(diagnosticoExistente.pontuacao) : nivel;
    const gargalosFinal = diagnosticoExistente?.gargalos ?? gargalos;
    const recomendacoesFinal = diagnosticoExistente?.recomendacoes ?? recomendacoesMock;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader title="Diagnóstico NOE — Resultado" subtitle={`${clienteNome} — ${clienteEmpresa}`}
          actions={
            <Button variant="outline" size="sm" onClick={() => { setConcluido(false); if (!diagnosticoExistente) { setRespostas({}); setClienteNome(""); setClienteEmpresa(""); } }}>
              {diagnosticoExistente ? "Voltar ao formulário" : "Novo Diagnóstico"}
            </Button>
          }
        />

        {/* Pontuação */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl font-bold">{pontuacaoFinal}%</span>
                  <Badge className={`${nivelFinal.color} text-white`}>{nivelFinal.label}</Badge>
                </div>
                <Progress value={pontuacaoFinal} className="h-3" />
              </div>
            </div>

            {/* Detalhes por bloco */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {blocos.map(bloco => {
                const pergBloco = perguntas.filter(p => p.bloco === bloco);
                const pontBloco = calcularPontuacao(respostas, pergBloco);
                const nvl = getNivel(pontBloco);
                return (
                  <div key={bloco} className="text-center p-3 rounded-xl bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">{bloco}</p>
                    <p className="text-lg font-bold">{pontBloco}%</p>
                    <div className={`w-2 h-2 rounded-full ${nvl.color} mx-auto mt-1`} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Gargalos */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Principais Gargalos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {gargalosFinal.map((g, i) => (
                <li key={i} className="text-sm flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  {g}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recomendações */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" /> Recomendações Estratégicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recomendacoesFinal.map((r, i) => (
                <li key={i} className="text-sm flex gap-2 items-start">
                  <span className="text-primary font-bold">{i + 1}.</span>
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Respostas */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Respostas Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            {blocos.map(bloco => (
              <div key={bloco} className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">{bloco}</h3>
                {perguntas.filter(p => p.bloco === bloco).map(p => (
                  <div key={p.id} className="flex justify-between py-2 border-b border-border/50 text-sm">
                    <span className="text-muted-foreground">{p.pergunta}</span>
                    <span className="font-medium">{respostas[p.id] || "—"}</span>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button size="sm"><FileText className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/franqueado/propostas?leadId=${leadIdParam || ""}&diagnosticoId=${diagnosticoExistente?.id || "new"}`)}>
            <ChevronRight className="w-4 h-4 mr-1" /> Gerar Proposta
          </Button>
        </div>
      </div>
    );
  }

  // ── FORMULÁRIO ──
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Diagnóstico NOE" subtitle="Formulário estruturado de diagnóstico do cliente" />

      <Card className="glass-card">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Nome do Cliente *</label><Input value={clienteNome} onChange={e => setClienteNome(e.target.value)} placeholder="Nome completo" /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Empresa</label><Input value={clienteEmpresa} onChange={e => setClienteEmpresa(e.target.value)} placeholder="Nome da empresa" /></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Progress value={progresso} className="flex-1 h-2" />
        <span className="text-xs text-muted-foreground">{Math.round(progresso)}%</span>
      </div>

      {blocos.map(bloco => (
        <Card key={bloco} className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">{bloco}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {perguntas.filter(p => p.bloco === bloco).map(p => (
              <div key={p.id}>
                <label className="text-sm font-medium mb-2 block">{p.pergunta}</label>
                {p.tipo === "sim_nao" ? (
                  <div className="flex gap-2">
                    {["Sim", "Não"].map(opt => (
                      <Button key={opt} variant={respostas[p.id] === opt ? "default" : "outline"} size="sm" onClick={() => setResposta(p.id, opt)}>{opt}</Button>
                    ))}
                  </div>
                ) : (
                  <Select value={respostas[p.id] || ""} onValueChange={v => setResposta(p.id, v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {p.opcoes?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Preview de maturidade em tempo real */}
      {Object.keys(respostas).length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{pontuacao}%</p>
              <Badge className={`${nivel.color} text-white text-[10px]`}>{nivel.label}</Badge>
            </div>
            <div className="flex-1">
              <Progress value={pontuacao} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Maturidade em tempo real</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={finalizar} className="w-full" size="lg">
        <ClipboardCheck className="w-4 h-4 mr-2" /> Finalizar Diagnóstico
      </Button>
    </div>
  );
}

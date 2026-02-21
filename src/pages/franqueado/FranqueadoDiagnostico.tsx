import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ClipboardCheck, FileText, ChevronRight } from "lucide-react";
import { getDiagnosticoPerguntas } from "@/data/franqueadoData";
import { toast } from "sonner";

export default function FranqueadoDiagnostico() {
  const perguntas = getDiagnosticoPerguntas();
  const [clienteNome, setClienteNome] = useState("");
  const [clienteEmpresa, setClienteEmpresa] = useState("");
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [concluido, setConcluido] = useState(false);

  const progresso = (Object.keys(respostas).length / perguntas.length) * 100;
  const secoes = [...new Set(perguntas.map(p => p.secao))];

  const setResposta = (id: number, val: string) => setRespostas(prev => ({ ...prev, [id]: val }));

  const finalizar = () => {
    if (!clienteNome.trim()) { toast.error("Informe o nome do cliente"); return; }
    setConcluido(true);
    toast.success("Diagnóstico concluído!");
  };

  if (concluido) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader title="Diagnóstico Concluído" subtitle={`${clienteNome} — ${clienteEmpresa}`}
          actions={<Button variant="outline" size="sm" onClick={() => { setConcluido(false); setRespostas({}); setClienteNome(""); setClienteEmpresa(""); }}>Novo Diagnóstico</Button>}
        />
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="font-semibold">Relatório gerado com sucesso</p>
                <p className="text-xs text-muted-foreground">{Object.keys(respostas).length} respostas registradas</p>
              </div>
            </div>
            {secoes.map(secao => (
              <div key={secao} className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">{secao}</h3>
                {perguntas.filter(p => p.secao === secao).map(p => (
                  <div key={p.id} className="flex justify-between py-2 border-b border-border/50 text-sm">
                    <span className="text-muted-foreground">{p.pergunta}</span>
                    <span className="font-medium">{respostas[p.id] || "—"}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="flex gap-2 mt-6">
              <Button size="sm"><FileText className="w-4 h-4 mr-1" /> Exportar PDF</Button>
              <Button size="sm" variant="outline"><ChevronRight className="w-4 h-4 mr-1" /> Gerar Proposta</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Diagnóstico Maiar" subtitle="Formulário estruturado de diagnóstico do cliente" />

      <Card className="glass-card">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome do Cliente *</label>
              <Input value={clienteNome} onChange={e => setClienteNome(e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Empresa</label>
              <Input value={clienteEmpresa} onChange={e => setClienteEmpresa(e.target.value)} placeholder="Nome da empresa" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Progress value={progresso} className="flex-1 h-2" />
        <span className="text-xs text-muted-foreground">{Math.round(progresso)}%</span>
      </div>

      {secoes.map(secao => (
        <Card key={secao} className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">{secao}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {perguntas.filter(p => p.secao === secao).map(p => (
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

      <Button onClick={finalizar} className="w-full" size="lg">
        <ClipboardCheck className="w-4 h-4 mr-2" /> Finalizar Diagnóstico
      </Button>
    </div>
  );
}

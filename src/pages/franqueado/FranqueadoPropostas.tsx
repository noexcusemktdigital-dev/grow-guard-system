import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  FileText, Download, ArrowLeft, FileCheck2, Plus, Target,
  Calculator, TrendingUp, BarChart3, CheckCircle2,
} from "lucide-react";
import { getFranqueadoPropostas, getDiagnosticosNOE, getFranqueadoLeads, FranqueadoProposta } from "@/data/franqueadoData";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  rascunho: "text-muted-foreground border-muted-foreground/30",
  enviada: "text-blue-600 dark:text-blue-400 border-blue-400/30",
  aceita: "text-green-600 dark:text-green-400 border-green-400/30",
  recusada: "text-red-600 dark:text-red-400 border-red-400/30",
};

const entregasDisponiveis = [
  { id: "mkt", label: "Marketing Digital", valor: 1500 },
  { id: "seo", label: "SEO", valor: 1200 },
  { id: "trafego", label: "Tráfego Pago", valor: 2000 },
  { id: "redes", label: "Gestão de Redes", valor: 1800 },
  { id: "crm", label: "CRM", valor: 800 },
  { id: "branding", label: "Branding", valor: 2500 },
  { id: "consultoria", label: "Consultoria", valor: 3000 },
];

const projecaoMock = [
  { mes: "Mês 1", leads: 15, conversoes: 2, faturamento: "R$ 8.000" },
  { mes: "Mês 3", leads: 35, conversoes: 6, faturamento: "R$ 22.000" },
  { mes: "Mês 6", leads: 60, conversoes: 12, faturamento: "R$ 48.000" },
  { mes: "Mês 12", leads: 120, conversoes: 28, faturamento: "R$ 112.000" },
];

export default function FranqueadoPropostas() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadIdParam = searchParams.get("leadId");
  const diagnosticoIdParam = searchParams.get("diagnosticoId");

  const [propostas, setPropostas] = useState(() => getFranqueadoPropostas());
  const diagnosticos = getDiagnosticosNOE();
  const leads = getFranqueadoLeads();
  const diagnostico = diagnosticos.find(d => d.id === diagnosticoIdParam || d.leadId === leadIdParam);
  const lead = leads.find(l => l.id === leadIdParam);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProposta, setDialogProposta] = useState<FranqueadoProposta | null>(null);

  // Calculadora
  const [entregasSelecionadas, setEntregasSelecionadas] = useState<string[]>(["mkt", "seo"]);
  const [valorBase, setValorBase] = useState(0);
  const [valorBaseManual, setValorBaseManual] = useState(false);
  const [excedente, setExcedente] = useState(0);
  const [recorrencia, setRecorrencia] = useState("mensal");
  const [prazo, setPrazo] = useState("12");
  const [emissor, setEmissor] = useState<"franqueado" | "matriz">("franqueado");

  const valorCalculado = useMemo(() => {
    return entregasSelecionadas.reduce((s, id) => s + (entregasDisponiveis.find(e => e.id === id)?.valor || 0), 0);
  }, [entregasSelecionadas]);

  const valorFinal = valorBaseManual ? valorBase : valorCalculado;
  const valorTotal = valorFinal + excedente;
  const repasse20 = valorFinal * 0.2;
  const projecaoUnidade = repasse20 + (emissor === "franqueado" ? excedente : excedente * 0.2);
  const impacto12 = projecaoUnidade * 12;

  const toggleEntrega = (id: string) => {
    setEntregasSelecionadas(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const selected = propostas.find(p => p.id === selectedId);

  function openConvertDialog(proposta: FranqueadoProposta) {
    setDialogProposta(proposta);
    setDialogOpen(true);
  }

  function handleConverterContrato() {
    if (!dialogProposta) return;
    setDialogOpen(false);
    toast.success("Contrato ativado com sucesso!");
    navigate("/franqueado/contratos?novo=CT-novo");
  }

  function handleGerarProposta() {
    const nome = lead?.nome || "Novo Cliente";
    const newProposta: FranqueadoProposta = {
      id: `P-${Date.now()}`,
      clienteNome: nome,
      valor: valorFinal,
      valorExcedente: excedente,
      emissorExcedente: emissor,
      tipo: "Recorrente",
      prazo,
      status: "rascunho",
      criadaEm: new Date().toISOString().split("T")[0],
      validaAte: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      servicos: entregasSelecionadas.map(id => entregasDisponiveis.find(e => e.id === id)?.label || id),
      leadId: leadIdParam || undefined,
    };
    setPropostas(prev => [...prev, newProposta]);
    toast.success("Proposta gerada com sucesso!");
  }

  // ── DETALHE DA PROPOSTA ──
  if (selected) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader title={`Proposta ${selected.id}`} subtitle={selected.clienteNome}
          actions={<Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>}
        />
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-semibold">{selected.clienteNome}</p></div>
              <div><p className="text-xs text-muted-foreground">Valor Base</p><p className="font-semibold text-primary">R$ {selected.valor.toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Excedente</p><p className="font-semibold">{selected.valorExcedente ? `R$ ${selected.valorExcedente.toLocaleString()}` : "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline" className={statusColors[selected.status]}>{selected.status}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Tipo</p><p className="font-semibold">{selected.tipo || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Válida até</p><p className="font-semibold">{selected.validaAte}</p></div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Serviços</p>
              <div className="flex flex-wrap gap-2">{selected.servicos.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-border flex-wrap">
              <Button size="sm"><Download className="w-4 h-4 mr-1" /> Exportar PDF</Button>
              {selected.status === "aceita" && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openConvertDialog(selected)}>
                  <FileCheck2 className="w-4 h-4 mr-1" /> Converter em Contrato
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Converter em Contrato</DialogTitle>
              <DialogDescription>Confirme os dados para criar o contrato automaticamente.</DialogDescription>
            </DialogHeader>
            {dialogProposta && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-semibold">{dialogProposta.clienteNome}</p></div>
                <div><p className="text-xs text-muted-foreground">Valor Base</p><p className="font-semibold">R$ {dialogProposta.valor.toLocaleString()}</p></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleConverterContrato}><FileCheck2 className="w-4 h-4 mr-1" /> Criar Contrato</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Gerador de Proposta" subtitle="Crie propostas baseadas no Diagnóstico NOE" />

      <Tabs defaultValue={diagnostico ? "estrategia" : "calculadora"}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="estrategia"><Target className="w-4 h-4 mr-1" /> Estratégia</TabsTrigger>
          <TabsTrigger value="calculadora"><Calculator className="w-4 h-4 mr-1" /> Calculadora</TabsTrigger>
        </TabsList>

        {/* ── ABA ESTRATÉGIA ── */}
        <TabsContent value="estrategia" className="space-y-6">
          {diagnostico ? (
            <>
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" /> Diagnóstico: {diagnostico.leadNome}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl font-bold">{diagnostico.pontuacao}%</span>
                    <Badge className={`${diagnostico.nivel === "Avançado" ? "bg-green-500" : diagnostico.nivel === "Intermediário" ? "bg-yellow-500" : "bg-red-500"} text-white`}>
                      {diagnostico.nivel}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{diagnostico.empresa}</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">🎯 Objetivos Identificados</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {diagnostico.recomendacoes.map((r, i) => (
                      <li key={i} className="text-sm flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />{r}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">📋 Plano de Ação Recomendado</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="text-sm">1. Diagnóstico completo e alinhamento de expectativas</li>
                    <li className="text-sm">2. Setup de ferramentas e canais prioritários</li>
                    <li className="text-sm">3. Criação de conteúdo e campanhas iniciais</li>
                    <li className="text-sm">4. Otimização contínua com base em métricas</li>
                    <li className="text-sm">5. Escala e expansão de canais</li>
                  </ul>
                </CardContent>
              </Card>

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

              <Card className="glass-card">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">📄 Justificativa Técnica</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Com base no diagnóstico realizado, identificamos que a {diagnostico.empresa} possui potencial significativo de crescimento
                    através de uma estratégia integrada de marketing digital. Os principais gargalos estão em
                    {diagnostico.gargalos.slice(0, 2).join(" e ").toLowerCase()}, que podem ser resolvidos com as entregas propostas.
                    A projeção conservadora indica ROI positivo a partir do 3º mês de operação.
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">Nenhum diagnóstico vinculado. Acesse via CRM ou Diagnóstico NOE.</p>
                <Button variant="outline" onClick={() => navigate("/franqueado/diagnostico")}>Ir para Diagnóstico NOE</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── ABA CALCULADORA ── */}
        <TabsContent value="calculadora" className="space-y-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Entregas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {entregasDisponiveis.map(e => (
                  <label key={e.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-colors">
                    <Checkbox checked={entregasSelecionadas.includes(e.id)} onCheckedChange={() => toggleEntrega(e.id)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{e.label}</p>
                      <p className="text-xs text-muted-foreground">R$ {e.valor.toLocaleString()}/mês</p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">Valores</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={valorBaseManual} onCheckedChange={(v) => { setValorBaseManual(!!v); if (!v) setValorBase(0); }} />
                  Valor base manual
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Valor Base (R$)</Label>
                  <Input type="number" value={valorBaseManual ? valorBase : valorCalculado} onChange={e => setValorBase(Number(e.target.value))} disabled={!valorBaseManual} />
                  {!valorBaseManual && <p className="text-[10px] text-muted-foreground mt-1">Calculado pelas entregas: R$ {valorCalculado.toLocaleString()}</p>}
                </div>
                <div><Label>Excedente (R$)</Label><Input type="number" value={excedente} onChange={e => setExcedente(Number(e.target.value))} /></div>
                <div>
                  <Label>Recorrência</Label>
                  <Select value={recorrencia} onValueChange={setRecorrencia}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prazo</Label>
                  <Select value={prazo} onValueChange={setPrazo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 meses</SelectItem>
                      <SelectItem value="12">12 meses</SelectItem>
                      <SelectItem value="18">18 meses</SelectItem>
                      <SelectItem value="24">24 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Emissor da cobrança</Label>
                  <Select value={emissor} onValueChange={v => setEmissor(v as "franqueado" | "matriz")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="franqueado">Franqueado (100% excedente seu)</SelectItem>
                      <SelectItem value="matriz">Matriz (20% excedente para matriz)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo financeiro */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Resumo Financeiro</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="text-lg font-bold">R$ {valorTotal.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Repasse 20%</p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">R$ {repasse20.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Projeção Unidade</p>
                  <p className="text-lg font-bold text-primary">R$ {projecaoUnidade.toLocaleString()}/mês</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Impacto 12 meses</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">R$ {impacto12.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={handleGerarProposta}>
            <FileText className="w-4 h-4 mr-2" /> Gerar Proposta
          </Button>
        </TabsContent>
      </Tabs>

      {/* Lista de propostas existentes */}
      <Card className="glass-card mt-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider">Propostas Existentes</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {propostas.map(p => (
              <TableRow key={p.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedId(p.id)}>
                <TableCell className="font-medium">{p.id}</TableCell>
                <TableCell>{p.clienteNome}</TableCell>
                <TableCell className="font-semibold">R$ {p.valor.toLocaleString()}</TableCell>
                <TableCell><Badge variant="outline" className={statusColors[p.status]}>{p.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{p.criadaEm}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><FileText className="w-4 h-4" /></Button>
                  {p.status === "aceita" && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 dark:text-green-400" onClick={(e) => { e.stopPropagation(); openConvertDialog(p); }} title="Converter em Contrato">
                      <FileCheck2 className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog Converter */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Converter em Contrato</DialogTitle>
            <DialogDescription>Confirme os dados para criar o contrato automaticamente.</DialogDescription>
          </DialogHeader>
          {dialogProposta && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-semibold">{dialogProposta.clienteNome}</p></div>
              <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-semibold">R$ {dialogProposta.valor.toLocaleString()}</p></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleConverterContrato}><FileCheck2 className="w-4 h-4 mr-1" /> Criar Contrato</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

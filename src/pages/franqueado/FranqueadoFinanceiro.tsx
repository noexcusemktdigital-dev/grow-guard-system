import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/KpiCard";
import { AlertCard } from "@/components/AlertCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DollarSign, ArrowRightLeft, Receipt, TrendingUp, Wallet, Calculator, CreditCard, BarChart3,
  Download, FileSpreadsheet, Info
} from "lucide-react";
import {
  getFranqueadoFinanceiro, getFranqueadoEntradas, getFranqueadoSaidas,
  getFranqueadoFechamentos, getFranqueadoAlertasFinanceiros, getFranqueadoReceitaMensal
} from "@/data/franqueadoData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const categoriaSaida = ["Todas", "Pessoas", "Estrutura", "Marketing", "Ferramentas", "Outros"] as const;

export default function FranqueadoFinanceiro() {
  const fin = getFranqueadoFinanceiro();
  const entradas = getFranqueadoEntradas();
  const [saidas] = useState(() => getFranqueadoSaidas());
  const fechamentos = getFranqueadoFechamentos();
  const alertas = getFranqueadoAlertasFinanceiros();
  const receitaMensal = getFranqueadoReceitaMensal();
  const [catFilter, setCatFilter] = useState<string>("Todas");

  const saidasFiltradas = catFilter === "Todas" ? saidas : saidas.filter(s => s.categoria === catFilter);
  const totalEntradas = entradas.reduce((s, e) => s + e.valorFinalFranqueado, 0);
  const totalSaidas = saidasFiltradas.reduce((s, e) => s + e.valor, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Financeiro Unidade" subtitle="Acompanhamento financeiro completo da sua unidade" />

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="entradas">Entradas</TabsTrigger>
          <TabsTrigger value="saidas">Saídas</TabsTrigger>
          <TabsTrigger value="fechamentos">Fechamentos</TabsTrigger>
        </TabsList>

        {/* ── ABA 1: DASHBOARD ── */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Receita Bruta" value={`R$ ${fin.receitaBruta.toLocaleString()}`} icon={DollarSign} delay={0} variant="accent" />
            <KpiCard label="Repasse (20%)" value={`R$ ${fin.repasse.toLocaleString()}`} icon={ArrowRightLeft} delay={1} />
            <KpiCard label="Excedente Gerado" value={`R$ ${fin.excedenteGerado.toLocaleString()}`} icon={TrendingUp} delay={2} />
            <KpiCard label="Excedente Emitido por Você" value={`R$ ${fin.excedenteEmitido.toLocaleString()}`} icon={Wallet} delay={3} />
            <KpiCard label="Valor Líquido Estimado" value={`R$ ${fin.valorLiquidoEstimado.toLocaleString()}`} icon={Calculator} delay={4} variant="accent" />
            <KpiCard label="Royalties (1%)" value={`R$ ${fin.royalties.toLocaleString()}`} icon={Receipt} delay={5} />
            <KpiCard label="Sistema Mensalidade" value={`R$ ${fin.sistemaMensalidade.toLocaleString()}`} icon={CreditCard} delay={6} />
            <KpiCard label="Resultado Estimado" value={`R$ ${fin.resultadoEstimado.toLocaleString()}`} icon={BarChart3} delay={7} variant="accent" />
          </div>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Receita vs Repasse — Últimos 6 meses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={receitaMensal}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="mes" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString()}`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }} />
                    <Legend />
                    <Bar dataKey="receita" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="repasse" name="Repasse" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {alertas.length > 0 && (
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Alertas Financeiros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alertas.map((a, i) => <AlertCard key={i} type={a.tipo} message={a.mensagem} />)}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── ABA 2: ENTRADAS ── */}
        <TabsContent value="entradas" className="space-y-4">
          <Card className="glass-card p-3 flex items-start gap-2 border-primary/20 bg-primary/5">
            <Info className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong>Lógica do excedente:</strong> Se você emitir a cobrança, 100% do excedente é seu. Se a matriz emitir, 20% do excedente vai para a matriz.
            </p>
          </Card>
          <Card className="glass-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor Contrato</TableHead>
                  <TableHead>20% Repasse</TableHead>
                  <TableHead>Excedente</TableHead>
                  <TableHead>Cobrança</TableHead>
                  <TableHead>Recebido</TableHead>
                  <TableHead>Seu Valor</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entradas.map(e => (
                  <TableRow key={e.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{e.clienteNome}</TableCell>
                    <TableCell><Badge variant="outline">{e.tipo}</Badge></TableCell>
                    <TableCell>R$ {e.valorContrato.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">R$ {e.repasseValor.toLocaleString()}</TableCell>
                    <TableCell>{e.excedente > 0 ? `R$ ${e.excedente.toLocaleString()}` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={e.emissorExcedente === "franqueado" ? "default" : "secondary"} className="text-xs">
                        {e.statusCobranca}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.recebido ? "default" : "destructive"} className={e.recebido ? "bg-green-500/20 text-green-400 border-green-400/30" : ""}>
                        {e.recebido ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">R$ {e.valorFinalFranqueado.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{e.data}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/20 font-semibold">
                  <TableCell colSpan={7} className="text-right">Total Franqueado:</TableCell>
                  <TableCell className="text-primary">R$ {totalEntradas.toLocaleString()}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── ABA 3: SAIDAS ── */}
        <TabsContent value="saidas" className="space-y-4">
          <Card className="glass-card p-3 flex items-start gap-2 border-muted-foreground/20 bg-muted/30">
            <Info className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">Gestão interna da unidade — não interfere no financeiro da matriz.</p>
          </Card>
          <div className="flex gap-2 flex-wrap">
            {categoriaSaida.map(cat => (
              <Button key={cat} size="sm" variant={catFilter === cat ? "default" : "outline"} onClick={() => setCatFilter(cat)}>
                {cat}
              </Button>
            ))}
          </div>
          <Card className="glass-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Mês</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saidasFiltradas.map(s => (
                  <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{s.descricao}</TableCell>
                    <TableCell>{s.tipo}</TableCell>
                    <TableCell className="font-semibold">R$ {s.valor.toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{s.categoria}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{s.mes}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "Pago" ? "default" : s.status === "Pendente" ? "destructive" : "secondary"}
                        className={s.status === "Pago" ? "bg-green-500/20 text-green-400 border-green-400/30" : ""}>
                        {s.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/20 font-semibold">
                  <TableCell colSpan={2} className="text-right">Total:</TableCell>
                  <TableCell>R$ {totalSaidas.toLocaleString()}</TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── ABA 4: FECHAMENTOS (DRE) ── */}
        <TabsContent value="fechamentos" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Fechamentos Mensais (DRE)</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead>Repasse</TableHead>
                  <TableHead>Excedente Franq.</TableHead>
                  <TableHead>Royalties</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Valor Líquido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fechamentos.map(f => (
                  <TableRow key={f.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{f.mes}</TableCell>
                    <TableCell className="font-semibold">R$ {f.receita.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">R$ {f.repasse.toLocaleString()}</TableCell>
                    <TableCell className="text-primary">R$ {f.excedenteFranqueado.toLocaleString()}</TableCell>
                    <TableCell>R$ {f.royalties.toLocaleString()}</TableCell>
                    <TableCell>R$ {f.sistema.toLocaleString()}</TableCell>
                    <TableCell className="font-semibold">R$ {f.valorLiquido.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        f.status === "Pago" ? "bg-green-500/20 text-green-400 border-green-400/30" :
                        f.status === "Disponível" ? "bg-blue-500/20 text-blue-400 border-blue-400/30" :
                        "bg-yellow-500/20 text-yellow-400 border-yellow-400/30"
                      }>
                        {f.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Download PDF">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Download Excel">
                        <FileSpreadsheet className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

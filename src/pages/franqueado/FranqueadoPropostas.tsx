import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  FileText, Download, ArrowLeft, FileCheck2, Target,
  Calculator, TrendingUp, BarChart3, CheckCircle2,
  Palette, Share2, Zap, Globe, Database, ChevronDown, ChevronUp,
  ArrowRight, Minus, Plus,
} from "lucide-react";
import { getFranqueadoPropostas, getDiagnosticosNOE, getFranqueadoLeads, FranqueadoProposta } from "@/data/franqueadoData";
import { toast } from "sonner";

// ── TIPOS ──
type ServicoNOE = {
  id: string;
  nome: string;
  tipo: "unitario" | "mensal";
  descricao: string;
  valor: number;
};

type ModuloNOE = {
  id: string;
  nome: string;
  descricao: string;
  icone: "palette" | "share2" | "zap" | "globe" | "database";
  servicos: ServicoNOE[];
};

const iconeMap = {
  palette: Palette,
  share2: Share2,
  zap: Zap,
  globe: Globe,
  database: Database,
};

// ── DADOS DOS MÓDULOS NOE ──
const modulosNOE: ModuloNOE[] = [
  {
    id: "branding", nome: "Branding", descricao: "Identidade visual e materiais de marca", icone: "palette",
    servicos: [
      { id: "b1", nome: "Logo + Manual de Marca", tipo: "unitario", descricao: "Criação de logotipo profissional com manual de identidade visual completo, incluindo paleta de cores, tipografia e regras de uso.", valor: 3500 },
      { id: "b2", nome: "Material de Marca", tipo: "unitario", descricao: "Cartões de visita, papel timbrado, assinatura de e-mail e papelaria completa.", valor: 1500 },
      { id: "b3", nome: "Mídia Off", tipo: "unitario", descricao: "Banners, folders, flyers, outdoors e materiais impressos.", valor: 1200 },
      { id: "b4", nome: "Naming", tipo: "unitario", descricao: "Definição de nome para marca, produto ou serviço, com pesquisa de disponibilidade.", valor: 2000 },
      { id: "b5", nome: "Registro INPI", tipo: "unitario", descricao: "Acompanhamento e registro da marca junto ao INPI.", valor: 1800 },
      { id: "b6", nome: "Ebook", tipo: "unitario", descricao: "Ebook profissional com design, diagramação e conteúdo estratégico.", valor: 2500 },
      { id: "b7", nome: "Apresentação Comercial", tipo: "unitario", descricao: "Design de apresentação profissional com storytelling e identidade visual.", valor: 1800 },
    ],
  },
  {
    id: "social", nome: "Social Media", descricao: "Conteúdo orgânico e gestão de redes sociais", icone: "share2",
    servicos: [
      { id: "s1", nome: "Artes / Criativos Orgânicos", tipo: "mensal", descricao: "Criação mensal de artes para feed, stories e carrossel.", valor: 1500 },
      { id: "s2", nome: "Vídeos / Reels", tipo: "mensal", descricao: "Produção mensal de vídeos curtos e reels com edição profissional.", valor: 2000 },
      { id: "s3", nome: "Programação Meta", tipo: "mensal", descricao: "Agendamento e publicação no Facebook e Instagram.", valor: 800 },
      { id: "s4", nome: "Programação LinkedIn", tipo: "mensal", descricao: "Agendamento e publicação no LinkedIn.", valor: 800 },
      { id: "s5", nome: "Programação TikTok", tipo: "mensal", descricao: "Agendamento e publicação no TikTok.", valor: 800 },
      { id: "s6", nome: "Programação YouTube", tipo: "mensal", descricao: "Agendamento e publicação no YouTube.", valor: 800 },
      { id: "s7", nome: "Capa de Destaques", tipo: "unitario", descricao: "Capas profissionais para destaques do Instagram.", valor: 500 },
      { id: "s8", nome: "Criação de Avatar", tipo: "unitario", descricao: "Avatar personalizado para redes sociais.", valor: 400 },
      { id: "s9", nome: "Template Canva", tipo: "unitario", descricao: "Templates editáveis no Canva para criação autônoma.", valor: 600 },
      { id: "s10", nome: "Edição de Vídeo YouTube", tipo: "unitario", descricao: "Edição profissional com cortes, transições, legendas e thumbnail.", valor: 1200 },
    ],
  },
  {
    id: "performance", nome: "Performance", descricao: "Gestão de tráfego pago e campanhas", icone: "zap",
    servicos: [
      { id: "p1", nome: "Gestão de Tráfego Meta", tipo: "mensal", descricao: "Gestão completa de campanhas no Facebook e Instagram Ads.", valor: 2000 },
      { id: "p2", nome: "Gestão de Tráfego Google", tipo: "mensal", descricao: "Gestão completa de campanhas no Google Ads.", valor: 2000 },
      { id: "p3", nome: "Gestão de Tráfego LinkedIn", tipo: "mensal", descricao: "Gestão de campanhas no LinkedIn Ads para B2B.", valor: 2500 },
      { id: "p4", nome: "Gestão de Tráfego TikTok", tipo: "mensal", descricao: "Gestão de campanhas no TikTok Ads.", valor: 1800 },
      { id: "p5", nome: "Configuração Google Meu Negócio", tipo: "unitario", descricao: "Setup completo do perfil no Google Meu Negócio.", valor: 800 },
      { id: "p6", nome: "Artes de Campanha", tipo: "mensal", descricao: "Criativos exclusivos para campanhas de tráfego pago.", valor: 1000 },
      { id: "p7", nome: "Vídeos de Campanha", tipo: "mensal", descricao: "Vídeos para campanhas de tráfego pago com foco em conversão.", valor: 1500 },
    ],
  },
  {
    id: "web", nome: "Web", descricao: "Sites, landing pages e e-commerce", icone: "globe",
    servicos: [
      { id: "w1", nome: "Página de Site + SEO", tipo: "unitario", descricao: "Site institucional com otimização SEO on-page e design responsivo.", valor: 3000 },
      { id: "w2", nome: "Landing Page Link na Bio", tipo: "unitario", descricao: "Landing page otimizada para link na bio do Instagram.", valor: 800 },
      { id: "w3", nome: "Landing Page VSL", tipo: "unitario", descricao: "Landing page com Video Sales Letter para conversão.", valor: 1500 },
      { id: "w4", nome: "Landing Page Vendas", tipo: "unitario", descricao: "Landing page de vendas com copywriting persuasivo.", valor: 2000 },
      { id: "w5", nome: "Landing Page Captura", tipo: "unitario", descricao: "Landing page focada em captura de leads.", valor: 1200 },
      { id: "w6", nome: "Landing Page Ebook", tipo: "unitario", descricao: "Landing page para download de ebook.", valor: 1000 },
      { id: "w7", nome: "Alterar Contato", tipo: "unitario", descricao: "Alteração de informações de contato em site existente.", valor: 200 },
      { id: "w8", nome: "Alterar Seção", tipo: "unitario", descricao: "Modificação de uma seção específica do site.", valor: 400 },
      { id: "w9", nome: "E-commerce WooCommerce", tipo: "unitario", descricao: "Loja virtual completa com WooCommerce.", valor: 5000 },
    ],
  },
  {
    id: "dados", nome: "Dados / CRM", descricao: "Configuração de CRM e automações", icone: "database",
    servicos: [
      { id: "d1", nome: "Configuração CRM + Acompanhamento RD Station", tipo: "unitario", descricao: "Setup completo do RD Station CRM com funis e automações.", valor: 3000 },
      { id: "d2", nome: "Fluxo/Funil - Etapas de venda + roteiro comercial", tipo: "unitario", descricao: "Fluxo de vendas estruturado com roteiro e scripts.", valor: 2000 },
    ],
  },
];

const allServicos = modulosNOE.flatMap(m => m.servicos);

const statusColors: Record<string, string> = {
  rascunho: "text-muted-foreground border-muted-foreground/30",
  enviada: "text-blue-600 dark:text-blue-400 border-blue-400/30",
  aceita: "text-green-600 dark:text-green-400 border-green-400/30",
  recusada: "text-red-600 dark:text-red-400 border-red-400/30",
};

const projecaoMock = [
  { mes: "Mês 1", leads: 15, conversoes: 2, faturamento: "R$ 8.000" },
  { mes: "Mês 3", leads: 35, conversoes: 6, faturamento: "R$ 22.000" },
  { mes: "Mês 6", leads: 60, conversoes: 12, faturamento: "R$ 48.000" },
  { mes: "Mês 12", leads: 120, conversoes: 28, faturamento: "R$ 112.000" },
];

// ── COMPONENTE DE SERVIÇO COM QUANTIDADE ──
function ServicoItem({ servico, ativo, quantidade, onToggle, onQuantidadeChange }: {
  servico: ServicoNOE; ativo: boolean; quantidade: number;
  onToggle: () => void; onQuantidadeChange: (q: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${ativo ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/30"}`}>
      <Switch checked={ativo} onCheckedChange={onToggle} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{servico.nome}</span>
          <Badge variant={servico.tipo === "mensal" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
            {servico.tipo === "mensal" ? "Mensal" : "Unitário"}
          </Badge>
        </div>
        <p className={`text-xs text-muted-foreground mt-1 ${expanded ? "" : "line-clamp-1"}`}>
          {servico.descricao}
        </p>
        <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-primary hover:underline mt-0.5 flex items-center gap-0.5">
          {expanded ? <><ChevronUp className="w-3 h-3" /> Menos</> : <><ChevronDown className="w-3 h-3" /> Mais detalhes</>}
        </button>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-xs font-semibold text-primary">
          R$ {(servico.valor * quantidade).toLocaleString()}
        </span>
        {ativo && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onQuantidadeChange(Math.max(1, quantidade - 1))}>
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-xs font-medium w-6 text-center">{quantidade}</span>
            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onQuantidadeChange(quantidade + 1)}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── WIZARD STEPS ──
const STEPS = ["Serviços", "Valores & Excedente", "Resumo"];

// ── COMPONENTE PRINCIPAL ──
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

  // Wizard
  const [wizardStep, setWizardStep] = useState(0);

  // Calculadora
  const [servicosSelecionados, setServicosSelecionados] = useState<Record<string, number>>({});
  const [valorBase, setValorBase] = useState(0);
  const [valorBaseManual, setValorBaseManual] = useState(false);
  const [excedente, setExcedente] = useState(0);
  const [recorrencia, setRecorrencia] = useState("mensal");
  const [prazo, setPrazo] = useState("12");
  const [emissor, setEmissor] = useState<"franqueado" | "matriz">("franqueado");

  const servicosAtivos = Object.entries(servicosSelecionados).filter(([, q]) => q > 0);

  const valorCalculado = useMemo(() => {
    return servicosAtivos.reduce((s, [id, qty]) => s + (allServicos.find(e => e.id === id)?.valor || 0) * qty, 0);
  }, [servicosAtivos]);

  const valorFinal = valorBaseManual ? valorBase : valorCalculado;
  const valorTotal = valorFinal + excedente;
  const repasse20 = valorFinal * 0.2;
  const projecaoUnidade = repasse20 + (emissor === "franqueado" ? excedente : excedente * 0.2);
  const impacto12 = projecaoUnidade * 12;

  const toggleServico = (id: string) => {
    setServicosSelecionados(prev => {
      const next = { ...prev };
      if (next[id] && next[id] > 0) { delete next[id]; } else { next[id] = 1; }
      return next;
    });
  };

  const setQuantidade = (id: string, qty: number) => {
    if (qty <= 0) {
      setServicosSelecionados(prev => { const next = { ...prev }; delete next[id]; return next; });
    } else {
      setServicosSelecionados(prev => ({ ...prev, [id]: qty }));
    }
  };

  const servicosSelecionadosData = servicosAtivos.map(([id, qty]) => ({
    ...allServicos.find(s => s.id === id)!,
    quantidade: qty,
  }));

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
      servicos: servicosSelecionadosData.map(s => `${s.nome}${s.quantidade > 1 ? ` (x${s.quantidade})` : ""}`),
      leadId: leadIdParam || undefined,
    };
    setPropostas(prev => [...prev, newProposta]);
    setWizardStep(0);
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

        {/* ── ABA CALCULADORA — WIZARD ── */}
        <TabsContent value="calculadora" className="space-y-6">

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <button
                  onClick={() => setWizardStep(i)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    i === wizardStep ? "bg-primary text-primary-foreground" :
                    i < wizardStep ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
                    {i < wizardStep ? "✓" : i + 1}
                  </span>
                  {step}
                </button>
                {i < STEPS.length - 1 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>

          {/* ── STEP 1: SERVIÇOS ── */}
          {wizardStep === 0 && (
            <>
              <Accordion type="multiple" className="space-y-3">
                {modulosNOE.map(modulo => {
                  const Icon = iconeMap[modulo.icone];
                  const qtdAtivos = modulo.servicos.filter(s => servicosSelecionados[s.id] > 0).length;
                  return (
                    <AccordionItem key={modulo.id} value={modulo.id} className="border-none">
                      <AccordionTrigger className="hover:no-underline rounded-xl px-4 py-3 bg-destructive/90 text-destructive-foreground hover:bg-destructive transition-colors [&[data-state=open]]:rounded-b-none">
                        <div className="flex items-center gap-3 flex-1">
                          <Icon className="w-5 h-5" />
                          <div className="text-left">
                            <span className="font-bold text-sm">{modulo.nome}</span>
                            <p className="text-[11px] opacity-80 font-normal">{modulo.descricao}</p>
                          </div>
                          {qtdAtivos > 0 && (
                            <Badge className="ml-auto mr-2 bg-white/20 text-white border-0 text-[10px]">
                              {qtdAtivos} selecionado{qtdAtivos > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="border border-t-0 border-border rounded-b-xl p-0">
                        <div className="divide-y divide-border">
                          {modulo.servicos.map(servico => (
                            <div key={servico.id} className="px-4 py-0">
                              <ServicoItem
                                servico={servico}
                                ativo={(servicosSelecionados[servico.id] || 0) > 0}
                                quantidade={servicosSelecionados[servico.id] || 1}
                                onToggle={() => toggleServico(servico.id)}
                                onQuantidadeChange={(q) => setQuantidade(servico.id, q)}
                              />
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>

              {/* Mini resumo fixo */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{servicosAtivos.length} serviço{servicosAtivos.length !== 1 ? "s" : ""} selecionado{servicosAtivos.length !== 1 ? "s" : ""}</p>
                    <p className="text-lg font-bold text-primary">R$ {valorCalculado.toLocaleString()}</p>
                  </div>
                  <Button onClick={() => setWizardStep(1)} disabled={servicosAtivos.length === 0}>
                    Próximo <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── STEP 2: VALORES & EXCEDENTE ── */}
          {wizardStep === 1 && (
            <>
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
                      {!valorBaseManual && <p className="text-[10px] text-muted-foreground mt-1">Calculado pelos serviços: R$ {valorCalculado.toLocaleString()}</p>}
                    </div>
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
                    <div>
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

              <Card className="glass-card border-orange-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    💰 Excedente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Valor cobrado acima do contrato base. Se o <strong>franqueado emite</strong>, retém 100%. Se a <strong>matriz emite</strong>, retém 80% (20% para matriz).
                  </p>
                  <div>
                    <Label>Excedente (R$)</Label>
                    <Input type="number" value={excedente} onChange={e => setExcedente(Number(e.target.value))} />
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

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setWizardStep(0)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button className="flex-1" onClick={() => setWizardStep(2)}>
                  Próximo <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {/* ── STEP 3: RESUMO ── */}
          {wizardStep === 2 && (
            <>
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">
                    Serviços Selecionados ({servicosSelecionadosData.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {servicosSelecionadosData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum serviço selecionado</p>
                  ) : (
                    <div className="space-y-2">
                      {servicosSelecionadosData.map(s => (
                        <div key={s.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            <span>{s.nome}</span>
                            {s.quantidade > 1 && <Badge variant="outline" className="text-[9px] px-1 py-0">x{s.quantidade}</Badge>}
                            <Badge variant="outline" className="text-[9px] px-1 py-0">{s.tipo === "mensal" ? "Mensal" : "Unit."}</Badge>
                          </div>
                          <span className="font-semibold text-primary">R$ {(s.valor * s.quantidade).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-sm pt-2 font-bold border-t border-border">
                        <span>Total dos serviços</span>
                        <span className="text-primary">R$ {valorCalculado.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">Configuração</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><p className="text-xs text-muted-foreground">Valor Base</p><p className="font-semibold">R$ {valorFinal.toLocaleString()}</p></div>
                    <div><p className="text-xs text-muted-foreground">Excedente</p><p className="font-semibold">R$ {excedente.toLocaleString()}</p></div>
                    <div><p className="text-xs text-muted-foreground">Recorrência</p><p className="font-semibold capitalize">{recorrencia}</p></div>
                    <div><p className="text-xs text-muted-foreground">Prazo</p><p className="font-semibold">{prazo} meses</p></div>
                    <div><p className="text-xs text-muted-foreground">Emissor</p><p className="font-semibold capitalize">{emissor}</p></div>
                    <div><p className="text-xs text-muted-foreground">Valor Total</p><p className="font-semibold text-primary">R$ {valorTotal.toLocaleString()}</p></div>
                  </div>
                </CardContent>
              </Card>

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

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setWizardStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button className="flex-1" size="lg" onClick={handleGerarProposta}>
                  <FileText className="w-4 h-4 mr-2" /> Gerar Proposta
                </Button>
              </div>
            </>
          )}
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

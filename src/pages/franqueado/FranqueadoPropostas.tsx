import { useState, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  FileText, Download, ArrowLeft, FileCheck2,
  Calculator, CheckCircle2,
  Palette, Share2, Zap, Globe, Database, ChevronDown, ChevronUp,
  ArrowRight, Minus, Plus, Clock,
} from "lucide-react";
import { getFranqueadoPropostas, getFranqueadoLeads, FranqueadoProposta } from "@/data/franqueadoData";
import { toast } from "sonner";

// ── TIPOS ──
type TipoQuantidade = "single" | "quantity" | "package" | "youtube_time";

type ServicoNOE = {
  id: string;
  nome: string;
  tipo: "unitario" | "mensal";
  descricao: string;
  preco: number;
  tipoQuantidade: TipoQuantidade;
  pacotes?: number[];
  minQuantidade?: number;
  maxQuantidade?: number;
  unidade?: string;
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

// ── DADOS DOS MÓDULOS NOE (valores exatos da referência) ──
const modulosNOE: ModuloNOE[] = [
  {
    id: "branding", nome: "Branding", descricao: "Identidade visual e materiais de marca", icone: "palette",
    servicos: [
      { id: "b1", nome: "Logo + Manual de Marca", tipo: "unitario", descricao: "Criação de logotipo profissional com manual de identidade visual completo.", preco: 2500, tipoQuantidade: "single" },
      { id: "b2", nome: "Material de Marca", tipo: "unitario", descricao: "Cartões de visita, papel timbrado, assinatura de e-mail e papelaria.", preco: 200, tipoQuantidade: "quantity", minQuantidade: 1, maxQuantidade: 50, unidade: "peça" },
      { id: "b3", nome: "Mídia Off", tipo: "unitario", descricao: "Banners, folders, flyers, outdoors e materiais impressos.", preco: 200, tipoQuantidade: "quantity", minQuantidade: 1, maxQuantidade: 50, unidade: "peça" },
      { id: "b4", nome: "Naming", tipo: "unitario", descricao: "Definição de nome para marca, produto ou serviço.", preco: 1500, tipoQuantidade: "single" },
      { id: "b5", nome: "Registro INPI", tipo: "unitario", descricao: "Acompanhamento e registro da marca junto ao INPI.", preco: 3500, tipoQuantidade: "single" },
      { id: "b6", nome: "Ebook", tipo: "unitario", descricao: "Ebook profissional com design, diagramação e conteúdo estratégico.", preco: 0, tipoQuantidade: "single" },
      { id: "b7", nome: "Apresentação Comercial", tipo: "unitario", descricao: "Design de apresentação profissional com storytelling.", preco: 0, tipoQuantidade: "single" },
    ],
  },
  {
    id: "social", nome: "Social Media", descricao: "Conteúdo orgânico e gestão de redes sociais", icone: "share2",
    servicos: [
      { id: "s1", nome: "Artes (Criativos Orgânicos)", tipo: "mensal", descricao: "Criação mensal de artes para feed, stories e carrossel.", preco: 85, tipoQuantidade: "package", pacotes: [2, 4, 6, 8, 10, 12], unidade: "arte" },
      { id: "s2", nome: "Vídeos (Reels)", tipo: "mensal", descricao: "Produção mensal de vídeos curtos e reels com edição profissional.", preco: 150, tipoQuantidade: "package", pacotes: [2, 4, 6, 8, 10, 12], unidade: "vídeo" },
      { id: "s3", nome: "Programação Meta", tipo: "mensal", descricao: "Agendamento e publicação no Facebook e Instagram.", preco: 100, tipoQuantidade: "quantity", minQuantidade: 1, maxQuantidade: 10, unidade: "conta" },
      { id: "s4", nome: "Programação LinkedIn", tipo: "mensal", descricao: "Agendamento e publicação no LinkedIn.", preco: 100, tipoQuantidade: "quantity", minQuantidade: 1, maxQuantidade: 10, unidade: "conta" },
      { id: "s5", nome: "Programação TikTok", tipo: "mensal", descricao: "Agendamento e publicação no TikTok.", preco: 100, tipoQuantidade: "quantity", minQuantidade: 1, maxQuantidade: 10, unidade: "conta" },
      { id: "s6", nome: "Programação YouTube", tipo: "mensal", descricao: "Agendamento e publicação no YouTube.", preco: 100, tipoQuantidade: "quantity", minQuantidade: 1, maxQuantidade: 10, unidade: "conta" },
      { id: "s7", nome: "Capa de Destaques", tipo: "unitario", descricao: "Capas profissionais para destaques do Instagram.", preco: 100, tipoQuantidade: "single" },
      { id: "s8", nome: "Criação de Avatar", tipo: "unitario", descricao: "Avatar personalizado para redes sociais.", preco: 20, tipoQuantidade: "single" },
      { id: "s9", nome: "Template Canva", tipo: "unitario", descricao: "Templates editáveis no Canva para criação autônoma.", preco: 100, tipoQuantidade: "single" },
      { id: "s10", nome: "Edição de Vídeo YouTube", tipo: "unitario", descricao: "Edição profissional com cortes, transições, legendas e thumbnail. Preço calculado por tempo.", preco: 250, tipoQuantidade: "youtube_time", unidade: "min" },
    ],
  },
  {
    id: "performance", nome: "Performance", descricao: "Gestão de tráfego pago e campanhas", icone: "zap",
    servicos: [
      { id: "p1", nome: "Gestão de Tráfego Meta", tipo: "mensal", descricao: "Gestão completa de campanhas no Facebook e Instagram Ads.", preco: 900, tipoQuantidade: "quantity", minQuantidade: 1, maxQuantidade: 10, unidade: "conta" },
      { id: "p2", nome: "Gestão de Tráfego Google (inclui YouTube)", tipo: "mensal", descricao: "Gestão completa de campanhas no Google Ads.", preco: 900, tipoQuantidade: "quantity", minQuantidade: 1, maxQuantidade: 10, unidade: "conta" },
      { id: "p3", nome: "Gestão de Tráfego LinkedIn", tipo: "mensal", descricao: "Gestão de campanhas no LinkedIn Ads para B2B.", preco: 900, tipoQuantidade: "quantity", minQuantidade: 1, maxQuantidade: 10, unidade: "conta" },
      { id: "p4", nome: "Gestão de Tráfego TikTok", tipo: "mensal", descricao: "Gestão de campanhas no TikTok Ads.", preco: 900, tipoQuantidade: "quantity", minQuantidade: 1, maxQuantidade: 10, unidade: "conta" },
      { id: "p5", nome: "Configuração Google Meu Negócio", tipo: "unitario", descricao: "Setup completo do perfil no Google Meu Negócio.", preco: 450, tipoQuantidade: "single" },
      { id: "p6", nome: "Artes de Campanha", tipo: "mensal", descricao: "Criativos exclusivos para campanhas de tráfego pago.", preco: 85, tipoQuantidade: "package", pacotes: [2, 4, 6, 8, 10, 12], unidade: "arte" },
      { id: "p7", nome: "Vídeos de Campanha", tipo: "mensal", descricao: "Vídeos para campanhas de tráfego pago com foco em conversão.", preco: 150, tipoQuantidade: "package", pacotes: [2, 4, 6, 8, 10, 12], unidade: "vídeo" },
    ],
  },
  {
    id: "web", nome: "Web", descricao: "Sites, landing pages e e-commerce", icone: "globe",
    servicos: [
      { id: "w1", nome: "Página de Site + SEO", tipo: "unitario", descricao: "Site institucional com otimização SEO on-page e design responsivo.", preco: 850, tipoQuantidade: "quantity", minQuantidade: 3, maxQuantidade: 20, unidade: "página" },
      { id: "w2", nome: "Landing Page Link na Bio", tipo: "unitario", descricao: "Landing page otimizada para link na bio do Instagram.", preco: 800, tipoQuantidade: "single" },
      { id: "w3", nome: "Landing Page VSL", tipo: "unitario", descricao: "Landing page com Video Sales Letter para conversão.", preco: 1800, tipoQuantidade: "single" },
      { id: "w4", nome: "Landing Page Vendas", tipo: "unitario", descricao: "Landing page de vendas com copywriting persuasivo.", preco: 1600, tipoQuantidade: "single" },
      { id: "w5", nome: "Landing Page Captura", tipo: "unitario", descricao: "Landing page focada em captura de leads.", preco: 1600, tipoQuantidade: "quantity", minQuantidade: 1, maxQuantidade: 10, unidade: "LP" },
      { id: "w6", nome: "Landing Page Ebook", tipo: "unitario", descricao: "Landing page para download de ebook.", preco: 1600, tipoQuantidade: "single" },
      { id: "w7", nome: "Alterar Contato", tipo: "unitario", descricao: "Alteração de informações de contato em site existente.", preco: 50, tipoQuantidade: "quantity", minQuantidade: 1, maxQuantidade: 20, unidade: "alteração" },
      { id: "w8", nome: "Alterar Seção", tipo: "unitario", descricao: "Modificação de uma seção específica do site.", preco: 120, tipoQuantidade: "quantity", minQuantidade: 1, maxQuantidade: 20, unidade: "alteração" },
      { id: "w9", nome: "E-commerce WooCommerce", tipo: "unitario", descricao: "Loja virtual completa com WooCommerce.", preco: 4500, tipoQuantidade: "single" },
    ],
  },
  {
    id: "dados", nome: "Dados / CRM", descricao: "Configuração de CRM e automações", icone: "database",
    servicos: [
      { id: "d1", nome: "Configuração CRM + Acompanhamento (RD Station)", tipo: "unitario", descricao: "Setup completo do RD Station CRM com funis e automações.", preco: 1000, tipoQuantidade: "single" },
      { id: "d2", nome: "Fluxo/Funil (Etapas de venda + roteiro comercial)", tipo: "unitario", descricao: "Fluxo de vendas estruturado com roteiro e scripts.", preco: 600, tipoQuantidade: "single" },
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

// ── Cálculo de valor do serviço ──
function calcularValorServico(servico: ServicoNOE, quantidade: number, youtubeMinutos?: number): number {
  if (servico.tipoQuantidade === "single") return servico.preco;
  if (servico.tipoQuantidade === "youtube_time") {
    const mins = youtubeMinutos || 2;
    return servico.preco * Math.ceil(mins / 2);
  }
  return servico.preco * quantidade;
}

// ── Seleção state ──
type SelecaoServico = {
  quantidade: number;
  youtubeMinutos?: number;
};

// ── COMPONENTE DE SERVIÇO COM QUANTIDADE ──
function ServicoItem({ servico, ativo, selecao, onToggle, onSelecaoChange }: {
  servico: ServicoNOE;
  ativo: boolean;
  selecao: SelecaoServico;
  onToggle: () => void;
  onSelecaoChange: (s: SelecaoServico) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const valor = calcularValorServico(servico, selecao.quantidade, selecao.youtubeMinutos);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${ativo ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/30"}`}>
      <Switch checked={ativo} onCheckedChange={onToggle} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{servico.nome}</span>
          <Badge variant={servico.tipo === "mensal" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
            {servico.tipo === "mensal" ? "Mensal" : "Unitário"}
          </Badge>
          {servico.tipoQuantidade !== "single" && (
            <span className="text-[10px] text-muted-foreground">
              R$ {servico.preco.toLocaleString()}/{servico.unidade || "un"}
            </span>
          )}
        </div>
        <p className={`text-xs text-muted-foreground mt-1 ${expanded ? "" : "line-clamp-1"}`}>
          {servico.descricao}
        </p>
        <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-primary hover:underline mt-0.5 flex items-center gap-0.5">
          {expanded ? <><ChevronUp className="w-3 h-3" /> Menos</> : <><ChevronDown className="w-3 h-3" /> Mais detalhes</>}
        </button>

        {/* Controles de quantidade quando ativo */}
        {ativo && servico.tipoQuantidade === "package" && servico.pacotes && (
          <div className="mt-2">
            <Select value={String(selecao.quantidade)} onValueChange={v => onSelecaoChange({ ...selecao, quantidade: Number(v) })}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {servico.pacotes.map(p => (
                  <SelectItem key={p} value={String(p)}>{p} {servico.unidade || "un"}{p > 1 ? "s" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {ativo && servico.tipoQuantidade === "quantity" && (
          <div className="mt-2 flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onSelecaoChange({ ...selecao, quantidade: Math.max(servico.minQuantidade || 1, selecao.quantidade - 1) })}>
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-xs font-medium w-8 text-center">{selecao.quantidade} {servico.unidade || "un"}</span>
            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onSelecaoChange({ ...selecao, quantidade: Math.min(servico.maxQuantidade || 99, selecao.quantidade + 1) })}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        )}

        {ativo && servico.tipoQuantidade === "youtube_time" && (
          <div className="mt-2 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="number"
              className="h-8 w-20 text-xs"
              value={selecao.youtubeMinutos || 2}
              min={1}
              onChange={e => onSelecaoChange({ ...selecao, youtubeMinutos: Math.max(1, Number(e.target.value)) })}
            />
            <span className="text-xs text-muted-foreground">minutos (R$ {servico.preco}/2min)</span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-xs font-semibold text-primary">
          R$ {valor.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ── WIZARD STEPS ──
const STEPS = ["Serviços", "Investimento", "Proposta"];

// ── COMPONENTE PRINCIPAL ──
export default function FranqueadoPropostas() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadIdParam = searchParams.get("leadId");
  const propostaRef = useRef<HTMLDivElement>(null);

  const [propostas, setPropostas] = useState(() => getFranqueadoPropostas());
  const leads = getFranqueadoLeads();
  const lead = leads.find(l => l.id === leadIdParam);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProposta, setDialogProposta] = useState<FranqueadoProposta | null>(null);

  // Wizard
  const [wizardStep, setWizardStep] = useState(0);

  // Calculadora
  const [selecoes, setSelecoes] = useState<Record<string, SelecaoServico>>({});
  const [duracao, setDuracao] = useState<1 | 6 | 12>(12);
  const [formaPagamento, setFormaPagamento] = useState<"avista" | "3x" | "6x">("avista");
  const [nomeCliente, setNomeCliente] = useState(lead?.nome || "");

  const servicosAtivos = Object.entries(selecoes).filter(([, s]) => s.quantidade > 0);

  // Cálculo de totais
  const { totalUnitario, totalMensal } = useMemo(() => {
    let unit = 0, mensal = 0;
    servicosAtivos.forEach(([id, sel]) => {
      const servico = allServicos.find(s => s.id === id);
      if (!servico) return;
      const val = calcularValorServico(servico, sel.quantidade, sel.youtubeMinutos);
      if (servico.tipo === "unitario") unit += val;
      else mensal += val;
    });
    return { totalUnitario: unit, totalMensal: mensal };
  }, [servicosAtivos]);

  // Lógica de diluição NOE: unitário é diluído nos primeiros meses junto com o mensal
  const getPaymentDetails = useMemo(() => {
    const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

    // Duração 1 mês ou sem mensal: pagamento único
    if (duracao === 1) {
      return {
        label: "Pagamento Único",
        firstMonthsLabel: "Mês 1",
        firstMonthsValue: fmt(totalUnitario + totalMensal),
        afterMonthsLabel: totalMensal > 0 ? "Mês único" : "",
        afterMonthsValue: "",
        installments: 1,
      };
    }

    const installments = formaPagamento === "avista" ? 1 : formaPagamento === "3x" ? 3 : 6;
    const diluted = totalMensal + (totalUnitario / installments);
    const hasAfter = installments < duracao;

    if (formaPagamento === "avista") {
      return {
        label: "À Vista",
        firstMonthsLabel: "Mês 1",
        firstMonthsValue: fmt(Math.ceil(totalUnitario + totalMensal)),
        afterMonthsLabel: totalMensal > 0 ? "Mês 2+" : "Sem mensalidade após",
        afterMonthsValue: totalMensal > 0 ? fmt(totalMensal) : "",
        installments: 1,
      };
    }

    return {
      label: `${installments}x`,
      firstMonthsLabel: `Mês 1-${installments}`,
      firstMonthsValue: fmt(Math.ceil(diluted)),
      afterMonthsLabel: hasAfter
        ? (totalMensal > 0 ? `Mês ${installments + 1}+` : "Sem mensalidade após")
        : "",
      afterMonthsValue: hasAfter && totalMensal > 0 ? fmt(totalMensal) : "",
      installments,
    };
  }, [formaPagamento, totalUnitario, totalMensal, duracao]);

  const toggleServico = (id: string) => {
    setSelecoes(prev => {
      const next = { ...prev };
      if (next[id] && next[id].quantidade > 0) {
        delete next[id];
      } else {
        const servico = allServicos.find(s => s.id === id);
        const defaultQty = servico?.tipoQuantidade === "package" && servico.pacotes ? servico.pacotes[0] :
          servico?.minQuantidade || 1;
        next[id] = { quantidade: defaultQty, youtubeMinutos: 2 };
      }
      return next;
    });
  };

  const servicosSelecionadosData = servicosAtivos.map(([id, sel]) => {
    const servico = allServicos.find(s => s.id === id)!;
    return { ...servico, quantidade: sel.quantidade, youtubeMinutos: sel.youtubeMinutos, valorTotal: calcularValorServico(servico, sel.quantidade, sel.youtubeMinutos) };
  });

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

  async function handleBaixarPDF() {
    if (!propostaRef.current) return;
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `Proposta_${nomeCliente || "Cliente"}_${new Date().toISOString().split("T")[0]}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(propostaRef.current)
        .save();
      toast.success("PDF gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar PDF");
    }
  }

  function handleSalvarProposta() {
    const nome = nomeCliente || lead?.nome || "Novo Cliente";
    const newProposta: FranqueadoProposta = {
      id: `P-${Date.now()}`,
      clienteNome: nome,
      valor: totalUnitario + totalMensal,
      valorExcedente: 0,
      emissorExcedente: "franqueado",
      tipo: "Recorrente",
      prazo: String(duracao),
      status: "rascunho",
      criadaEm: new Date().toISOString().split("T")[0],
      validaAte: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      servicos: servicosSelecionadosData.map(s => `${s.nome}${s.quantidade > 1 ? ` (x${s.quantidade})` : ""}`),
      leadId: leadIdParam || undefined,
    };
    setPropostas(prev => [...prev, newProposta]);
    toast.success("Proposta salva com sucesso!");
  }

  // Agrupa serviços por módulo para a proposta
  const servicosAgrupados = useMemo(() => {
    return modulosNOE
      .map(m => ({
        ...m,
        servicosAtivos: servicosSelecionadosData.filter(s => m.servicos.some(ms => ms.id === s.id)),
      }))
      .filter(m => m.servicosAtivos.length > 0);
  }, [servicosSelecionadosData]);

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
              <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline" className={statusColors[selected.status]}>{selected.status}</Badge></div>
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

      <Tabs defaultValue="propostas">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="propostas"><FileText className="w-4 h-4 mr-1" /> Propostas</TabsTrigger>
          <TabsTrigger value="calculadora"><Calculator className="w-4 h-4 mr-1" /> Calculadora</TabsTrigger>
        </TabsList>

        {/* ── ABA PROPOSTAS ── */}
        <TabsContent value="propostas" className="space-y-6">
          <Card className="glass-card">
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
                {propostas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma proposta criada. Use a Calculadora para gerar uma proposta.
                    </TableCell>
                  </TableRow>
                ) : (
                  propostas.map(p => (
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
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
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
                  const qtdAtivos = modulo.servicos.filter(s => selecoes[s.id]?.quantidade > 0).length;
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
                                ativo={(selecoes[servico.id]?.quantidade || 0) > 0}
                                selecao={selecoes[servico.id] || { quantidade: servico.minQuantidade || 1, youtubeMinutos: 2 }}
                                onToggle={() => toggleServico(servico.id)}
                                onSelecaoChange={(s) => setSelecoes(prev => ({ ...prev, [servico.id]: s }))}
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
                    <p className="text-sm font-bold text-primary">Unit: R$ {totalUnitario.toLocaleString()}</p>
                    <p className="text-sm font-bold text-primary">Mensal: R$ {totalMensal.toLocaleString()}/mês</p>
                  </div>
                  <Button onClick={() => setWizardStep(1)} disabled={servicosAtivos.length === 0}>
                    Próximo <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── STEP 2: INVESTIMENTO ── */}
          {wizardStep === 1 && (
            <>
              <Card className="glass-card">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">Duração do Projeto</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 1 as const, label: "01 Mês", desc: "Entrega única" },
                      { value: 6 as const, label: "Semestral", desc: "6 meses de projeto" },
                      { value: 12 as const, label: "Anual", desc: "12 meses de projeto" },
                    ]).map(d => (
                      <button
                        key={d.value}
                        onClick={() => {
                          setDuracao(d.value);
                          if (d.value === 1) setFormaPagamento("avista");
                        }}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          duracao === d.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <p className="text-lg font-bold">{d.label}</p>
                        <p className="text-xs text-muted-foreground">{d.desc}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {duracao > 1 && (
                <Card className="glass-card">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">Forma de Pagamento do Setup</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">O valor unitário (setup) será diluído nos primeiros meses junto com o mensal.</p>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { value: "avista" as const, label: "À Vista", desc: "Setup no 1º mês" },
                        { value: "3x" as const, label: "3x", desc: "Setup diluído em 3 meses" },
                        { value: "6x" as const, label: "6x", desc: "Setup diluído em 6 meses" },
                      ]).map(fp => {
                        const installments = fp.value === "avista" ? 1 : fp.value === "3x" ? 3 : 6;
                        const diluted = totalMensal + (totalUnitario / installments);
                        return (
                          <button
                            key={fp.value}
                            onClick={() => setFormaPagamento(fp.value)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              formaPagamento === fp.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
                            }`}
                          >
                            <p className="text-lg font-bold">{fp.label}</p>
                            <p className="text-xs text-muted-foreground">{fp.desc}</p>
                            {totalUnitario > 0 && (
                              <div className="mt-2 pt-2 border-t border-border">
                                <p className="text-[10px] text-muted-foreground">
                                  {fp.value === "avista" ? "Mês 1" : `Mês 1-${installments}`}: <span className="font-semibold text-foreground">R$ {Math.ceil(diluted).toLocaleString()}</span>
                                </p>
                                {totalMensal > 0 && (
                                  <p className="text-[10px] text-muted-foreground">
                                    {fp.value === "avista" ? "Mês 2+" : `Mês ${installments + 1}+`}: <span className="font-semibold text-foreground">R$ {totalMensal.toLocaleString()}</span>
                                  </p>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Simulação */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Simulação de Investimento</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total Unitário (Setup)</p>
                      <p className="text-lg font-bold">R$ {totalUnitario.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total Mensal (Recorrência)</p>
                      <p className="text-lg font-bold">R$ {totalMensal.toLocaleString()}/mês</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Forma de Pagamento</p>
                      <p className="text-sm font-bold text-primary">{getPaymentDetails.label}</p>
                    </div>
                  </div>
                  {duracao > 1 && totalUnitario > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-3">
                      <div className="bg-background/50 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase">{getPaymentDetails.firstMonthsLabel}</p>
                        <p className="text-lg font-bold text-primary">{getPaymentDetails.firstMonthsValue}</p>
                      </div>
                      {getPaymentDetails.afterMonthsValue && (
                        <div className="bg-background/50 rounded-lg p-3 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">{getPaymentDetails.afterMonthsLabel}</p>
                          <p className="text-lg font-bold">{getPaymentDetails.afterMonthsValue}</p>
                        </div>
                      )}
                    </div>
                  )}
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

          {/* ── STEP 3: PROPOSTA ── */}
          {wizardStep === 2 && (
            <>
              <Card className="glass-card">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">Dados do Cliente</CardTitle></CardHeader>
                <CardContent>
                  <Label>Nome do Cliente</Label>
                  <Input value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} placeholder="Nome da empresa ou cliente" />
                </CardContent>
              </Card>

              {/* Preview da proposta */}
              <Card className="glass-card overflow-hidden">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold uppercase tracking-wider">Preview da Proposta</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div ref={propostaRef} className="bg-white text-gray-900 p-8 space-y-6" style={{ fontFamily: "Arial, sans-serif" }}>
                    {/* Cabeçalho */}
                    <div className="flex items-center justify-between border-b-2 border-red-600 pb-4">
                      <div>
                        <h1 className="text-2xl font-black text-red-600 tracking-tight">NOEXCUSE</h1>
                        <p className="text-xs text-gray-500">Marketing Digital</p>
                      </div>
                      <div className="text-right">
                        <h2 className="text-lg font-bold text-gray-800">Proposta Comercial</h2>
                        <p className="text-xs text-gray-500">{new Date().toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>

                    {/* Cliente */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Preparado para</p>
                      <p className="text-lg font-bold text-gray-800">{nomeCliente || "Cliente"}</p>
                    </div>

                    {/* Duração */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">Duração do Projeto:</span>
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">{duracao === 1 ? "Entrega Única" : `${duracao} meses`}</span>
                    </div>

                    {/* Serviços agrupados */}
                    {servicosAgrupados.map(grupo => (
                      <div key={grupo.id}>
                        <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">{grupo.nome}</h3>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-500 uppercase">
                              <th className="py-1">Serviço</th>
                              <th className="py-1">Tipo</th>
                              <th className="py-1 text-center">Qtd</th>
                              <th className="py-1 text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {grupo.servicosAtivos.map(s => (
                              <tr key={s.id} className="border-b border-gray-100">
                                <td className="py-1.5">{s.nome}</td>
                                <td className="py-1.5 text-gray-500">{s.tipo === "mensal" ? "Mensal" : "Unitário"}</td>
                                <td className="py-1.5 text-center">
                                  {s.tipoQuantidade === "single" ? "—" :
                                   s.tipoQuantidade === "youtube_time" ? `${s.youtubeMinutos || 2} min` :
                                   `${s.quantidade} ${s.unidade || "un"}`}
                                </td>
                                <td className="py-1.5 text-right font-semibold">R$ {s.valorTotal.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}

                    {/* Resumo Financeiro */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Resumo Financeiro</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-gray-500">Total Unitário (Setup):</span></div>
                        <div className="text-right font-semibold">R$ {totalUnitario.toLocaleString()}</div>
                        {totalMensal > 0 && (
                          <>
                            <div><span className="text-gray-500">Total Mensal (Recorrência):</span></div>
                            <div className="text-right font-semibold">R$ {totalMensal.toLocaleString()}/mês</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Investimento / Pagamento */}
                    <div className="bg-red-50 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-2">Investimento</h3>
                      <p className="text-sm">
                        <span className="font-semibold">Forma de pagamento:</span> {getPaymentDetails.label}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="text-gray-500">{getPaymentDetails.firstMonthsLabel}:</span>{" "}
                          <span className="font-bold text-gray-800">{getPaymentDetails.firstMonthsValue}</span>
                        </p>
                        {getPaymentDetails.afterMonthsValue && (
                          <p className="text-sm">
                            <span className="text-gray-500">{getPaymentDetails.afterMonthsLabel}:</span>{" "}
                            <span className="font-bold text-gray-800">{getPaymentDetails.afterMonthsValue}</span>
                          </p>
                        )}
                        {!getPaymentDetails.afterMonthsValue && totalMensal === 0 && duracao > 1 && (
                          <p className="text-sm text-gray-500 italic">Sem mensalidade após o pagamento do setup</p>
                        )}
                      </div>
                    </div>

                    {/* Rodapé */}
                    <div className="border-t-2 border-red-600 pt-3 text-center">
                      <p className="text-[10px] text-gray-400">Proposta gerada automaticamente pela Calculadora NOEXCUSE</p>
                      <p className="text-[10px] text-gray-400">Válida por 30 dias</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 flex-wrap">
                <Button variant="outline" onClick={() => setWizardStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button variant="outline" onClick={handleBaixarPDF}>
                  <Download className="w-4 h-4 mr-1" /> Baixar PDF
                </Button>
                <Button className="flex-1" size="lg" onClick={handleSalvarProposta}>
                  <FileText className="w-4 h-4 mr-2" /> Salvar Proposta
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Converter */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Converter em Contrato</DialogTitle>
            <DialogDescription>Confirme os dados para criar o contrato.</DialogDescription>
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

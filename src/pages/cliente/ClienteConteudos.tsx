import { useState } from "react";
import {
  FileText, Save, Edit3, Check, Plus, X, Sparkles, Copy,
  CheckCircle2, Calendar as CalendarIcon, ChevronDown, ChevronUp,
  BookOpen, Users, Eye, Shield, Lightbulb, Target, Download,
  FolderOpen, Clock, Megaphone,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

/* ── Base de Conhecimento sections ── */
interface KBSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  fields: { key: string; label: string; type: "text" | "textarea" | "list"; value: string }[];
}

const initialSections: KBSection[] = [
  {
    id: "negocio", title: "Sobre o Negócio", icon: <Target className="w-4 h-4" />,
    fields: [
      { key: "nicho", label: "Nicho de Atuação", type: "text", value: "Marketing Digital para Franquias" },
      { key: "publico", label: "Público-alvo", type: "textarea", value: "Empreendedores e gestores de franquias, 30-55 anos, buscando crescimento acelerado" },
      { key: "persona", label: "Persona", type: "textarea", value: "Carlos, 42 anos, dono de 3 unidades de franquia, quer escalar vendas com marketing digital" },
      { key: "tom", label: "Tom de Voz", type: "text", value: "Profissional, direto, inspirador" },
      { key: "proposta", label: "Proposta de Valor", type: "textarea", value: "Plataforma completa de gestão comercial e marketing para redes de franquias" },
    ],
  },
  {
    id: "concorrencia", title: "Concorrência", icon: <Users className="w-4 h-4" />,
    fields: [
      { key: "conc1", label: "Concorrente 1", type: "text", value: "FranquiaTech — foco em gestão operacional" },
      { key: "conc2", label: "Concorrente 2", type: "text", value: "RedeGrow — automação de marketing" },
      { key: "obs", label: "Observações", type: "textarea", value: "Nenhum concorrente integra vendas + marketing + IA em uma plataforma" },
    ],
  },
  {
    id: "referencias", title: "Referências", icon: <Eye className="w-4 h-4" />,
    fields: [
      { key: "perfis", label: "Perfis de Referência", type: "textarea", value: "@rockcontent, @resultadosdigitais, @neilpatel" },
      { key: "links", label: "Links de Referência", type: "textarea", value: "https://rockcontent.com/blog\nhttps://resultadosdigitais.com.br" },
    ],
  },
  {
    id: "pilares", title: "Pilares de Conteúdo", icon: <BookOpen className="w-4 h-4" />,
    fields: [
      { key: "pilares", label: "Temas e Categorias", type: "textarea", value: "1. Gestão de Franquias\n2. Marketing Digital\n3. Vendas e CRM\n4. Tecnologia e IA\n5. Cases de Sucesso" },
    ],
  },
  {
    id: "regras", title: "Regras e Restrições", icon: <Shield className="w-4 h-4" />,
    fields: [
      { key: "proibido", label: "O que NÃO pode ser dito", type: "textarea", value: "Não fazer promessas de resultado garantido\nNão citar concorrentes pelo nome em conteúdos" },
      { key: "obrigatorio", label: "Termos Obrigatórios", type: "text", value: "Sempre mencionar 'gestão integrada' e 'resultados mensuráveis'" },
    ],
  },
];

/* ── Monthly deliveries ── */
interface ContentPiece {
  id: string;
  title: string;
  script: string;
  format: string;
  network: string;
  funnel: string;
  approved: boolean;
}

interface MonthlyDelivery {
  id: string;
  month: string;
  label: string;
  createdAt: string;
  items: ContentPiece[];
}

const mockDeliveries: MonthlyDelivery[] = [
  {
    id: "feb-2026",
    month: "2026-02",
    label: "Fevereiro 2026",
    createdAt: "05/02/2026",
    items: [
      { id: "1", title: "5 Erros que Todo Franqueado Comete no Marketing", script: "ABERTURA: Você sabia que 78% dos franqueados cometem pelo menos um desses erros no marketing?\n\nERRO 1 — Não ter persona definida\nA maioria investe em anúncios sem saber exatamente quem quer atingir. Resultado: dinheiro jogado fora.\n\nERRO 2 — Ignorar o marketing local\nFranquias precisam de estratégia nacional E local. Adaptar campanhas para a região é essencial.\n\nERRO 3 — Não medir resultados\nSe você não sabe seu CAC, CPL e taxa de conversão, está voando às cegas.\n\nERRO 4 — Conteúdo genérico demais\nPostar frases motivacionais não gera leads. Conteúdo educativo e específico sim.\n\nERRO 5 — Não usar automação\nResponder leads manualmente em 2026? Automação é obrigação, não diferencial.\n\nCTA: Quer corrigir esses erros? Acesse o link na bio e agende uma consultoria gratuita.", format: "Carrossel", network: "Instagram", funnel: "Topo", approved: true },
      { id: "2", title: "Como Definir Metas de Vendas para Sua Franquia", script: "ROTEIRO DE POST:\n\nTítulo: Como Definir Metas de Vendas que Realmente Funcionam\n\nParágrafo 1: Metas vagas geram resultados vagos. Se sua meta é 'vender mais', você já começou errado.\n\nParágrafo 2: Use o método SMART:\n- Específica: 'Aumentar vendas da unidade Centro em 20%'\n- Mensurável: Acompanhe semanalmente no CRM\n- Atingível: Baseie-se no histórico dos últimos 3 meses\n- Relevante: Alinhada com o objetivo da rede\n- Temporal: Prazo de 90 dias\n\nParágrafo 3: Distribua a meta por vendedor e por canal (online vs presencial).\n\nCTA: Baixe nosso template gratuito de metas no link da bio.", format: "Feed", network: "LinkedIn", funnel: "Meio", approved: false },
      { id: "3", title: "Case: Franquia que Triplicou Leads com IA", script: "ROTEIRO REELS (60s):\n\n[0-5s] HOOK: 'Essa franquia triplicou seus leads em 90 dias. Quer saber como?'\n\n[5-15s] CONTEXTO: A Rede FastFood tinha 3 unidades e gerava em média 50 leads/mês por unidade.\n\n[15-30s] PROBLEMA: O time respondia leads manualmente, perdia oportunidades e não tinha visibilidade do funil.\n\n[30-45s] SOLUÇÃO: Implementaram nossa plataforma com IA para qualificação automática, CRM integrado e campanhas segmentadas.\n\n[45-55s] RESULTADO: Em 90 dias — 150 leads/mês por unidade, 40% de taxa de conversão, ROI de 8x.\n\n[55-60s] CTA: 'Quer o mesmo resultado? Link na bio.'", format: "Reels", network: "Instagram", funnel: "Fundo", approved: true },
      { id: "4", title: "O Poder do CRM para Redes de Franquias", script: "POST EDUCATIVO:\n\nSe você gerencia uma rede de franquias sem CRM, está perdendo dinheiro todos os dias.\n\nVeja o que um CRM inteligente faz por você:\n\n1. Centraliza todos os leads de todas as unidades\n2. Automatiza follow-ups (ninguém esquece de responder)\n3. Mostra em tempo real qual unidade está performando\n4. Identifica gargalos no funil de vendas\n5. Gera relatórios automáticos para a franqueadora\n\nO resultado? Mais vendas, menos trabalho manual e visibilidade total da operação.\n\nNão é sobre tecnologia. É sobre não deixar dinheiro na mesa.\n\n#crm #franquias #vendas #gestao #marketing", format: "Feed", network: "Instagram", funnel: "Meio", approved: false },
      { id: "5", title: "Checklist: Marketing Digital para Franquias", script: "CARROSSEL (7 slides):\n\nSlide 1 — Capa: 'Checklist Completo: Marketing Digital para Franquias'\n\nSlide 2 — Fundamentos:\n[ ] Persona definida por unidade\n[ ] Identidade visual padronizada\n[ ] Presença em Google Meu Negócio\n\nSlide 3 — Conteúdo:\n[ ] Calendário editorial mensal\n[ ] 3 posts/semana mínimo\n[ ] Mix de formatos (feed, reels, stories)\n\nSlide 4 — Tráfego Pago:\n[ ] Pixel instalado\n[ ] Campanhas de captação ativas\n[ ] Remarketing configurado\n\nSlide 5 — CRM & Vendas:\n[ ] Leads centralizados\n[ ] Follow-up automatizado\n[ ] Pipeline visual configurado\n\nSlide 6 — Métricas:\n[ ] CAC calculado\n[ ] Taxa de conversão acompanhada\n[ ] ROI mensal medido\n\nSlide 7 — CTA: 'Salve este checklist e comece a implementar hoje!'", format: "Carrossel", network: "Instagram", funnel: "Topo", approved: false },
      { id: "6", title: "Depoimento: Como a Plataforma Mudou Minha Gestão", script: "REELS (45s):\n\n[0-3s] Texto na tela: 'Antes vs Depois da NoExcuse'\n\n[3-15s] Depoimento: 'Eu gerenciava tudo em planilha. Leads perdidos, equipe desalinhada, zero visibilidade. Eu não sabia se minha franquia dava lucro de verdade.'\n\n[15-30s] Transição: 'Depois de implementar a plataforma...'\n'Agora eu vejo todos os leads em tempo real, meu time recebe alertas automáticos, e eu sei exatamente quanto cada campanha retorna.'\n\n[30-40s] Resultado: 'Em 6 meses: 3x mais leads, 45% de conversão, e finalmente tenho tempo para estratégia.'\n\n[40-45s] CTA: 'Quer a mesma transformação? Link na bio.'", format: "Reels", network: "Instagram", funnel: "Fundo", approved: true },
      { id: "7", title: "3 Tendências de Marketing para Franquias em 2026", script: "POST LINKEDIN:\n\n3 tendências que vão dominar o marketing de franquias em 2026:\n\n1. IA Generativa para Conteúdo\nNão é mais sobre criar conteúdo manualmente. É sobre ter IA que entende sua marca e gera roteiros, artes e campanhas alinhados com sua identidade.\n\n2. Hiperlocalização\nCada unidade precisa de marketing adaptado à sua região. O mesmo anúncio não funciona em São Paulo e em Manaus.\n\n3. Automação do Funil Completo\nDo lead ao fechamento, sem intervenção manual. Qualificação por IA, nurturing automatizado e alertas inteligentes.\n\nQuem adotar essas tendências primeiro vai dominar o mercado.\n\nConcorda? Comenta sua visão.\n\n#marketing2026 #franquias #tendencias #ia #automacao", format: "Feed", network: "LinkedIn", funnel: "Topo", approved: false },
      { id: "8", title: "Agende Sua Demo Gratuita", script: "STORY SEQUENCE (3 stories):\n\nStory 1:\nTexto: 'Cansado de perder leads por falta de organização?'\nVisual: Fundo escuro, texto bold, emoji de interrogação\n\nStory 2:\nTexto: 'Nossa plataforma integra CRM + Marketing + IA em um só lugar'\nVisual: 3 ícones animados representando cada módulo\nPonto: Mostrar o diferencial de forma visual\n\nStory 3:\nTexto: 'Agende sua demo gratuita — link aqui'\nVisual: Botão de CTA grande, seta apontando para o link\nSticker: Countdown para fim da oferta", format: "Story", network: "Instagram", funnel: "Fundo", approved: false },
    ],
  },
  {
    id: "jan-2026",
    month: "2026-01",
    label: "Janeiro 2026",
    createdAt: "03/01/2026",
    items: [
      { id: "j1", title: "Ano Novo, Franquia Nova: Planejamento 2026", script: "POST COMPLETO:\n\nComeço de ano é o momento ideal para reestruturar o marketing da sua franquia.\n\nO que você precisa definir agora:\n\n1. Meta de leads por trimestre\n2. Orçamento de mídia paga mensal\n3. Calendário editorial Q1\n4. KPIs prioritários\n5. Ferramentas que vai adotar\n\nQuem planeja em janeiro, colhe o ano inteiro.\n\n#planejamento2026 #franquias #marketing", format: "Feed", network: "Instagram", funnel: "Topo", approved: true },
      { id: "j2", title: "Por que Franquias Precisam de Marketing Digital", script: "CARROSSEL (5 slides):\n\nSlide 1 — 'Por que sua franquia PRECISA de marketing digital'\n\nSlide 2 — '92% dos consumidores pesquisam online antes de comprar'\n\nSlide 3 — 'Franquias com presença digital forte geram 3x mais leads'\n\nSlide 4 — 'Marketing local + digital = combinação imbatível'\n\nSlide 5 — 'Comece hoje. Fale conosco.'", format: "Carrossel", network: "Instagram", funnel: "Topo", approved: true },
    ],
  },
];

const networkColors: Record<string, string> = {
  Instagram: "bg-pink-500/10 text-pink-500",
  LinkedIn: "bg-sky-500/10 text-sky-500",
  Facebook: "bg-blue-600/10 text-blue-600",
  TikTok: "bg-purple-500/10 text-purple-500",
};

const funnelColors: Record<string, string> = {
  Topo: "bg-primary/10 text-primary",
  Meio: "bg-chart-blue/10 text-chart-blue",
  Fundo: "bg-chart-green/10 text-chart-green",
};

export default function ClienteConteudos() {
  const [sections, setSections] = useState(initialSections);
  const [editing, setEditing] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState(mockDeliveries);
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);

  // Briefing fields
  const [bMes, setBMes] = useState("Março 2026");
  const [bObjetivo, setBObjetivo] = useState("");
  const [bTema, setBTema] = useState("");
  const [bPromocoes, setBPromocoes] = useState("");
  const [bDatas, setBDatas] = useState("");
  const [bDestaques, setBDestaques] = useState("");
  const [bPublico, setBPublico] = useState("");
  const [bTom, setBTom] = useState("");
  const [bFormatos, setBFormatos] = useState("");
  const [bQtd, setBQtd] = useState("10");
  const [bObs, setBObs] = useState("");

  const filledFields = sections.reduce((total, s) => total + s.fields.filter(f => f.value.trim()).length, 0);
  const totalFields = sections.reduce((total, s) => total + s.fields.length, 0);
  const kbProgress = Math.round((filledFields / totalFields) * 100);

  const updateField = (sectionId: string, fieldKey: string, value: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, fields: s.fields.map(f => f.key === fieldKey ? { ...f, value } : f) } : s));
  };

  const toggleApprove = (deliveryId: string, contentId: string) => {
    setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, items: d.items.map(i => i.id === contentId ? { ...i, approved: !i.approved } : i) } : d));
  };

  const handleGenerate = () => {
    setBriefOpen(false);
    toast({ title: "Conteúdos gerados com sucesso!", description: `${bQtd} roteiros completos criados para ${bMes}.` });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Conteúdos"
        subtitle="Base de conhecimento e geração mensal de roteiros"
        icon={<FileText className="w-5 h-5 text-primary" />}
      />

      <Tabs defaultValue="base">
        <TabsList>
          <TabsTrigger value="base" className="text-xs gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Base de Conhecimento</TabsTrigger>
          <TabsTrigger value="entregas" className="text-xs gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Entregas</TabsTrigger>
        </TabsList>

        {/* ═══ BASE DE CONHECIMENTO ═══ */}
        <TabsContent value="base" className="space-y-5 mt-4">
          <Card className="glass-card">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Preenchimento da Base</span>
                <span className="text-xs text-muted-foreground">{filledFields}/{totalFields} campos preenchidos</span>
              </div>
              <Progress value={kbProgress} className="h-2" />
            </CardContent>
          </Card>

          {sections.map(section => {
            const isEditing = editing === section.id;
            return (
              <Card key={section.id} className="glass-card">
                <CardContent className="py-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">{section.icon}</div>
                      <p className="text-sm font-bold">{section.title}</p>
                    </div>
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => {
                        if (isEditing) toast({ title: "Salvo com sucesso!" });
                        setEditing(isEditing ? null : section.id);
                      }}
                    >
                      {isEditing ? <><Check className="w-3.5 h-3.5" /> Salvar</> : <><Edit3 className="w-3.5 h-3.5" /> Editar</>}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {section.fields.map(field => (
                      <div key={field.key}>
                        <Label className="text-[11px] text-muted-foreground">{field.label}</Label>
                        {isEditing ? (
                          field.type === "textarea" ? (
                            <Textarea value={field.value} onChange={e => updateField(section.id, field.key, e.target.value)} rows={3} className="mt-1" />
                          ) : (
                            <Input value={field.value} onChange={e => updateField(section.id, field.key, e.target.value)} className="mt-1" />
                          )
                        ) : (
                          <p className="text-sm mt-1 whitespace-pre-line">{field.value || <span className="text-muted-foreground italic">Não preenchido</span>}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ═══ ENTREGAS ═══ */}
        <TabsContent value="entregas" className="space-y-5 mt-4">
          {/* Create button */}
          <Dialog open={briefOpen} onOpenChange={setBriefOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2 h-12 text-sm font-semibold">
                <Plus className="w-4 h-4" /> Nova Criação Mensal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> Briefing para Geração de Conteúdos
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <p className="text-xs text-muted-foreground">Preencha o briefing abaixo com as informações do mês. Quanto mais detalhado, melhores serão os roteiros gerados.</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Mês de Referência</Label>
                    <Input value={bMes} onChange={e => setBMes(e.target.value)} placeholder="Ex: Março 2026" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Quantidade de Conteúdos</Label>
                    <Input type="number" value={bQtd} onChange={e => setBQtd(e.target.value)} placeholder="10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Objetivo Principal do Mês</Label>
                  <Textarea value={bObjetivo} onChange={e => setBObjetivo(e.target.value)} placeholder="Ex: Gerar leads para o lançamento do novo módulo de IA" rows={2} />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Tema Central</Label>
                  <Input value={bTema} onChange={e => setBTema(e.target.value)} placeholder="Ex: Mês da Automação, Crescimento Inteligente..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Promoções e Ofertas</Label>
                    <Textarea value={bPromocoes} onChange={e => setBPromocoes(e.target.value)} placeholder="Ex: 30% off plano anual, bônus de onboarding..." rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Datas Comemorativas</Label>
                    <Textarea value={bDatas} onChange={e => setBDatas(e.target.value)} placeholder="Ex: Dia da Mulher (08/03), Dia do Consumidor (15/03)..." rows={2} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Destaques e Novidades</Label>
                  <Textarea value={bDestaques} onChange={e => setBDestaques(e.target.value)} placeholder="Ex: Novo recurso de IA, case de sucesso recente, evento..." rows={2} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Público-alvo Prioritário</Label>
                    <Input value={bPublico} onChange={e => setBPublico(e.target.value)} placeholder="Ex: Franqueados novos, prospects em fase de decisão" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Tom de Comunicação</Label>
                    <Select value={bTom} onValueChange={setBTom}>
                      <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="educativo">Educativo</SelectItem>
                        <SelectItem value="inspirador">Inspirador</SelectItem>
                        <SelectItem value="direto">Direto e Comercial</SelectItem>
                        <SelectItem value="storytelling">Storytelling</SelectItem>
                        <SelectItem value="misto">Misto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Formatos Desejados</Label>
                  <Input value={bFormatos} onChange={e => setBFormatos(e.target.value)} placeholder="Ex: Carrossel, Reels, Feed, Story, Artigo" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Observações Adicionais</Label>
                  <Textarea value={bObs} onChange={e => setBObs(e.target.value)} placeholder="Informações extras que ajudem na criação dos conteúdos..." rows={3} />
                </div>

                <Button className="w-full gap-2 h-11" onClick={handleGenerate}>
                  <Sparkles className="w-4 h-4" /> Gerar Conteúdos do Mês
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Deliveries month by month */}
          {deliveries.map(delivery => {
            const approvedCount = delivery.items.filter(i => i.approved).length;
            return (
              <div key={delivery.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold">{delivery.label}</h3>
                    <Badge variant="outline" className="text-[10px]">{delivery.items.length} conteúdos</Badge>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <CheckCircle2 className="w-3 h-3 text-chart-green" /> {approvedCount} aprovados
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Criado em {delivery.createdAt}
                  </span>
                </div>

                <div className="space-y-2">
                  {delivery.items.map(content => {
                    const isExpanded = expandedContent === content.id;
                    return (
                      <Card key={content.id} className={`glass-card transition-all ${content.approved ? "border-chart-green/30 bg-chart-green/5" : ""}`}>
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <p className="text-sm font-semibold">{content.title}</p>
                                {content.approved && <CheckCircle2 className="w-4 h-4 text-chart-green shrink-0" />}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <Badge variant="outline" className="text-[9px]">{content.format}</Badge>
                                <Badge className={`text-[9px] ${networkColors[content.network] || ""}`}>{content.network}</Badge>
                                <Badge className={`text-[9px] ${funnelColors[content.funnel] || ""}`}>{content.funnel}</Badge>
                              </div>

                              {/* Expandable script */}
                              <div className={`text-xs text-muted-foreground whitespace-pre-line bg-muted/30 rounded-lg p-3 border border-border/50 ${isExpanded ? "" : "max-h-16 overflow-hidden relative"}`}>
                                {content.script}
                                {!isExpanded && (
                                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted/80 to-transparent" />
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] h-6 mt-1 gap-1 text-primary"
                                onClick={() => setExpandedContent(isExpanded ? null : content.id)}
                              >
                                {isExpanded ? <><ChevronUp className="w-3 h-3" /> Recolher</> : <><ChevronDown className="w-3 h-3" /> Ver roteiro completo</>}
                              </Button>
                            </div>

                            <div className="flex flex-col gap-1 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-[10px] gap-1"
                                onClick={() => { navigator.clipboard.writeText(content.title + "\n\n" + content.script); toast({ title: "Roteiro copiado!" }); }}
                              >
                                <Copy className="w-3 h-3" /> Copiar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-[10px] gap-1"
                                onClick={() => toast({ title: "Download iniciado!" })}
                              >
                                <Download className="w-3 h-3" /> Baixar
                              </Button>
                              <Button
                                variant={content.approved ? "default" : "outline"}
                                size="sm"
                                className="h-8 text-[10px] gap-1"
                                onClick={() => toggleApprove(delivery.id, content.id)}
                              >
                                <Check className="w-3 h-3" /> {content.approved ? "Aprovado" : "Aprovar"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

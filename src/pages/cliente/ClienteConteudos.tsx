import { useState } from "react";
import {
  FileText, Edit3, Check, Plus, Sparkles, Copy,
  BookOpen, Users, Eye, Shield, Target, Download,
  FolderOpen, Folder, Clock, ArrowLeft, File,
  ChevronDown, ChevronUp, Lightbulb,
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
  fields: { key: string; label: string; type: "text" | "textarea"; value: string }[];
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

/* ── File system ── */
interface ContentFile {
  id: string;
  name: string;
  script: string;
  format: string;
  network: string;
  funnel: string;
  createdAt: string;
}

interface MonthFolder {
  id: string;
  month: string;
  label: string;
  createdAt: string;
  files: ContentFile[];
}

const mockFolders: MonthFolder[] = [
  {
    id: "feb-2026", month: "2026-02", label: "Fevereiro 2026", createdAt: "05/02/2026",
    files: [
      { id: "1", name: "5 Erros que Todo Franqueado Comete no Marketing.txt", script: "ABERTURA: Você sabia que 78% dos franqueados cometem pelo menos um desses erros no marketing?\n\nERRO 1 — Não ter persona definida\nA maioria investe em anúncios sem saber exatamente quem quer atingir. Resultado: dinheiro jogado fora.\n\nERRO 2 — Ignorar o marketing local\nFranquias precisam de estratégia nacional E local. Adaptar campanhas para a região é essencial.\n\nERRO 3 — Não medir resultados\nSe você não sabe seu CAC, CPL e taxa de conversão, está voando às cegas.\n\nERRO 4 — Conteúdo genérico demais\nPostar frases motivacionais não gera leads. Conteúdo educativo e específico sim.\n\nERRO 5 — Não usar automação\nResponder leads manualmente em 2026? Automação é obrigação, não diferencial.\n\nCTA: Quer corrigir esses erros? Acesse o link na bio e agende uma consultoria gratuita.", format: "Carrossel", network: "Instagram", funnel: "Topo", createdAt: "03/02/2026" },
      { id: "2", name: "Como Definir Metas de Vendas para Sua Franquia.txt", script: "ROTEIRO DE POST:\n\nTítulo: Como Definir Metas de Vendas que Realmente Funcionam\n\nParágrafo 1: Metas vagas geram resultados vagos. Se sua meta é 'vender mais', você já começou errado.\n\nParágrafo 2: Use o método SMART:\n- Específica: 'Aumentar vendas da unidade Centro em 20%'\n- Mensurável: Acompanhe semanalmente no CRM\n- Atingível: Baseie-se no histórico dos últimos 3 meses\n- Relevante: Alinhada com o objetivo da rede\n- Temporal: Prazo de 90 dias\n\nParágrafo 3: Distribua a meta por vendedor e por canal (online vs presencial).\n\nCTA: Baixe nosso template gratuito de metas no link da bio.", format: "Feed", network: "LinkedIn", funnel: "Meio", createdAt: "03/02/2026" },
      { id: "3", name: "Case - Franquia que Triplicou Leads com IA.txt", script: "ROTEIRO REELS (60s):\n\n[0-5s] HOOK: 'Essa franquia triplicou seus leads em 90 dias. Quer saber como?'\n\n[5-15s] CONTEXTO: A Rede FastFood tinha 3 unidades e gerava em média 50 leads/mês por unidade.\n\n[15-30s] PROBLEMA: O time respondia leads manualmente, perdia oportunidades e não tinha visibilidade do funil.\n\n[30-45s] SOLUÇÃO: Implementaram nossa plataforma com IA para qualificação automática, CRM integrado e campanhas segmentadas.\n\n[45-55s] RESULTADO: Em 90 dias — 150 leads/mês por unidade, 40% de taxa de conversão, ROI de 8x.\n\n[55-60s] CTA: 'Quer o mesmo resultado? Link na bio.'", format: "Reels", network: "Instagram", funnel: "Fundo", createdAt: "03/02/2026" },
      { id: "4", name: "O Poder do CRM para Redes de Franquias.txt", script: "POST EDUCATIVO:\n\nSe você gerencia uma rede de franquias sem CRM, está perdendo dinheiro todos os dias.\n\nVeja o que um CRM inteligente faz por você:\n\n1. Centraliza todos os leads de todas as unidades\n2. Automatiza follow-ups (ninguém esquece de responder)\n3. Mostra em tempo real qual unidade está performando\n4. Identifica gargalos no funil de vendas\n5. Gera relatórios automáticos para a franqueadora\n\nO resultado? Mais vendas, menos trabalho manual e visibilidade total da operação.\n\nNão é sobre tecnologia. É sobre não deixar dinheiro na mesa.\n\n#crm #franquias #vendas #gestao #marketing", format: "Feed", network: "Instagram", funnel: "Meio", createdAt: "03/02/2026" },
      { id: "5", name: "Checklist - Marketing Digital para Franquias.txt", script: "CARROSSEL (7 slides):\n\nSlide 1 — Capa: 'Checklist Completo: Marketing Digital para Franquias'\n\nSlide 2 — Fundamentos:\n[ ] Persona definida por unidade\n[ ] Identidade visual padronizada\n[ ] Presença em Google Meu Negócio\n\nSlide 3 — Conteúdo:\n[ ] Calendário editorial mensal\n[ ] 3 posts/semana mínimo\n[ ] Mix de formatos (feed, reels, stories)\n\nSlide 4 — Tráfego Pago:\n[ ] Pixel instalado\n[ ] Campanhas de captação ativas\n[ ] Remarketing configurado\n\nSlide 5 — CRM & Vendas:\n[ ] Leads centralizados\n[ ] Follow-up automatizado\n[ ] Pipeline visual configurado\n\nSlide 6 — Métricas:\n[ ] CAC calculado\n[ ] Taxa de conversão acompanhada\n[ ] ROI mensal medido\n\nSlide 7 — CTA: 'Salve este checklist e comece a implementar hoje!'", format: "Carrossel", network: "Instagram", funnel: "Topo", createdAt: "03/02/2026" },
      { id: "6", name: "Depoimento - Como a Plataforma Mudou Minha Gestão.txt", script: "REELS (45s):\n\n[0-3s] Texto na tela: 'Antes vs Depois da NoExcuse'\n\n[3-15s] Depoimento: 'Eu gerenciava tudo em planilha. Leads perdidos, equipe desalinhada, zero visibilidade.'\n\n[15-30s] Transição: 'Depois de implementar a plataforma...'\n'Agora eu vejo todos os leads em tempo real, meu time recebe alertas automáticos, e eu sei exatamente quanto cada campanha retorna.'\n\n[30-40s] Resultado: 'Em 6 meses: 3x mais leads, 45% de conversão, e finalmente tenho tempo para estratégia.'\n\n[40-45s] CTA: 'Quer a mesma transformação? Link na bio.'", format: "Reels", network: "Instagram", funnel: "Fundo", createdAt: "03/02/2026" },
      { id: "7", name: "3 Tendências de Marketing para Franquias 2026.txt", script: "POST LINKEDIN:\n\n3 tendências que vão dominar o marketing de franquias em 2026:\n\n1. IA Generativa para Conteúdo\nNão é mais sobre criar conteúdo manualmente. É sobre ter IA que entende sua marca e gera roteiros, artes e campanhas alinhados com sua identidade.\n\n2. Hiperlocalização\nCada unidade precisa de marketing adaptado à sua região. O mesmo anúncio não funciona em São Paulo e em Manaus.\n\n3. Automação do Funil Completo\nDo lead ao fechamento, sem intervenção manual. Qualificação por IA, nurturing automatizado e alertas inteligentes.\n\nQuem adotar essas tendências primeiro vai dominar o mercado.", format: "Feed", network: "LinkedIn", funnel: "Topo", createdAt: "03/02/2026" },
      { id: "8", name: "Agende Sua Demo Gratuita.txt", script: "STORY SEQUENCE (3 stories):\n\nStory 1:\nTexto: 'Cansado de perder leads por falta de organização?'\n\nStory 2:\nTexto: 'Nossa plataforma integra CRM + Marketing + IA em um só lugar'\n\nStory 3:\nTexto: 'Agende sua demo gratuita — link aqui'\nSticker: Countdown para fim da oferta", format: "Story", network: "Instagram", funnel: "Fundo", createdAt: "03/02/2026" },
    ],
  },
  {
    id: "jan-2026", month: "2026-01", label: "Janeiro 2026", createdAt: "03/01/2026",
    files: [
      { id: "j1", name: "Ano Novo, Franquia Nova - Planejamento 2026.txt", script: "POST COMPLETO:\n\nComeço de ano é o momento ideal para reestruturar o marketing da sua franquia.\n\nO que você precisa definir agora:\n\n1. Meta de leads por trimestre\n2. Orçamento de mídia paga mensal\n3. Calendário editorial Q1\n4. KPIs prioritários\n5. Ferramentas que vai adotar\n\nQuem planeja em janeiro, colhe o ano inteiro.", format: "Feed", network: "Instagram", funnel: "Topo", createdAt: "03/01/2026" },
      { id: "j2", name: "Por que Franquias Precisam de Marketing Digital.txt", script: "CARROSSEL (5 slides):\n\nSlide 1 — 'Por que sua franquia PRECISA de marketing digital'\nSlide 2 — '92% dos consumidores pesquisam online antes de comprar'\nSlide 3 — 'Franquias com presença digital forte geram 3x mais leads'\nSlide 4 — 'Marketing local + digital = combinação imbatível'\nSlide 5 — 'Comece hoje. Fale conosco.'", format: "Carrossel", network: "Instagram", funnel: "Topo", createdAt: "03/01/2026" },
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
  const [folders] = useState(mockFolders);
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [openFile, setOpenFile] = useState<ContentFile | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);

  // Briefing
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

  const handleGenerate = () => {
    setBriefOpen(false);
    toast({ title: "Conteúdos gerados!", description: `${bQtd} roteiros criados para ${bMes}.` });
  };

  const currentFolder = folders.find(f => f.id === openFolder);

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
          <TabsTrigger value="arquivos" className="text-xs gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Arquivos</TabsTrigger>
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

        {/* ═══ ARQUIVOS ═══ */}
        <TabsContent value="arquivos" className="space-y-4 mt-4">
          {/* New creation button */}
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
                <p className="text-xs text-muted-foreground">Preencha o briefing abaixo. Uma nova pasta será criada com todos os roteiros gerados.</p>
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
                    <Textarea value={bPromocoes} onChange={e => setBPromocoes(e.target.value)} placeholder="Ex: 30% off plano anual..." rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Datas Comemorativas</Label>
                    <Textarea value={bDatas} onChange={e => setBDatas(e.target.value)} placeholder="Ex: Dia da Mulher (08/03)..." rows={2} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Destaques e Novidades</Label>
                  <Textarea value={bDestaques} onChange={e => setBDestaques(e.target.value)} placeholder="Ex: Novo recurso, case de sucesso..." rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Público-alvo Prioritário</Label>
                    <Input value={bPublico} onChange={e => setBPublico(e.target.value)} placeholder="Ex: Franqueados novos, prospects" />
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
                  <Textarea value={bObs} onChange={e => setBObs(e.target.value)} placeholder="Informações extras..." rows={3} />
                </div>
                <Button className="w-full gap-2 h-11" onClick={handleGenerate}>
                  <Sparkles className="w-4 h-4" /> Gerar Conteúdos do Mês
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Breadcrumb */}
          {openFolder && !openFile && (
            <div className="flex items-center gap-2 text-sm">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => setOpenFolder(null)}>
                <ArrowLeft className="w-3 h-3" /> Voltar
              </Button>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{currentFolder?.label}</span>
            </div>
          )}

          {openFile && (
            <div className="flex items-center gap-2 text-sm">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => setOpenFile(null)}>
                <ArrowLeft className="w-3 h-3" /> Voltar
              </Button>
              <span className="text-muted-foreground">/</span>
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={() => setOpenFile(null)}>{currentFolder?.label}</button>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium text-xs truncate max-w-xs">{openFile.name}</span>
            </div>
          )}

          {/* File viewer */}
          {openFile ? (
            <Card className="glass-card">
              <CardContent className="py-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold">{openFile.name}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-[9px]">{openFile.format}</Badge>
                      <Badge className={`text-[9px] ${networkColors[openFile.network] || ""}`}>{openFile.network}</Badge>
                      <Badge className={`text-[9px] ${funnelColors[openFile.funnel] || ""}`}>{openFile.funnel}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {openFile.createdAt}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(openFile.script); toast({ title: "Roteiro copiado!" }); }}>
                      <Copy className="w-3.5 h-3.5" /> Copiar
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => toast({ title: "Download iniciado!" })}>
                      <Download className="w-3.5 h-3.5" /> Baixar
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                  <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{openFile.script}</p>
                </div>
              </CardContent>
            </Card>
          ) : openFolder && currentFolder ? (
            /* Files inside folder */
            <div className="space-y-1">
              {currentFolder.files.map(file => (
                <Card
                  key={file.id}
                  className="glass-card cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setOpenFile(file)}
                >
                  <CardContent className="py-3 flex items-center gap-3">
                    <File className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[8px] h-4">{file.format}</Badge>
                        <Badge className={`text-[8px] h-4 ${networkColors[file.network] || ""}`}>{file.network}</Badge>
                        <span className="text-[10px] text-muted-foreground">{file.createdAt}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { navigator.clipboard.writeText(file.script); toast({ title: "Copiado!" }); }}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toast({ title: "Download iniciado!" })}>
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Folder list */
            <div className="space-y-2">
              {folders.map(folder => (
                <Card
                  key={folder.id}
                  className="glass-card cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setOpenFolder(folder.id)}
                >
                  <CardContent className="py-4 flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Folder className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{folder.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{folder.files.length} arquivos — Criado em {folder.createdAt}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{folder.files.length} roteiros</Badge>
                  </CardContent>
                </Card>
              ))}

              {folders.length === 0 && (
                <div className="text-center py-16">
                  <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma criação mensal ainda</p>
                  <p className="text-xs text-muted-foreground mt-1">Clique em "Nova Criação Mensal" para gerar seus primeiros conteúdos</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

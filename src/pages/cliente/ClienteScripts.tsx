import { useState, useMemo } from "react";
import {
  BookOpen, Plus, Copy, Search, ChevronDown, ChevronUp, Sparkles,
  FileText, Phone, Target, Lightbulb, ShieldQuestion, Pencil, Trash2,
  X, Save, MessageSquare, Crosshair, Handshake, Ban
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { getClienteScripts, type ClienteScript } from "@/data/clienteData";
import { toast } from "@/hooks/use-toast";

// ===== Funnel stage categories =====

const funnelStages = [
  { key: "prospeccao", label: "Prospecção", icon: Crosshair, gradient: "from-blue-500/15 to-blue-600/5", accent: "text-blue-400 border-blue-500/30" },
  { key: "diagnostico", label: "Diagnóstico", icon: ShieldQuestion, gradient: "from-cyan-500/15 to-cyan-600/5", accent: "text-cyan-400 border-cyan-500/30" },
  { key: "negociacao", label: "Negociação", icon: Handshake, gradient: "from-purple-500/15 to-purple-600/5", accent: "text-purple-400 border-purple-500/30" },
  { key: "fechamento", label: "Fechamento", icon: Target, gradient: "from-emerald-500/15 to-emerald-600/5", accent: "text-emerald-400 border-emerald-500/30" },
  { key: "objecoes", label: "Quebra de Objeções", icon: Ban, gradient: "from-amber-500/15 to-amber-600/5", accent: "text-amber-400 border-amber-500/30" },
];

interface Script {
  id: string;
  title: string;
  stage: string;
  type: "script" | "playbook";
  description: string;
  content: string;
  updatedAt: string;
}

// Mock scripts organized by funnel stage
const initialScripts: Script[] = [
  {
    id: "s1", title: "Abordagem Inicial por WhatsApp", stage: "prospeccao", type: "script",
    description: "Primeiro contato com lead frio via WhatsApp",
    content: "Olá [Nome]! Tudo bem?\n\nSou [Seu Nome] da [Empresa]. Vi que você [contexto do lead] e acredito que posso te ajudar a [benefício principal].\n\nPosso te fazer uma pergunta rápida?",
    updatedAt: "21/02/2026",
  },
  {
    id: "s2", title: "Script de Ligação — Prospecção Ativa", stage: "prospeccao", type: "script",
    description: "Roteiro de ligação para prospecção outbound",
    content: "1. Apresentação (10s): Olá [Nome], aqui é o [Seu Nome] da [Empresa].\n2. Gancho (15s): Estou entrando em contato porque [motivo relevante].\n3. Pergunta qualificadora: Você está buscando [dor principal]?\n4. Pitch (30s): Nós ajudamos empresas como a sua a [resultado].\n5. CTA: Posso te mostrar como funciona em 15 minutos?",
    updatedAt: "20/02/2026",
  },
  {
    id: "s3", title: "Perguntas de Diagnóstico Comercial", stage: "diagnostico", type: "playbook",
    description: "Roteiro de perguntas para qualificar e entender o lead",
    content: "PERGUNTAS ESSENCIAIS:\n\n1. Qual é o principal desafio que você enfrenta hoje em [área]?\n2. Quanto isso está custando para sua empresa? (tempo, dinheiro, oportunidade)\n3. Você já tentou resolver isso antes? O que aconteceu?\n4. Quem mais está envolvido na decisão?\n5. Qual o prazo ideal para resolver isso?\n6. Qual orçamento você tem disponível para investir nisso?\n7. O que acontece se nada mudar nos próximos 6 meses?",
    updatedAt: "19/02/2026",
  },
  {
    id: "s4", title: "Apresentação de Proposta", stage: "negociacao", type: "script",
    description: "Script para apresentar proposta comercial ao lead",
    content: "1. Resumo do diagnóstico: 'Com base no que conversamos, identifiquei que [dores]...'\n2. Solução proposta: 'Para resolver isso, recomendo [solução]...'\n3. Benefícios: 'Com isso você vai conseguir [resultado 1], [resultado 2], [resultado 3]...'\n4. Investimento: 'O investimento é de R$ [valor]/mês...'\n5. Prova social: 'O cliente [nome] tinha a mesma situação e conseguiu [resultado]...'\n6. CTA: 'Podemos começar na próxima semana?'",
    updatedAt: "18/02/2026",
  },
  {
    id: "s5", title: "Playbook de Fechamento", stage: "fechamento", type: "playbook",
    description: "Estratégias e técnicas para fechar vendas",
    content: "TÉCNICAS DE FECHAMENTO:\n\n1. FECHAMENTO ALTERNATIVO: 'Você prefere começar com o plano A ou plano B?'\n2. FECHAMENTO POR URGÊNCIA: 'Essa condição é válida até [data]. Posso reservar pra você?'\n3. FECHAMENTO POR RESUMO: 'Então recapitulando: você precisa de [X], quer [Y] e o investimento é [Z]. Vamos fechar?'\n4. FECHAMENTO SILENCIOSO: Apresente o preço e espere. Quem fala primeiro perde.\n5. FECHAMENTO POR CONSEQUÊNCIA: 'O que acontece se não resolver isso agora?'",
    updatedAt: "17/02/2026",
  },
  {
    id: "s6", title: "Respostas para Objeções Comuns", stage: "objecoes", type: "playbook",
    description: "Como rebater as objeções mais frequentes",
    content: "OBJEÇÃO: 'Está caro'\n→ 'Entendo. Mas quanto está custando NÃO resolver isso? [Calcular custo da inação]'\n\nOBJEÇÃO: 'Preciso pensar'\n→ 'Claro! O que exatamente precisa avaliar? Posso te ajudar com alguma informação adicional?'\n\nOBJEÇÃO: 'Vou falar com meu sócio'\n→ 'Faz sentido! Que tal agendarmos uma reunião com ele? Assim posso tirar as dúvidas diretamente.'\n\nOBJEÇÃO: 'Já tenho fornecedor'\n→ 'Ótimo! E como está sendo a experiência? Temos clientes que migraram e conseguiram [resultado].'",
    updatedAt: "16/02/2026",
  },
];

// ===== Playbook Generator Dialog =====

function PlaybookGeneratorDialog({ open, onClose, onGenerate }: {
  open: boolean; onClose: () => void; onGenerate: (script: Script) => void;
}) {
  const [stage, setStage] = useState("prospeccao");
  const [type, setType] = useState<"script" | "playbook">("script");
  const [context, setContext] = useState("");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!context.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      const stageLabel = funnelStages.find(s => s.key === stage)?.label || stage;
      const generated: Script = {
        id: `gen_${Date.now()}`,
        title: `${type === "playbook" ? "Playbook" : "Script"} — ${stageLabel}`,
        stage,
        type,
        description: `Gerado por IA para ${stageLabel.toLowerCase()}`,
        content: `[GERADO POR IA]\n\nContexto: ${context}\nProduto/Serviço: ${product}\nPúblico: ${audience}\n\n---\n\nOlá [Nome],\n\nSou [Seu Nome] da [Empresa]. ${context}\n\nNossa solução de ${product} pode ajudar você a alcançar resultados melhores.\n\nPosso te mostrar como funciona em uma conversa rápida?`,
        updatedAt: new Date().toLocaleDateString("pt-BR"),
      };
      onGenerate(generated);
      setIsGenerating(false);
      onClose();
      setContext(""); setProduct(""); setAudience("");
      toast({ title: "Script gerado!", description: "Revise e edite conforme necessário." });
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Gerar Playbook com IA
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Etapa do Funil</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {funnelStages.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={type} onValueChange={v => setType(v as "script" | "playbook")}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="script">Script (roteiro direto)</SelectItem>
                  <SelectItem value="playbook">Playbook (estratégia)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Qual o contexto da venda? *</Label>
            <Textarea value={context} onChange={e => setContext(e.target.value)} rows={3} className="text-sm mt-1" placeholder="Ex: Vendo software de gestão para clínicas médicas. O lead geralmente é o dono da clínica..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Produto/Serviço</Label>
              <Input value={product} onChange={e => setProduct(e.target.value)} className="h-9 text-sm mt-1" placeholder="Ex: Software de gestão" />
            </div>
            <div>
              <Label className="text-xs">Público-alvo</Label>
              <Input value={audience} onChange={e => setAudience(e.target.value)} className="h-9 text-sm mt-1" placeholder="Ex: Donos de clínicas" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleGenerate} disabled={!context.trim() || isGenerating}>
            {isGenerating ? "Gerando..." : <><Sparkles className="w-4 h-4 mr-1" /> Gerar</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== Script Card =====

function ScriptCard({ script, isExpanded, onToggle, onEdit, onDelete }: {
  script: Script; isExpanded: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const stage = funnelStages.find(s => s.key === script.stage) || funnelStages[0];

  return (
    <Card
      className={`overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer ${isExpanded ? "ring-1 ring-primary/30 shadow-lg" : ""}`}
      onClick={onToggle}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${stage.gradient} opacity-50`} />
      <CardContent className="relative py-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${stage.accent} bg-background/50`}>
              <stage.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{script.title}</p>
                <Badge variant="outline" className="text-[8px] shrink-0">
                  {script.type === "playbook" ? "Playbook" : "Script"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{script.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(script.content); toast({ title: "Copiado!" }); }}
            >
              <Copy className="w-3 h-3" />
            </Button>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>

        {isExpanded && (
          <div className="animate-fade-in mt-3 space-y-3">
            <div className="p-4 bg-background/60 backdrop-blur-sm rounded-lg text-sm whitespace-pre-wrap border font-mono text-xs leading-relaxed">
              {script.content}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">Atualizado em {script.updatedAt}</p>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Pencil className="w-2.5 h-2.5 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                  <Trash2 className="w-2.5 h-2.5 mr-1" /> Excluir
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isExpanded && (
          <p className="text-[10px] text-muted-foreground">Atualizado em {script.updatedAt}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ===== Main Component =====

export default function ClienteScripts() {
  const [scripts, setScripts] = useState<Script[]>(initialScripts);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [editScript, setEditScript] = useState<Script | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editStage, setEditStage] = useState("");
  const [editType, setEditType] = useState<"script" | "playbook">("script");
  const [editDesc, setEditDesc] = useState("");
  const [editContent, setEditContent] = useState("");

  const openEditDialog = (script: Script) => {
    setEditScript(script);
    setEditTitle(script.title);
    setEditStage(script.stage);
    setEditType(script.type);
    setEditDesc(script.description);
    setEditContent(script.content);
    setShowEditDialog(true);
  };

  const saveEdit = () => {
    if (!editScript || !editTitle.trim()) return;
    setScripts(prev => prev.map(s => s.id === editScript.id ? {
      ...s, title: editTitle, stage: editStage, type: editType,
      description: editDesc, content: editContent,
      updatedAt: new Date().toLocaleDateString("pt-BR"),
    } : s));
    setShowEditDialog(false);
    toast({ title: "Script atualizado!" });
  };

  const deleteScript = (id: string) => {
    setScripts(prev => prev.filter(s => s.id !== id));
    toast({ title: "Script excluído!" });
  };

  const filtered = (stageKey: string) =>
    scripts
      .filter(s => s.stage === stageKey)
      .filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Scripts & Playbooks"
        subtitle="Scripts de prospecção e negociação organizados por etapa do funil"
        icon={<BookOpen className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowGenerator(true)}>
              <Sparkles className="w-4 h-4 mr-1" /> Gerar com IA
            </Button>
            <Button size="sm" onClick={() => {
              setEditScript(null);
              setEditTitle(""); setEditStage("prospeccao"); setEditType("script");
              setEditDesc(""); setEditContent("");
              setShowEditDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-1" /> Novo Script
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar scripts por título ou conteúdo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Stage stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {funnelStages.map(stage => {
          const count = scripts.filter(s => s.stage === stage.key).length;
          return (
            <div key={stage.key} className={`flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-br ${stage.gradient}`}>
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${stage.accent} bg-background/50`}>
                <stage.icon className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-medium">{stage.label}</p>
                <p className="text-lg font-bold">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs by funnel stage */}
      <Tabs defaultValue={funnelStages[0].key}>
        <TabsList className="flex-wrap">
          {funnelStages.map(s => (
            <TabsTrigger key={s.key} value={s.key} className="text-xs gap-1.5">
              <s.icon className="w-3 h-3" /> {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {funnelStages.map(stage => (
          <TabsContent key={stage.key} value={stage.key} className="space-y-3 mt-4">
            {filtered(stage.key).map(s => (
              <ScriptCard
                key={s.id}
                script={s}
                isExpanded={expandedId === s.id}
                onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                onEdit={() => openEditDialog(s)}
                onDelete={() => deleteScript(s.id)}
              />
            ))}
            {filtered(stage.key).length === 0 && (
              <div className="text-center py-12">
                <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {search ? `Nenhum resultado para "${search}"` : "Nenhum script nesta etapa"}
                </p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowGenerator(true)}>
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Gerar Playbook para {stage.label}
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Generator Dialog */}
      <PlaybookGeneratorDialog
        open={showGenerator}
        onClose={() => setShowGenerator(false)}
        onGenerate={(script) => setScripts(prev => [script, ...prev])}
      />

      {/* Edit/Create Dialog */}
      <Dialog open={showEditDialog} onOpenChange={v => !v && setShowEditDialog(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editScript ? <Pencil className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {editScript ? "Editar Script" : "Novo Script"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Título *</Label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-9 text-sm mt-1" placeholder="Nome do script..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Etapa do Funil</Label>
                <Select value={editStage} onValueChange={setEditStage}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {funnelStages.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={editType} onValueChange={v => setEditType(v as "script" | "playbook")}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="script">Script</SelectItem>
                    <SelectItem value="playbook">Playbook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="h-9 text-sm mt-1" placeholder="Breve descrição..." />
            </div>
            <div>
              <Label className="text-xs">Conteúdo</Label>
              <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={8} className="text-sm font-mono mt-1" placeholder="Escreva o roteiro ou playbook aqui..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button disabled={!editTitle.trim()} onClick={() => {
              if (editScript) {
                saveEdit();
              } else {
                const newScript: Script = {
                  id: `manual_${Date.now()}`, title: editTitle, stage: editStage, type: editType,
                  description: editDesc, content: editContent,
                  updatedAt: new Date().toLocaleDateString("pt-BR"),
                };
                setScripts(prev => [newScript, ...prev]);
                setShowEditDialog(false);
                toast({ title: "Script criado!" });
              }
            }}>
              {editScript ? "Salvar" : "Criar Script"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

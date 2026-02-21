import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Plus, Send, MessageSquare, Paperclip,
  AlertTriangle, Inbox, Timer, Clock, Search,
} from "lucide-react";
import { getFranqueadoChamados, FranqueadoChamado } from "@/data/franqueadoData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type StatusExpanded = "aberto" | "em_analise" | "respondido" | "resolvido";
const STATUS_LABELS: Record<string, string> = { aberto: "Aberto", em_analise: "Em análise", em_andamento: "Em análise", respondido: "Respondido", resolvido: "Resolvido" };
const STATUS_VARIANTS: Record<string, "destructive" | "secondary" | "outline" | "default"> = { aberto: "destructive", em_analise: "secondary", em_andamento: "secondary", respondido: "default", resolvido: "outline" };
const PRIORIDADE_LABELS: Record<string, string> = { urgente: "Urgente", alta: "Alta", normal: "Normal", baixa: "Baixa" };
const CATEGORIAS = ["Financeiro", "Jurídico", "Comercial", "Marketing", "Treinamentos", "Sistema", "Dúvidas gerais"];

const alertIcons = [AlertTriangle, Inbox, Timer, Clock];

export default function FranqueadoSuporte() {
  const [chamados, setChamados] = useState(() => {
    // Normalize old status values
    return getFranqueadoChamados().map(c => ({
      ...c,
      status: c.status === "em_andamento" ? "em_analise" as const : c.status,
    })) as FranqueadoChamado[];
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [criando, setCriando] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("Dúvidas gerais");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novaPrioridade, setNovaPrioridade] = useState("normal");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategoria, setFilterCategoria] = useState("all");
  const [search, setSearch] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  const selected = chamados.find(c => c.id === selectedId);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [selected?.mensagens.length]);

  // Alerts
  const alerts = useMemo(() => {
    const abertos = chamados.filter(c => (c.status as string) === "aberto").length;
    const emAnalise = chamados.filter(c => (c.status as string) === "em_analise" || (c.status as string) === "em_andamento").length;
    const respondidos = chamados.filter(c => (c.status as string) === "respondido").length;
    const resolvidos = chamados.filter(c => (c.status as string) === "resolvido").length;
    return [
      { label: "Abertos", count: abertos, cor: "text-red-500" },
      { label: "Em Análise", count: emAnalise, cor: "text-amber-500" },
      { label: "Respondidos", count: respondidos, cor: "text-blue-500" },
      { label: "Resolvidos", count: resolvidos, cor: "text-emerald-500" },
    ];
  }, [chamados]);

  const filteredChamados = useMemo(() => {
    return chamados.filter(c => {
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (filterCategoria !== "all" && c.categoria !== filterCategoria) return false;
      if (search && !c.titulo.toLowerCase().includes(search.toLowerCase()) && !c.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [chamados, filterStatus, filterCategoria, search]);

  const enviarMensagem = () => {
    if (!novaMensagem.trim() || !selectedId) return;
    setChamados(prev => prev.map(c => c.id === selectedId ? {
      ...c, mensagens: [...c.mensagens, { autor: "Davi", texto: novaMensagem, data: new Date().toISOString(), isUnidade: true }]
    } : c));
    setNovaMensagem("");
  };

  const criarChamado = () => {
    if (!novoTitulo.trim()) return;
    const novo: FranqueadoChamado = {
      id: `CH-${Date.now() % 1000}`, titulo: novoTitulo, status: "aberto",
      prioridade: novaPrioridade as any, categoria: novaCategoria,
      criadoEm: new Date().toISOString().split("T")[0],
      ultimaAtualizacao: new Date().toISOString().split("T")[0],
      mensagens: novaDescricao.trim() ? [{ autor: "Davi", texto: novaDescricao, data: new Date().toISOString(), isUnidade: true }] : [],
    };
    setChamados(prev => [novo, ...prev]);
    setSelectedId(novo.id);
    setCriando(false);
    setNovoTitulo(""); setNovaDescricao(""); setNovaPrioridade("normal"); setNovaCategoria("Dúvidas gerais");
  };

  // ── Criação ──
  if (criando) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setCriando(false)}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h1 className="page-header-title">Novo Chamado</h1>
            </div>
            <p className="text-sm text-muted-foreground">Abra um chamado para o suporte da matriz</p>
          </div>
        </div>
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Título *</label>
              <Input value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} placeholder="Descreva brevemente o problema" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoria</label>
                <Select value={novaCategoria} onValueChange={setNovaCategoria}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Prioridade</label>
                <Select value={novaPrioridade} onValueChange={setNovaPrioridade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
              <Textarea value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} placeholder="Descreva o problema em detalhes..." rows={4} />
            </div>
            <Button onClick={criarChamado} className="w-full"><Plus className="w-4 h-4 mr-1" /> Criar Chamado</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Detalhe (split layout) ──
  if (selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h1 className="page-header-title">{selected.titulo}</h1>
            </div>
            <p className="text-sm text-muted-foreground">{selected.id} · {selected.categoria}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info */}
          <Card className="glass-card lg:col-span-1">
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Status</p>
                <Badge variant={STATUS_VARIANTS[selected.status]}>{STATUS_LABELS[selected.status]}</Badge>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Prioridade</p>
                <Badge variant="outline">{PRIORIDADE_LABELS[selected.prioridade] || selected.prioridade}</Badge>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Categoria</p>
                <p className="text-sm">{selected.categoria}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Aberto em</p>
                <p className="text-sm">{selected.criadoEm}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Última atualização</p>
                <p className="text-sm">{selected.ultimaAtualizacao}</p>
              </div>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card className="glass-card lg:col-span-2">
            <CardContent className="p-0 flex flex-col h-[500px]">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold">Conversa</p>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div ref={chatRef} className="space-y-3">
                  {selected.mensagens.map((m, i) => (
                    <div key={i} className={`flex ${m.isUnidade ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${m.isUnidade ? "bg-primary/20 text-foreground" : "bg-muted/40 text-foreground"}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            {m.isUnidade ? "Franqueado" : "Suporte"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{m.autor}</span>
                        </div>
                        <p className="text-sm">{m.texto}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 text-right">
                          {m.data.includes("T")
                            ? format(new Date(m.data), "dd/MM HH:mm", { locale: ptBR })
                            : m.data
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                  {selected.mensagens.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma mensagem ainda.</p>
                  )}
                </div>
              </ScrollArea>
              {selected.status !== "resolvido" && (
                <div className="border-t border-border p-3 flex gap-2">
                  <Button variant="ghost" size="icon" className="flex-shrink-0"><Paperclip className="w-4 h-4" /></Button>
                  <Input value={novaMensagem} onChange={e => setNovaMensagem(e.target.value)} placeholder="Digite sua mensagem..." onKeyDown={e => e.key === "Enter" && enviarMensagem()} className="flex-1" />
                  <Button size="icon" onClick={enviarMensagem}><Send className="w-4 h-4" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Lista ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h1 className="page-header-title">Suporte Matriz</h1>
            <Badge variant="outline" className="text-[10px]">Unidade</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Abra e acompanhe seus chamados</p>
        </div>
        <Button size="sm" onClick={() => setCriando(true)}><Plus className="w-4 h-4 mr-1" /> Novo Chamado</Button>
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {alerts.map((a, i) => {
          const Icon = alertIcons[i];
          return (
            <Card key={a.label} className={`p-3 flex items-center gap-3 ${a.count > 0 && i === 0 ? "border-red-500/30" : ""}`}>
              <Icon className={`w-5 h-5 ${a.cor} ${a.count > 0 && i === 0 ? "animate-pulse" : ""}`} />
              <div>
                <p className="text-lg font-bold">{a.count}</p>
                <p className="text-[11px] text-muted-foreground">{a.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="em_analise">Em análise</SelectItem>
            <SelectItem value="respondido">Respondido</SelectItem>
            <SelectItem value="resolvido">Resolvido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-[200px] h-8 text-xs pl-8" />
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredChamados.map(ch => (
          <Card key={ch.id} className="glass-card hover-lift cursor-pointer" onClick={() => setSelectedId(ch.id)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <MessageSquare className="w-5 h-5 text-primary/60 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{ch.titulo}</p>
                  <p className="text-xs text-muted-foreground">{ch.id} · {ch.categoria} · {ch.criadoEm}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={STATUS_VARIANTS[ch.status]}>{STATUS_LABELS[ch.status]}</Badge>
                <Badge variant="outline" className="text-[10px] capitalize">{PRIORIDADE_LABELS[ch.prioridade] || ch.prioridade}</Badge>
                <Badge variant="outline" className="text-[10px]">{ch.mensagens.length} msg</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredChamados.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum chamado encontrado.</p>
        )}
      </div>
    </div>
  );
}

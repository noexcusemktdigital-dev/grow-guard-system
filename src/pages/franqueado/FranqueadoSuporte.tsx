import { useState, useMemo, useRef, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Send, MessageSquare } from "lucide-react";
import { getFranqueadoChamados, FranqueadoChamado } from "@/data/franqueadoData";

const statusLabel: Record<string, string> = { aberto: "Aberto", em_andamento: "Em andamento", resolvido: "Resolvido" };
const statusVariant: Record<string, "destructive" | "secondary" | "outline"> = { aberto: "destructive", em_andamento: "secondary", resolvido: "outline" };

export default function FranqueadoSuporte() {
  const [chamados, setChamados] = useState(() => getFranqueadoChamados());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [criando, setCriando] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("Operações");
  const chatRef = useRef<HTMLDivElement>(null);

  const selected = chamados.find(c => c.id === selectedId);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [selected?.mensagens.length]);

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
      prioridade: "normal", categoria: novaCategoria, criadoEm: new Date().toISOString().split("T")[0],
      ultimaAtualizacao: new Date().toISOString().split("T")[0], mensagens: [],
    };
    setChamados(prev => [novo, ...prev]);
    setSelectedId(novo.id);
    setCriando(false);
    setNovoTitulo("");
  };

  if (criando) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader title="Novo Chamado" subtitle="Abra um chamado para o suporte da matriz"
          actions={<Button variant="ghost" size="sm" onClick={() => setCriando(false)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>}
        />
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Título</label>
              <Input value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} placeholder="Descreva brevemente o problema" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoria</label>
              <Select value={novaCategoria} onValueChange={setNovaCategoria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Financeiro", "Jurídico", "Marketing", "Operações", "Comercial", "Sistema"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={criarChamado} className="w-full"><Plus className="w-4 h-4 mr-1" /> Criar Chamado</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <PageHeader title={selected.titulo} subtitle={`${selected.id} · ${selected.categoria}`}
          actions={<Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>}
        />
        <div className="flex gap-2">
          <Badge variant={statusVariant[selected.status]}>{statusLabel[selected.status]}</Badge>
          <Badge variant="outline">{selected.prioridade}</Badge>
        </div>
        <Card className="glass-card">
          <CardContent className="p-0">
            <div ref={chatRef} className="h-[400px] overflow-y-auto p-4 space-y-3">
              {selected.mensagens.map((m, i) => (
                <div key={i} className={`flex ${m.isUnidade ? "justify-end" : "justify-start"} animate-slide-up`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${m.isUnidade ? "bg-primary/20 text-foreground" : "bg-muted/40 text-foreground"}`}>
                    <p className="text-xs font-semibold mb-0.5">{m.autor}</p>
                    <p className="text-sm">{m.texto}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{m.data}</p>
                  </div>
                </div>
              ))}
              {selected.mensagens.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma mensagem ainda.</p>}
            </div>
            {selected.status !== "resolvido" && (
              <div className="border-t border-border p-3 flex gap-2">
                <Input value={novaMensagem} onChange={e => setNovaMensagem(e.target.value)} placeholder="Digite sua mensagem..." onKeyDown={e => e.key === "Enter" && enviarMensagem()} className="flex-1" />
                <Button size="icon" onClick={enviarMensagem}><Send className="w-4 h-4" /></Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Suporte Matriz" subtitle="Abra e acompanhe seus chamados"
        actions={<Button size="sm" onClick={() => setCriando(true)}><Plus className="w-4 h-4 mr-1" /> Novo Chamado</Button>}
      />
      <div className="space-y-3">
        {chamados.map(ch => (
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
                <Badge variant={statusVariant[ch.status]}>{statusLabel[ch.status]}</Badge>
                <Badge variant="outline" className="text-[10px]">{ch.mensagens.length} msg</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, RefreshCw, Plus, Lightbulb, Target, MessageSquare, Megaphone, History, Save, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { getFranqueadoLeads } from "@/data/franqueadoData";
import { toast } from "sonner";

interface ProspeccaoHistorico {
  id: string;
  tipo: "plano" | "script";
  data: string;
  params: Record<string, string>;
  conteudo: string;
}

const mockPlano = {
  ideias: [
    "Mapear 20 empresas do nicho na região alvo usando Google Maps + LinkedIn",
    "Criar campanha de prospecção ativa via LinkedIn InMail",
    "Participar de 2 eventos locais do segmento por mês",
    "Oferecer diagnóstico gratuito como isca comercial",
    "Parceria com contadores e advogados locais para indicações",
  ],
  planoAcao: [
    "Semana 1-2: Mapeamento e lista de prospects",
    "Semana 3: Primeira abordagem (20 contatos)",
    "Semana 4: Follow-up e agendamento de reuniões",
    "Mês 2: Diagnósticos + Propostas",
    "Mês 3: Fechamento e ajuste da estratégia",
  ],
  canais: ["LinkedIn", "WhatsApp Business", "E-mail marketing", "Eventos presenciais", "Indicações"],
  abordagens: ["Abordagem consultiva com diagnóstico gratuito", "Social selling via LinkedIn", "Cold outreach personalizado por e-mail"],
};

const mockScript = {
  scriptInicial: `Olá [Nome]! Tudo bem?\n\nSou o Davi, da [Unidade Curitiba]. Vi que a [Empresa] atua no segmento de [Nicho] e achei que podemos ajudar vocês a crescer no digital.\n\nTemos ajudado empresas como a sua a aumentar em média 40% o volume de leads qualificados em 90 dias.\n\nPosso te mostrar como? Leva só 15 minutinhos.`,
  perguntas: [
    "Como vocês captam clientes hoje?",
    "Qual o maior desafio de vendas atualmente?",
    "Já investiram em marketing digital antes? O que funcionou?",
    "Qual a meta de faturamento para os próximos 6 meses?",
  ],
  objecoes: [
    { objecao: "Está caro", resposta: "Entendo. Vamos olhar o retorno: nosso ticket médio de cliente gera 5x o investimento em 6 meses." },
    { objecao: "Já tentei marketing e não deu certo", resposta: "Compreendo a frustração. A diferença é que trabalhamos com diagnóstico antes de qualquer ação, para garantir que a estratégia seja personalizada." },
    { objecao: "Preciso pensar", resposta: "Claro! Que tal agendarmos uma segunda conversa na próxima semana para tirar dúvidas?" },
  ],
  ctaFinal: "Vou preparar um diagnóstico personalizado para a [Empresa]. Posso te enviar até amanhã?",
};

export default function FranqueadoProspeccaoIA() {
  const navigate = useNavigate();
  const leads = getFranqueadoLeads();

  // Planejamento
  const [regiao, setRegiao] = useState("");
  const [nicho, setNicho] = useState("");
  const [metaMensal, setMetaMensal] = useState("");
  const [produtoFoco, setProdutoFoco] = useState("");
  const [ticketMedio, setTicketMedio] = useState("");
  const [tipoAbordagem, setTipoAbordagem] = useState("");
  const [planoGerado, setPlanoGerado] = useState(false);
  const [gerandoPlano, setGerandoPlano] = useState(false);

  // Script
  const [perfilCliente, setPerfilCliente] = useState("");
  const [objecoesComuns, setObjecoesComuns] = useState("");
  const [canalContato, setCanalContato] = useState("");
  const [scriptGerado, setScriptGerado] = useState(false);
  const [gerandoScript, setGerandoScript] = useState(false);
  const [leadVinculado, setLeadVinculado] = useState("");

  // Histórico
  const [historico, setHistorico] = useState<ProspeccaoHistorico[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const gerarPlano = () => {
    setGerandoPlano(true);
    setTimeout(() => { setPlanoGerado(true); setGerandoPlano(false); }, 800);
  };

  const gerarScript = () => {
    setGerandoScript(true);
    setTimeout(() => { setScriptGerado(true); setGerandoScript(false); }, 800);
  };

  const copiarScript = () => {
    navigator.clipboard.writeText(mockScript.scriptInicial);
    toast.success("Script copiado!");
  };

  const salvarPlanoHistorico = () => {
    const novo: ProspeccaoHistorico = {
      id: Date.now().toString(),
      tipo: "plano",
      data: new Date().toLocaleDateString("pt-BR"),
      params: { regiao, nicho, metaMensal, produtoFoco, ticketMedio, tipoAbordagem },
      conteudo: `Ideias: ${mockPlano.ideias.join(" | ")}\n\nPlano: ${mockPlano.planoAcao.join(" | ")}\n\nCanais: ${mockPlano.canais.join(", ")}\n\nAbordagens: ${mockPlano.abordagens.join(" | ")}`,
    };
    setHistorico(prev => [novo, ...prev]);
    toast.success("Plano salvo no histórico!");
  };

  const salvarScriptHistorico = () => {
    const novo: ProspeccaoHistorico = {
      id: Date.now().toString(),
      tipo: "script",
      data: new Date().toLocaleDateString("pt-BR"),
      params: { perfilCliente, canalContato, objecoesComuns },
      conteudo: `Script: ${mockScript.scriptInicial}\n\nPerguntas: ${mockScript.perguntas.join(" | ")}\n\nObjeções: ${mockScript.objecoes.map(o => `"${o.objecao}" → ${o.resposta}`).join(" | ")}\n\nCTA: ${mockScript.ctaFinal}`,
    };
    setHistorico(prev => [novo, ...prev]);
    toast.success("Script salvo no histórico!");
  };

  const removerHistorico = (id: string) => {
    setHistorico(prev => prev.filter(h => h.id !== id));
    toast.success("Removido do histórico");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader title="Prospecção IA" subtitle="Planeje prospecções e gere scripts comerciais com IA" />

      <Tabs defaultValue="planejamento">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="planejamento"><Lightbulb className="w-4 h-4 mr-1" /> Planejamento</TabsTrigger>
          <TabsTrigger value="script"><MessageSquare className="w-4 h-4 mr-1" /> Script Comercial</TabsTrigger>
          <TabsTrigger value="historico">
            <History className="w-4 h-4 mr-1" /> Histórico
            {historico.length > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{historico.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ── ABA PLANEJAMENTO ── */}
        <TabsContent value="planejamento" className="space-y-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Configurar Prospecção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Região</label><Input value={regiao} onChange={e => setRegiao(e.target.value)} placeholder="Ex: Curitiba e região metropolitana" /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Nicho</label><Input value={nicho} onChange={e => setNicho(e.target.value)} placeholder="Ex: Clínicas de estética" /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Meta mensal de leads</label><Input value={metaMensal} onChange={e => setMetaMensal(e.target.value)} placeholder="Ex: 20 leads" /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Produto foco</label><Input value={produtoFoco} onChange={e => setProdutoFoco(e.target.value)} placeholder="Ex: Marketing Digital completo" /></div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Ticket médio desejado</label><Input value={ticketMedio} onChange={e => setTicketMedio(e.target.value)} placeholder="Ex: R$ 3.000" /></div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de abordagem</label>
                  <Select value={tipoAbordagem} onValueChange={setTipoAbordagem}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultiva">Consultiva</SelectItem>
                      <SelectItem value="direta">Direta</SelectItem>
                      <SelectItem value="social_selling">Social Selling</SelectItem>
                      <SelectItem value="inbound">Inbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={gerarPlano} className="w-full" disabled={gerandoPlano}>
                {gerandoPlano ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                {gerandoPlano ? "Gerando..." : "Gerar Plano de Prospecção"}
              </Button>
            </CardContent>
          </Card>

          {planoGerado && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">💡 Ideias de Prospecção</CardTitle></CardHeader>
                  <CardContent><ul className="space-y-2">{mockPlano.ideias.map((i, idx) => <li key={idx} className="text-sm flex gap-2"><span className="text-primary font-bold">{idx + 1}.</span>{i}</li>)}</ul></CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">📋 Plano de Ação</CardTitle></CardHeader>
                  <CardContent><ul className="space-y-2">{mockPlano.planoAcao.map((p, idx) => <li key={idx} className="text-sm">{p}</li>)}</ul></CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">📡 Canais Recomendados</CardTitle></CardHeader>
                  <CardContent><div className="flex flex-wrap gap-2">{mockPlano.canais.map(c => <span key={c} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{c}</span>)}</div></CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">🎯 Abordagens Sugeridas</CardTitle></CardHeader>
                  <CardContent><ul className="space-y-2">{mockPlano.abordagens.map((a, idx) => <li key={idx} className="text-sm flex gap-2"><Megaphone className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{a}</li>)}</ul></CardContent>
                </Card>
              </div>
              <div className="flex gap-2">
                <Button onClick={salvarPlanoHistorico} variant="outline" className="flex-1">
                  <Save className="w-4 h-4 mr-1" /> Salvar no Histórico
                </Button>
                <Button onClick={() => navigate("/franqueado/crm")} className="flex-1">
                  <Plus className="w-4 h-4 mr-1" /> Criar Lead no CRM
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── ABA SCRIPT ── */}
        <TabsContent value="script" className="space-y-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" /> Configurar Script
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Perfil do cliente</label>
                <Textarea value={perfilCliente} onChange={e => setPerfilCliente(e.target.value)} placeholder="Ex: Dono de clínica de estética, 35-50 anos, já investe em redes sociais mas sem resultados..." rows={3} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Objeções comuns</label>
                <Textarea value={objecoesComuns} onChange={e => setObjecoesComuns(e.target.value)} placeholder="Ex: Preço alto, já tentou antes, não acredita em marketing digital..." rows={2} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Canal de contato</label>
                <Select value={canalContato} onValueChange={setCanalContato}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="telefone">Telefone</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={gerarScript} className="w-full" disabled={gerandoScript}>
                {gerandoScript ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                {gerandoScript ? "Gerando..." : "Gerar Script Comercial"}
              </Button>
            </CardContent>
          </Card>

          {scriptGerado && (
            <div className="space-y-6">
              <Card className="glass-card">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">📝 Script Inicial</CardTitle></CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed">{mockScript.scriptInicial}</div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={copiarScript}><Copy className="w-3.5 h-3.5 mr-1" /> Copiar</Button>
                    <Button variant="outline" size="sm" onClick={gerarScript}><RefreshCw className="w-3.5 h-3.5 mr-1" /> Regenerar</Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">❓ Perguntas Estratégicas</CardTitle></CardHeader>
                  <CardContent><ul className="space-y-2">{mockScript.perguntas.map((p, i) => <li key={i} className="text-sm flex gap-2"><span className="text-primary font-bold">{i + 1}.</span>{p}</li>)}</ul></CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">🛡️ Quebra de Objeções</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {mockScript.objecoes.map((o, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-semibold text-destructive">"{o.objecao}"</p>
                        <p className="text-muted-foreground mt-1">→ {o.resposta}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card className="glass-card">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">🎯 CTA Final</CardTitle></CardHeader>
                <CardContent><p className="text-sm bg-primary/10 rounded-xl p-4 font-medium">{mockScript.ctaFinal}</p></CardContent>
              </Card>

              <div className="flex gap-2">
                <Button onClick={salvarScriptHistorico} variant="outline" className="flex-1">
                  <Save className="w-4 h-4 mr-1" /> Salvar no Histórico
                </Button>
                <Card className="glass-card flex-1">
                  <CardContent className="p-3">
                    <div className="flex gap-2">
                      <Select value={leadVinculado} onValueChange={setLeadVinculado}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Vincular ao lead..." /></SelectTrigger>
                        <SelectContent>
                          {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.nome} — {l.empresa || "Sem empresa"}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" disabled={!leadVinculado} onClick={() => { toast.success("Script salvo no lead!"); }}>Salvar</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── ABA HISTÓRICO ── */}
        <TabsContent value="historico" className="space-y-6">
          {historico.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Nenhuma prospecção salva</p>
                <p className="text-xs text-muted-foreground mt-1">Gere um plano ou script e clique em "Salvar no Histórico"</p>
              </CardContent>
            </Card>
          ) : (
            historico.map(item => (
              <Card key={item.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.tipo === "plano" ? "default" : "secondary"} className="text-[10px]">
                        {item.tipo === "plano" ? "📋 Plano" : "📝 Script"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.data}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                        {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removerHistorico(item.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {Object.entries(item.params).filter(([, v]) => v).map(([k, v]) => (
                      <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {v}
                      </span>
                    ))}
                  </div>
                  {expandedId !== item.id && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.conteudo.slice(0, 150)}...</p>
                  )}
                  {expandedId === item.id && (
                    <div className="bg-muted/30 rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed mt-2">
                      {item.conteudo}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

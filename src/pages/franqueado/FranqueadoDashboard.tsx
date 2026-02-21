import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus, ChevronDown, MessageSquare, Calendar, TrendingUp,
  UserPlus, Headphones, FileSignature, LayoutGrid,
  DollarSign, FileText, Target, Users, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { HomeHojePreciso } from "@/components/home/HomeHojePreciso";
import { TaskListCard } from "@/components/premium/TaskListCard";
import { ProgressCtaCard } from "@/components/premium/ProgressCtaCard";
import { HomeAlertas } from "@/components/home/HomeAlertas";
import {
  getFranqueadoFinanceiro, getFranqueadoLeads, getFranqueadoPropostas,
  getFranqueadoContratos, getFranqueadoMensagemDia, getFranqueadoEventos,
  getFranqueadoComunicadosUnidade, getFranqueadoChamados,
  getFranqueadoPrioridadesUnidade, getFranqueadoAlertasUnidade,
  getFranqueadoMetas,
} from "@/data/franqueadoData";
import { getSaudacao } from "@/data/homeData";
import type { PrioridadeDoDia, AlertaHome } from "@/data/homeData";

const quickActionIcons: Record<string, React.ElementType> = { UserPlus, Headphones, FileSignature, LayoutGrid };

export default function FranqueadoDashboard() {
  const navigate = useNavigate();
  const fin = useMemo(() => getFranqueadoFinanceiro(), []);
  const leads = useMemo(() => getFranqueadoLeads(), []);
  const propostas = useMemo(() => getFranqueadoPropostas(), []);
  const contratos = useMemo(() => getFranqueadoContratos(), []);
  const metas = useMemo(() => getFranqueadoMetas(), []);
  const mensagem = getFranqueadoMensagemDia();
  const eventos = useMemo(() => getFranqueadoEventos().slice(0, 5), []);
  const comunicados = useMemo(() => getFranqueadoComunicadosUnidade().slice(0, 3), []);
  const chamados = useMemo(() => getFranqueadoChamados().filter(c => c.status !== "resolvido"), []);

  const prioridadesRaw = useMemo(() => getFranqueadoPrioridadesUnidade(), []);
  const alertasRaw = useMemo(() => getFranqueadoAlertasUnidade(), []);

  // Convert to HomeHojePreciso format
  const prioridades: PrioridadeDoDia[] = prioridadesRaw.map(p => ({
    id: p.id, titulo: p.titulo, descricao: p.descricao,
    tipo: p.tipo as PrioridadeDoDia["tipo"], link: p.link, urgencia: p.urgencia,
  }));

  const alertas: AlertaHome[] = alertasRaw.map(a => ({
    id: a.id, titulo: a.titulo, descricao: a.descricao,
    tipo: a.tipo as AlertaHome["tipo"], prioridade: a.prioridade,
    link: a.link, moduloOrigem: a.moduloOrigem, criadoEm: new Date().toISOString(),
  }));

  const saudacao = getSaudacao();
  const hoje = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const hojeCapitalized = hoje.charAt(0).toUpperCase() + hoje.slice(1);

  const contratosAtivos = contratos.filter(c => c.status === "ativo").length;
  const leadsAtivos = leads.filter(l => l.etapa !== "Perdido" && l.etapa !== "Venda").length;
  const propostasAbertas = propostas.filter(p => p.status === "enviada" || p.status === "rascunho").length;
  const vendasMes = propostas.filter(p => p.status === "aceita").length;

  const quickActions = [
    { label: "Criar Lead", path: "/franqueado/crm", icon: "UserPlus" },
    { label: "Abrir Chamado", path: "/franqueado/suporte", icon: "Headphones" },
    { label: "Ver Propostas", path: "/franqueado/propostas", icon: "FileSignature" },
    { label: "Acessar CRM", path: "/franqueado/crm", icon: "LayoutGrid" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title={`${saudacao}, Davi`}
        subtitle={`Unidade Curitiba · ${hojeCapitalized}`}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Ações rápidas <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {quickActions.map(a => {
                const Icon = quickActionIcons[a.icon] || Plus;
                return (
                  <DropdownMenuItem key={a.path + a.label} onClick={() => navigate(a.path)}>
                    <Icon className="w-4 h-4 mr-2" /> {a.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Hoje eu preciso de... */}
      <HomeHojePreciso prioridades={prioridades} />

      {/* Mensagem do dia + Comunicados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mensagem do dia */}
        <div className="glass-card p-6 flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <span className="text-2xl text-primary/30">"</span>
            <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400">{mensagem.categoria}</Badge>
          </div>
          <p className="text-lg italic text-foreground leading-relaxed flex-1">"{mensagem.texto}"</p>
          <span className="text-xs text-muted-foreground mt-4">— {mensagem.autor}</span>
        </div>

        {/* Comunicados */}
        <div className="glass-card p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Comunicados da Matriz</h3>
            <Badge variant="outline">{comunicados.length}</Badge>
          </div>
          <div className="flex-1 space-y-3">
            {comunicados.map(c => (
              <div key={c.id} className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${c.prioridade === "Crítica" ? "border-destructive/50 bg-destructive/5" : "border-border"}`} onClick={() => navigate("/franqueado/comunicados")}>
                <div className="flex items-start gap-2">
                  {c.prioridade === "Crítica" && <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5 animate-pulse" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{c.titulo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={c.prioridade === "Crítica" ? "destructive" : "secondary"} className="text-[10px]">{c.prioridade}</Badge>
                      <span className="text-[10px] text-muted-foreground">{c.autorNome} · {format(new Date(c.criadoEm), "dd MMM", { locale: ptBR })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-3 text-xs w-full" onClick={() => navigate("/franqueado/comunicados")}>
            Ver todos →
          </Button>
        </div>
      </div>

      {/* KPIs Financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Receita do Mês" value={`R$ ${fin.receitaBruta.toLocaleString()}`} sublabel="Receita bruta" icon={DollarSign} delay={0} variant="accent" />
        <KpiCard label="Projeção" value={`R$ ${Math.round(fin.receitaBruta * 1.15).toLocaleString()}`} sublabel="+15% estimado" icon={TrendingUp} delay={1} />
        <KpiCard label="Repasse Estimado" value={`R$ ${fin.repasse.toLocaleString()}`} sublabel="20% da receita" icon={FileText} delay={2} />
        <KpiCard label="Contratos Ativos" value={String(contratosAtivos)} sublabel={`${contratos.length} total`} icon={FileSignature} delay={3} />
      </div>

      {/* KPIs Comerciais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Leads Ativos" value={String(leadsAtivos)} sublabel={`${leads.length} total`} icon={Users} delay={0} />
        <KpiCard label="Propostas em Aberto" value={String(propostasAbertas)} sublabel="Enviadas + rascunho" icon={Target} delay={1} />
        <KpiCard label="Vendas do Mês" value={String(vendasMes)} sublabel="Propostas aceitas" icon={TrendingUp} delay={2} variant="accent" />
        <KpiCard label="Meta do Mês" value={`R$ ${metas[0]?.objetivo?.toLocaleString() || "0"}`} sublabel={`${Math.round((metas[0]?.atual / metas[0]?.objetivo) * 100) || 0}% atingido`} icon={Target} delay={3} />
      </div>

      <ProgressCtaCard
        title="MEU PROGRESSO DE VENDAS"
        level="NÍVEL PRO"
        metaLabel="META MENSAL"
        metaDescription={`Faltam R$ ${Math.max(0, (metas[0]?.objetivo || 0) - (metas[0]?.atual || 0)).toLocaleString()} para o bônus de performance.`}
        percent={Math.round(((metas[0]?.atual || 0) / (metas[0]?.objetivo || 1)) * 100)}
        ctaTitle="AÇÃO NECESSÁRIA"
        ctaSubtitle="PROSPECÇÃO DE LEADS"
        ctaDescription="Você tem 5 leads sem contato há mais de 48h. Priorize o follow-up hoje."
        ctaButtonLabel="ACESSAR CRM"
        onCtaClick={() => navigate("/franqueado/crm")}
      />

      <TaskListCard
        title="TAREFAS OPERACIONAIS"
        tasks={[
          { id: "ft1", title: "Follow-up leads pendentes", description: "Garantir que todos os leads de ontem receberam o primeiro contato.", time: "09:00", done: true },
          { id: "ft2", title: "Enviar propostas em aberto", description: "Finalizar e enviar as 3 propostas com prazo até amanhã.", time: "10:30" },
          { id: "ft3", title: "Reunião comercial semanal", description: "Revisar pipeline e metas com a equipe de vendas.", time: "14:00" },
          { id: "ft4", title: "Atualizar CRM", description: "Registrar todas as interações do dia no sistema.", time: "17:00" },
        ]}
        onTaskClick={() => navigate("/franqueado/crm")}
      />

      {/* Agenda + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Próximos Compromissos</h3>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-2">
            {eventos.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer hover:bg-muted/50" onClick={() => navigate("/franqueado/agenda")}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] text-primary font-bold">{format(new Date(e.data), "dd")}</span>
                  <span className="text-[8px] text-muted-foreground uppercase">{format(new Date(e.data), "MMM", { locale: ptBR })}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{e.titulo}</p>
                  <p className="text-[10px] text-muted-foreground">{e.hora} · {e.tipo}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-3 text-xs w-full" onClick={() => navigate("/franqueado/agenda")}>
            Ver agenda completa →
          </Button>
        </div>

        {alertas.length > 0 && <HomeAlertas alertas={alertas} />}

        {/* Chamados abertos */}
        {chamados.length > 0 && alertas.length === 0 && (
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Chamados em Aberto</h3>
              <Badge variant="secondary" className="ml-auto">{chamados.length}</Badge>
            </div>
            <div className="space-y-2">
              {chamados.map(ch => (
                <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate("/franqueado/suporte")}>
                  <div>
                    <p className="text-sm font-medium">{ch.titulo}</p>
                    <p className="text-xs text-muted-foreground">{ch.id} · {ch.categoria}</p>
                  </div>
                  <Badge variant={ch.status === "aberto" ? "destructive" : "secondary"}>
                    {ch.status === "aberto" ? "Aberto" : "Em andamento"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

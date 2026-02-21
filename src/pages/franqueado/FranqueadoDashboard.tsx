import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Trophy, TrendingUp, Users, DollarSign, FileText, Target,
  MessageSquare, Calendar, BarChart3, UserPlus, Headphones,
  FileSignature, LayoutGrid,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import {
  getFranqueadoIndicadores, getFranqueadoMetas, getFranqueadoRanking,
  getFranqueadoChamados, getFranqueadoMensagemDia, getFranqueadoEventos,
  getFranqueadoComunicadosUnidade,
} from "@/data/franqueadoData";

export default function FranqueadoDashboard() {
  const navigate = useNavigate();
  const indicadores = useMemo(() => getFranqueadoIndicadores(), []);
  const metas = useMemo(() => getFranqueadoMetas(), []);
  const ranking = getFranqueadoRanking();
  const chamados = useMemo(() => getFranqueadoChamados().filter(c => c.status !== "resolvido"), []);
  const mensagem = getFranqueadoMensagemDia();
  const eventos = useMemo(() => getFranqueadoEventos().slice(0, 3), []);
  const comunicados = useMemo(() => getFranqueadoComunicadosUnidade().slice(0, 3), []);

  const hoje = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const hojeCapitalized = hoje.charAt(0).toUpperCase() + hoje.slice(1);

  const atalhos = [
    { label: "Criar Lead", icon: UserPlus, rota: "/franqueado/crm" },
    { label: "Abrir Chamado", icon: Headphones, rota: "/franqueado/suporte" },
    { label: "Ver Propostas", icon: FileSignature, rota: "/franqueado/propostas" },
    { label: "Acessar CRM", icon: LayoutGrid, rota: "/franqueado/crm" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Dashboard" subtitle={`Unidade Curitiba · ${hojeCapitalized}`} />

      {/* Mensagem do dia */}
      <Card className="glass-card border-primary/20">
        <CardContent className="py-4 px-6">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">{mensagem.categoria}</p>
          <p className="text-sm text-foreground/90 italic">"{mensagem.texto}"</p>
          <p className="text-xs text-muted-foreground mt-1">— {mensagem.autor}</p>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indicadores.map((ind, i) => (
          <KpiCard
            key={ind.label}
            label={ind.label}
            value={ind.valor}
            sublabel={ind.trend}
            icon={[Users, DollarSign, FileText, Target][i]}
            delay={i}
            variant={i === 1 ? "accent" : "default"}
          />
        ))}
      </div>

      {/* Hoje eu preciso de... */}
      <Card className="glass-card hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider">
            🎯 Hoje eu preciso de...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {atalhos.map(a => (
              <Button
                key={a.label}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                onClick={() => navigate(a.rota)}
              >
                <a.icon className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium">{a.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metas + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Metas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metas.map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-semibold">{m.unidade === "R$" ? `R$ ${m.atual.toLocaleString()}` : m.atual} / {m.unidade === "R$" ? `R$ ${m.objetivo.toLocaleString()}` : m.objetivo}</span>
                </div>
                <Progress value={(m.atual / m.objetivo) * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" /> Ranking da Rede
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/50 flex items-center justify-center">
                <span className="text-2xl font-black text-yellow-500">{ranking.posicao}º</span>
              </div>
              <div>
                <p className="text-lg font-bold">{ranking.pontos} pts</p>
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 mt-1">{ranking.nivel}</Badge>
                <p className="text-xs text-muted-foreground mt-1">de {ranking.total} unidades</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comunicados + Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Comunicados Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {comunicados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum comunicado recente.</p>
            ) : comunicados.map(c => (
              <div key={c.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate("/franqueado/comunicados")}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${c.prioridade === "Crítica" ? "bg-destructive" : c.prioridade === "Alta" ? "bg-yellow-500" : "bg-blue-500"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.titulo}</p>
                  <p className="text-xs text-muted-foreground">{c.autorNome} · {format(new Date(c.criadoEm), "dd/MM/yyyy")}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento próximo.</p>
            ) : eventos.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate("/franqueado/agenda")}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] text-primary font-bold">{format(new Date(e.data), "dd")}</span>
                  <span className="text-[8px] text-muted-foreground uppercase">{format(new Date(e.data), "MMM", { locale: ptBR })}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{e.titulo}</p>
                  <p className="text-xs text-muted-foreground">{e.tipo}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Chamados abertos */}
      {chamados.length > 0 && (
        <Card className="glass-card hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Chamados em Aberto
              <Badge variant="secondary" className="ml-auto">{chamados.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

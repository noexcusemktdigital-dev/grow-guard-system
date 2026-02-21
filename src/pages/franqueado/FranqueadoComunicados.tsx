import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft, Mail, MailOpen, MessageSquare, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { getFranqueadoComunicadosUnidade, type FranqueadoComunicado } from "@/data/franqueadoData";
import { format } from "date-fns";

type FiltroPrioridade = "Todas" | "Crítica" | "Alta" | "Normal";
type FiltroStatus = "Todos" | "Não lidos" | "Lidos";

export default function FranqueadoComunicados() {
  const [comunicados, setComunicados] = useState(() => getFranqueadoComunicadosUnidade());
  const [filtroPrioridade, setFiltroPrioridade] = useState<FiltroPrioridade>("Todas");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("Todos");
  const [detalhe, setDetalhe] = useState<FranqueadoComunicado | null>(null);

  const naoLidos = comunicados.filter(c => !c.lido).length;
  const criticos = comunicados.filter(c => c.prioridade === "Crítica" && !c.lido);

  const filtrados = useMemo(() => {
    let list = comunicados.filter(c => {
      if (filtroPrioridade !== "Todas" && c.prioridade !== filtroPrioridade) return false;
      if (filtroStatus === "Não lidos" && c.lido) return false;
      if (filtroStatus === "Lidos" && !c.lido) return false;
      return true;
    });
    // Important (Crítica) non-read items first
    list = [...list].sort((a, b) => {
      if (a.prioridade === "Crítica" && !a.lido && !(b.prioridade === "Crítica" && !b.lido)) return -1;
      if (b.prioridade === "Crítica" && !b.lido && !(a.prioridade === "Crítica" && !a.lido)) return 1;
      return 0;
    });
    return list;
  }, [comunicados, filtroPrioridade, filtroStatus]);

  const marcarLido = (id: string) => {
    setComunicados(prev => prev.map(c => c.id === id ? { ...c, lido: true } : c));
  };

  if (detalhe) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title={detalhe.titulo}
          subtitle={`${detalhe.autorNome} · ${format(new Date(detalhe.criadoEm), "dd/MM/yyyy")}`}
          backButton={
            <Button variant="ghost" size="icon" onClick={() => setDetalhe(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          }
        />
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={detalhe.prioridade === "Crítica" ? "destructive" : "secondary"}>
                {detalhe.prioridade}
              </Badge>
              <Badge variant="outline" className="capitalize">{detalhe.destinatario}</Badge>
              {detalhe.lido && (
                <Badge variant="outline" className="text-green-500 border-green-500/30">
                  <Check className="w-3 h-3 mr-1" /> Lido
                </Badge>
              )}
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{detalhe.conteudo}</p>
            {!detalhe.lido && (
              <Button
                onClick={() => { marcarLido(detalhe.id); setDetalhe({ ...detalhe, lido: true }); }}
                className="mt-4"
              >
                <Check className="w-4 h-4 mr-1" /> Li e concordo
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header alinhado com a matriz */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h1 className="page-header-title">Comunicados da Matriz</h1>
            <Badge variant="outline" className="text-[10px]">Unidade</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Avisos e comunicados direcionados à sua unidade</p>
        </div>
        {naoLidos > 0 && (
          <Badge variant="destructive" className="animate-pulse">{naoLidos} não lidos</Badge>
        )}
      </div>

      {/* Alerta de comunicados críticos */}
      {criticos.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive animate-pulse flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">
                {criticos.length} comunicado(s) crítico(s) pendente(s) de leitura
              </p>
              <p className="text-xs text-muted-foreground">Leia e confirme para ficar em dia com a matriz</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-1.5">
          {(["Todas", "Crítica", "Alta", "Normal"] as FiltroPrioridade[]).map(p => (
            <Button key={p} size="sm" variant={filtroPrioridade === p ? "default" : "outline"} onClick={() => setFiltroPrioridade(p)}>
              {p}
            </Button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(["Todos", "Não lidos", "Lidos"] as FiltroStatus[]).map(s => (
            <Button key={s} size="sm" variant={filtroStatus === s ? "default" : "outline"} onClick={() => setFiltroStatus(s)}>
              {s === "Não lidos" ? <Mail className="w-3.5 h-3.5 mr-1" /> : s === "Lidos" ? <MailOpen className="w-3.5 h-3.5 mr-1" /> : null}
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {filtrados.map(c => (
          <Card
            key={c.id}
            className={`glass-card hover-lift transition-all cursor-pointer ${c.lido ? "opacity-60" : ""} ${c.prioridade === "Crítica" && !c.lido ? "border-destructive/40 bg-destructive/5" : ""}`}
            onClick={() => setDetalhe(c)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${c.prioridade === "Crítica" ? "bg-destructive animate-pulse" : c.prioridade === "Alta" ? "bg-yellow-500" : "bg-blue-500"}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold">{c.titulo}</h3>
                      <Badge variant={c.prioridade === "Crítica" ? "destructive" : "secondary"} className="text-[10px]">
                        {c.prioridade}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{c.autorNome} · {format(new Date(c.criadoEm), "dd/MM/yyyy")}</p>
                    <p className="text-sm text-foreground/80 line-clamp-2">{c.conteudo}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {c.lido ? (
                    <Badge variant="outline" className="text-green-500 border-green-500/30"><Check className="w-3 h-3 mr-1" /> Lido</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={(ev) => { ev.stopPropagation(); marcarLido(c.id); }}>
                      <Check className="w-3.5 h-3.5 mr-1" /> Li e concordo
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtrados.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum comunicado encontrado.</p>
        )}
      </div>
    </div>
  );
}

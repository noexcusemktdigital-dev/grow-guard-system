import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Megaphone, Inbox, AlertTriangle, Eye, CheckCircle2, Archive, Search, Bell, BellRing,
} from "lucide-react";
import { useAnnouncements, useAnnouncementMutations } from "@/hooks/useAnnouncements";
import { useAnnouncementViews, useAnnouncementViewMutations } from "@/hooks/useAnnouncementViews";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const PRIORITY_LABELS: Record<string, string> = { Normal: "Normal", Alta: "Alta", "Crítica": "Crítica" };
const PRIORITY_VARIANTS: Record<string, "default" | "secondary" | "destructive"> = { Normal: "secondary", Alta: "default", "Crítica": "destructive" };
const TYPE_LABELS: Record<string, string> = { Informativo: "Informativo", "Atualização de sistema": "Atualização", "Alerta operacional": "Alerta", Campanha: "Campanha", Institucional: "Institucional", Urgente: "Urgente" };

export default function FranqueadoComunicados() {
  const { user } = useAuth();
  const { data: announcements, isLoading } = useAnnouncements();
  const { data: views } = useAnnouncementViews();
  const { markViewed, confirmRead } = useAnnouncementViewMutations();
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [detailItem, setDetailItem] = useState<any>(null);

  const viewedIds = useMemo(() => new Set((views ?? []).map(v => v.announcement_id)), [views]);
  const confirmedIds = useMemo(() => new Set((views ?? []).filter(v => v.confirmed_at).map(v => v.announcement_id)), [views]);

  const all = useMemo(() => {
    let list = announcements ?? [];
    if (filterPriority !== "all") list = list.filter(a => a.priority === filterPriority);
    if (filterType !== "all") list = list.filter(a => a.type === filterType);
    if (search) list = list.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [announcements, filterPriority, filterType, search]);

  const unread = useMemo(() => all.filter(a => !viewedIds.has(a.id)), [all, viewedIds]);
  const archived = useMemo(() => all.filter(a => viewedIds.has(a.id)), [all, viewedIds]);

  // Critical unconfirmed
  const criticalPending = useMemo(() => {
    return (announcements ?? []).filter(a => a.priority === "Crítica" && !confirmedIds.has(a.id));
  }, [announcements, confirmedIds]);

  function openDetail(item: any) {
    setDetailItem(item);
    if (!viewedIds.has(item.id)) {
      markViewed.mutate(item.id);
    }
  }

  function handleConfirm(id: string) {
    confirmRead.mutate(id, {
      onSuccess: () => toast.success("Leitura confirmada!"),
    });
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Critical Alert Banner */}
      {criticalPending.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <BellRing className="w-5 h-5 text-destructive mt-0.5 animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-destructive">
              {criticalPending.length} comunicado{criticalPending.length > 1 ? "s" : ""} crítico{criticalPending.length > 1 ? "s" : ""} pendente{criticalPending.length > 1 ? "s" : ""} de confirmação
            </p>
            <div className="mt-2 space-y-1">
              {criticalPending.slice(0, 3).map(c => (
                <button
                  key={c.id}
                  className="flex items-center gap-2 text-xs text-destructive/80 hover:text-destructive transition-colors w-full text-left"
                  onClick={() => openDetail(c)}
                >
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span className="truncate">{c.title}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                    {formatDistanceToNow(new Date(c.created_at), { locale: ptBR, addSuffix: true })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Comunicados da Matriz</h1>
            <Badge variant="outline" className="text-[10px]">Unidade</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Avisos e comunicados direcionados à sua unidade</p>
        </div>
        <div className="flex items-center gap-2">
          {unread.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              <Bell className="w-3 h-3 mr-1" /> {unread.length} novo{unread.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Normal">Normal</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
            <SelectItem value="Crítica">Crítica</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-[200px] h-8 text-xs pl-8" />
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground ml-auto">
          <span>{unread.length} não lido(s)</span>
          <span>{archived.length} lido(s)</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="novos">
        <TabsList>
          <TabsTrigger value="novos" className="text-xs">
            Novos {unread.length > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] h-4 min-w-[18px]">{unread.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="arquivados" className="text-xs gap-1">
            <Archive className="w-3.5 h-3.5" /> Lidos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="novos" className="space-y-3 mt-4">
          {unread.length === 0 ? <EmptyState message="Nenhum comunicado novo" /> : unread.map(c => <ComunicadoCard key={c.id} item={c} viewedIds={viewedIds} confirmedIds={confirmedIds} onClick={() => openDetail(c)} />)}
        </TabsContent>
        <TabsContent value="arquivados" className="space-y-3 mt-4">
          {archived.length === 0 ? <EmptyState message="Nenhum comunicado lido" /> : archived.map(c => <ComunicadoCard key={c.id} item={c} viewedIds={viewedIds} confirmedIds={confirmedIds} onClick={() => openDetail(c)} />)}
        </TabsContent>
      </Tabs>

      {/* Detail Sheet */}
      <Sheet open={!!detailItem} onOpenChange={open => !open && setDetailItem(null)}>
        <SheetContent className="sm:max-w-lg">
          {detailItem && (
            <div className="space-y-5 pt-2">
              <SheetHeader>
                <SheetTitle>{detailItem.title}</SheetTitle>
              </SheetHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={PRIORITY_VARIANTS[detailItem.priority] || "secondary"}>
                  {PRIORITY_LABELS[detailItem.priority] || detailItem.priority}
                </Badge>
                {detailItem.type && <Badge variant="outline">{TYPE_LABELS[detailItem.type] || detailItem.type}</Badge>}
                {detailItem.target_roles && (detailItem.target_roles as string[]).length > 0 && (
                  <Badge variant="outline" className="text-[10px]">
                    Para: {(detailItem.target_roles as string[]).join(", ")}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Publicado {formatDistanceToNow(new Date(detailItem.created_at), { locale: ptBR, addSuffix: true })}
                {" · "}
                {format(new Date(detailItem.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              {detailItem.expires_at && (
                <p className="text-xs text-amber-600">
                  Expira em {format(new Date(detailItem.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
              <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed border-t border-border pt-4">
                {detailItem.content || "Sem conteúdo."}
              </div>
              {detailItem.priority === "Crítica" && !confirmedIds.has(detailItem.id) && (
                <div className="border border-destructive/30 rounded-lg p-4 bg-destructive/5 space-y-3">
                  <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                    <AlertTriangle className="w-4 h-4" /> Confirmação obrigatória
                  </div>
                  <p className="text-xs text-muted-foreground">Este comunicado requer sua confirmação de leitura para fins de conformidade.</p>
                  <Button size="sm" variant="destructive" onClick={() => handleConfirm(detailItem.id)} disabled={confirmRead.isPending}>
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Li e concordo
                  </Button>
                </div>
              )}
              {confirmedIds.has(detailItem.id) && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" /> Leitura confirmada
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ComunicadoCard({ item, viewedIds, confirmedIds, onClick }: { item: any; viewedIds: Set<string>; confirmedIds: Set<string>; onClick: () => void }) {
  const isViewed = viewedIds.has(item.id);
  const isConfirmed = confirmedIds.has(item.id);
  return (
    <Card
      className={`hover-lift cursor-pointer transition-all ${!isViewed ? "border-l-4 border-l-primary" : ""} ${item.priority === "critical" && !isConfirmed ? "ring-1 ring-destructive/30" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <Badge variant={PRIORITY_VARIANTS[item.priority] || "secondary"} className="text-[10px]">
                {PRIORITY_LABELS[item.priority] || item.priority}
              </Badge>
              {item.type && (
                <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[item.type] || item.type}</Badge>
              )}
              {item.priority === "critical" && !isConfirmed && (
                <Badge variant="destructive" className="text-[10px] animate-pulse">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Requer confirmação
                </Badge>
              )}
              {isConfirmed && (
                <Badge variant="outline" className="text-[10px] text-emerald-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmado
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {formatDistanceToNow(new Date(item.created_at), { locale: ptBR, addSuffix: true })}
              {item.type && ` · ${TYPE_LABELS[item.type] || item.type}`}
            </p>
            <p className="text-sm text-foreground/80 line-clamp-2">{item.content}</p>
          </div>
          {isViewed && <Eye className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mt-1" />}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  );
}

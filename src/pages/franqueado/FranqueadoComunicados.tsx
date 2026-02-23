import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Megaphone, Inbox, AlertTriangle, Eye, CheckCircle2, Archive,
} from "lucide-react";
import { useAnnouncements, useAnnouncementMutations } from "@/hooks/useAnnouncements";
import { useAnnouncementViews, useAnnouncementViewMutations } from "@/hooks/useAnnouncementViews";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const PRIORITY_LABELS: Record<string, string> = { normal: "Normal", high: "Alta", critical: "Crítica" };
const PRIORITY_VARIANTS: Record<string, "default" | "secondary" | "destructive"> = { normal: "secondary", high: "default", critical: "destructive" };

export default function FranqueadoComunicados() {
  const { user } = useAuth();
  const { data: announcements, isLoading } = useAnnouncements();
  const { data: views } = useAnnouncementViews();
  const { markViewed, confirmRead } = useAnnouncementViewMutations();
  const [filterPriority, setFilterPriority] = useState("all");
  const [detailItem, setDetailItem] = useState<any>(null);

  const viewedIds = useMemo(() => new Set((views ?? []).map(v => v.announcement_id)), [views]);
  const confirmedIds = useMemo(() => new Set((views ?? []).filter(v => v.confirmed_at).map(v => v.announcement_id)), [views]);

  const all = useMemo(() => {
    let list = announcements ?? [];
    if (filterPriority !== "all") list = list.filter(a => a.priority === filterPriority);
    return list;
  }, [announcements, filterPriority]);

  const unread = useMemo(() => all.filter(a => !viewedIds.has(a.id)), [all, viewedIds]);
  const archived = useMemo(() => all.filter(a => viewedIds.has(a.id)), [all, viewedIds]);

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

  const ComunicadoCard = ({ item }: { item: any }) => {
    const isViewed = viewedIds.has(item.id);
    const isConfirmed = confirmedIds.has(item.id);
    return (
      <Card
        className={`glass-card hover-lift cursor-pointer transition-all ${!isViewed ? "border-l-4 border-l-primary" : ""}`}
        onClick={() => openDetail(item)}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <Badge variant={PRIORITY_VARIANTS[item.priority] || "secondary"} className="text-[10px]">
                  {PRIORITY_LABELS[item.priority] || item.priority}
                </Badge>
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
                {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {item.type && ` · ${item.type}`}
              </p>
              <p className="text-sm text-foreground/80 line-clamp-2">{item.content}</p>
            </div>
            {isViewed && <Eye className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mt-1" />}
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-16">
      <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">Comunicados da Matriz</h1>
          <Badge variant="outline" className="text-[10px]">Unidade</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Avisos e comunicados direcionados à sua unidade</p>
      </div>

      <div className="flex items-center gap-3">
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="critical">Crítica</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-4 text-xs text-muted-foreground ml-auto">
          <span>{unread.length} não lido(s)</span>
          <span>{archived.length} arquivado(s)</span>
        </div>
      </div>

      <Tabs defaultValue="novos">
        <TabsList>
          <TabsTrigger value="novos" className="text-xs">
            Novos {unread.length > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] h-4 min-w-[18px]">{unread.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="arquivados" className="text-xs gap-1">
            <Archive className="w-3.5 h-3.5" /> Arquivados
          </TabsTrigger>
        </TabsList>
        <TabsContent value="novos" className="space-y-3 mt-4">
          {unread.length === 0 ? <EmptyState message="Nenhum comunicado novo" /> : unread.map(c => <ComunicadoCard key={c.id} item={c} />)}
        </TabsContent>
        <TabsContent value="arquivados" className="space-y-3 mt-4">
          {archived.length === 0 ? <EmptyState message="Nenhum comunicado arquivado" /> : archived.map(c => <ComunicadoCard key={c.id} item={c} />)}
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
                {detailItem.type && <Badge variant="outline">{detailItem.type}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                Publicado em {format(new Date(detailItem.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {detailItem.content || "Sem conteúdo."}
              </div>
              {detailItem.priority === "critical" && !confirmedIds.has(detailItem.id) && (
                <div className="border border-destructive/30 rounded-lg p-4 bg-destructive/5 space-y-3">
                  <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                    <AlertTriangle className="w-4 h-4" /> Confirmação obrigatória
                  </div>
                  <p className="text-xs text-muted-foreground">Este comunicado requer sua confirmação de leitura.</p>
                  <Button size="sm" variant="destructive" onClick={() => handleConfirm(detailItem.id)} disabled={confirmRead.isPending}>
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Li e concordo
                  </Button>
                </div>
              )}
              {confirmedIds.has(detailItem.id) && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm">
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

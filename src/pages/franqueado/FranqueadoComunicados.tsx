import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Inbox } from "lucide-react";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FranqueadoComunicados() {
  const { data: announcements, isLoading } = useAnnouncements();

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  const comunicados = announcements ?? [];

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h1 className="page-header-title">Comunicados da Matriz</h1>
        <Badge variant="outline" className="text-[10px]">Unidade</Badge>
      </div>
      <p className="text-sm text-muted-foreground">Avisos e comunicados direcionados à sua unidade</p>

      {comunicados.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Nenhum comunicado disponível</p>
          <p className="text-xs text-muted-foreground mt-1">Quando a matriz publicar comunicados, eles aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comunicados.map(c => (
            <Card key={c.id} className="glass-card hover-lift cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold">{c.title}</h3>
                      <Badge variant={c.priority === "critical" ? "destructive" : "secondary"} className="text-[10px]">
                        {c.priority === "critical" ? "Crítica" : c.priority === "high" ? "Alta" : "Normal"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{format(new Date(c.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                    <p className="text-sm text-foreground/80 line-clamp-2">{c.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

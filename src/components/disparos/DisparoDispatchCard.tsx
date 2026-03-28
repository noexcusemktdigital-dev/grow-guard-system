import { forwardRef, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send, Trash2, RotateCcw, Eye } from "lucide-react";

const statusColors: Record<string, string> = {
  sent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  draft: "bg-muted text-muted-foreground",
  sending: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  partial: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  sent: "Enviado",
  scheduled: "Agendado",
  draft: "Rascunho",
  sending: "Enviando...",
  partial: "Parcial",
};

interface Props {
  dispatch: { id: string; title: string; channel: string; status: string; message?: string; image_url?: string; sent_at?: string; scheduled_at?: string; created_at: string; stats?: Record<string, number>; recipients?: string[] };
  index: number;
  onView?: (d: Props["dispatch"]) => void;
  onDelete?: (id: string) => void;
  onResend?: (id: string) => void;
}

export const DisparoDispatchCard = memo(forwardRef<HTMLDivElement, Props>(
  ({ dispatch: d, index, onView, onDelete, onResend }, ref) => {
    const stats = d.stats || {};
    const recipients = (d.recipients as string[]) || [];
    const canResend = d.status === "draft" || d.status === "partial";

    return (
      <Card
        ref={ref}
        className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{d.title}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{d.channel}</p>
            </div>
            <Badge variant="outline" className={`text-[9px] shrink-0 ${statusColors[d.status] || ""}`}>
              {statusLabels[d.status] || d.status}
            </Badge>
          </div>

          {d.message && <p className="text-xs text-muted-foreground line-clamp-2">{d.message}</p>}

          {(stats.sent !== undefined || recipients.length > 0) && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[9px]">
                {stats.sent ?? 0}/{stats.total ?? recipients.length} enviados
              </Badge>
              {stats.failed > 0 && (
                <Badge variant="outline" className="text-[9px] border-red-500/20 text-red-400">
                  {stats.failed} falhas
                </Badge>
              )}
            </div>
          )}

          {d.image_url && (
            <img src={d.image_url} alt="Imagem do disparo" className="w-full h-20 object-cover rounded-md" />
          )}

          <p className="text-[10px] text-muted-foreground">
            {d.sent_at
              ? `Enviado em ${new Date(d.sent_at).toLocaleDateString("pt-BR")}`
              : d.scheduled_at
                ? `Agendado para ${new Date(d.scheduled_at).toLocaleDateString("pt-BR")}`
                : `Criado em ${new Date(d.created_at).toLocaleDateString("pt-BR")}`}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
            {onView && (
              <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={() => onView(d)}>
                <Eye className="w-3 h-3 mr-1" /> Detalhes
              </Button>
            )}
            {canResend && onResend && (
              <Button variant="ghost" size="sm" className="h-7 text-xs flex-1 text-primary" onClick={() => onResend(d.id)}>
                <Send className="w-3 h-3 mr-1" /> Enviar
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => onDelete(d.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
));

DisparoDispatchCard.displayName = "DisparoDispatchCard";

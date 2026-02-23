import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  dispatch: any;
  index: number;
  onClick?: () => void;
}

export function DisparoDispatchCard({ dispatch: d, index, onClick }: Props) {
  const stats = (d.stats as any) || {};
  const recipients = (d.recipients as string[]) || [];

  return (
    <Card
      className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={onClick}
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

        {/* Stats */}
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
          <img src={d.image_url} alt="" className="w-full h-20 object-cover rounded-md" />
        )}

        <p className="text-[10px] text-muted-foreground">
          {d.sent_at
            ? `Enviado em ${new Date(d.sent_at).toLocaleDateString("pt-BR")}`
            : d.scheduled_at
              ? `Agendado para ${new Date(d.scheduled_at).toLocaleDateString("pt-BR")}`
              : `Criado em ${new Date(d.created_at).toLocaleDateString("pt-BR")}`}
        </p>
      </CardContent>
    </Card>
  );
}

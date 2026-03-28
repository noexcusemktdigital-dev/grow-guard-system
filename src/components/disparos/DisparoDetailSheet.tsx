import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Clock, MessageSquare, Image, CheckCircle2, XCircle } from "lucide-react";

const statusLabels: Record<string, string> = {
  sent: "Enviado",
  scheduled: "Agendado",
  draft: "Rascunho",
  sending: "Enviando...",
  partial: "Parcial",
};

interface Props {
  dispatch: { id: string; title: string; channel: string; status: string; message?: string; image_url?: string; sent_at?: string; scheduled_at?: string; created_at: string; delay_seconds?: number; stats?: Record<string, number>; recipients?: string[] } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DisparoDetailSheet({ dispatch: d, open, onOpenChange }: Props) {
  if (!d) return null;

  const stats = d.stats || {};
  const recipients = (d.recipients as string[]) || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{d.title}</SheetTitle>
          <SheetDescription>
            {statusLabels[d.status] || d.status} • {d.channel}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-bold">{stats.total ?? recipients.length}</p>
                  <p className="text-[10px] text-muted-foreground">Destinatários</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-sm font-bold">{stats.sent ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">Enviados</p>
                </div>
              </CardContent>
            </Card>
            {stats.failed > 0 && (
              <Card>
                <CardContent className="p-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <div>
                    <p className="text-sm font-bold">{stats.failed}</p>
                    <p className="text-[10px] text-muted-foreground">Falhas</p>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-bold">{d.delay_seconds}s</p>
                  <p className="text-[10px] text-muted-foreground">Intervalo</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Mensagem</p>
            <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-3 max-w-xs">
              {d.image_url && (
                <img src={d.image_url} alt="Imagem do disparo" className="w-full h-32 object-cover rounded-lg mb-2" />
              )}
              <p className="text-xs whitespace-pre-wrap">{d.message || "—"}</p>
            </div>
          </div>

          {/* Recipients list */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">
              Destinatários ({recipients.length})
            </p>
            <div className="max-h-[200px] overflow-y-auto border rounded-lg divide-y">
              {recipients.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum</p>
              ) : (
                recipients.map((phone, i) => (
                  <div key={i} className="px-3 py-1.5 text-xs font-mono text-muted-foreground">
                    {phone}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="space-y-1 text-[10px] text-muted-foreground">
            <p>Criado: {new Date(d.created_at).toLocaleString("pt-BR")}</p>
            {d.sent_at && <p>Enviado: {new Date(d.sent_at).toLocaleString("pt-BR")}</p>}
            {d.scheduled_at && <p>Agendado: {new Date(d.scheduled_at).toLocaleString("pt-BR")}</p>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

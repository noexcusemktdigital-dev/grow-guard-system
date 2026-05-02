import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useAnnouncementViews, useAnnouncementViewMutations } from "@/hooks/useAnnouncementViews";
import { AlertTriangle, CheckCircle2, Download, ChevronRight } from "lucide-react";
import { toast } from "sonner";

/** Shape returned by get_announcements_with_parent RPC — extended fields beyond the base type. */
interface AnnouncementRow {
  id: string;
  title: string;
  content?: string;
  priority?: string;
  status?: string;
  published_at?: string;
  show_popup?: boolean;
  require_confirmation?: boolean;
  attachment_url?: string;
}

export function AnnouncementPopupDialog({ enabled = true }: { enabled?: boolean }) {
  const { data: announcements } = useAnnouncements();
  const { data: views } = useAnnouncementViews();
  const { markViewed, confirmRead } = useAnnouncementViewMutations();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const viewedIds = useMemo(() => new Set((views ?? []).map(v => v.announcement_id)), [views]);
  const confirmedIds = useMemo(() => new Set((views ?? []).filter(v => v.confirmed_at).map(v => v.announcement_id)), [views]);

  const popupAnnouncements = useMemo((): AnnouncementRow[] => {
    if (!announcements) return [];
    return (announcements as AnnouncementRow[]).filter(a =>
      a.show_popup === true &&
      a.published_at &&
      a.status === "active" &&
      !viewedIds.has(a.id)
    );
  }, [announcements, viewedIds]);

  useEffect(() => {
    if (enabled && popupAnnouncements.length > 0) {
      setOpen(true);
      setCurrentIndex(0);
    }
  }, [popupAnnouncements.length, enabled]);

  const current = popupAnnouncements[currentIndex];
  if (!current) return null;

  const needsConfirmation = current.require_confirmation === true;
  const isConfirmed = confirmedIds.has(current.id);

  const handleDismiss = () => {
    markViewed.mutate(current.id);
    if (currentIndex < popupAnnouncements.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setOpen(false);
    }
  };

  const handleConfirm = () => {
    confirmRead.mutate(current.id, {
      onSuccess: () => {
        toast.success("Leitura confirmada!");
        handleDismiss();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v && needsConfirmation && !isConfirmed) return; // block close if needs confirmation
      if (!v) handleDismiss();
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            {current.priority === "Crítica" && (
              <Badge variant="destructive" className="text-[10px]">
                <AlertTriangle className="w-3 h-3 mr-1" /> Crítico
              </Badge>
            )}
            {current.priority === "Alta" && (
              <Badge className="text-[10px]">Alta prioridade</Badge>
            )}
            {popupAnnouncements.length > 1 && (
              <Badge variant="outline" className="text-[10px] ml-auto">
                {currentIndex + 1} de {popupAnnouncements.length}
              </Badge>
            )}
          </div>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription className="sr-only">Comunicado da rede</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-[40vh] overflow-y-auto">
            {current.content || "Sem conteúdo."}
          </div>

          {current.attachment_url && (
            <a
              href={current.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline p-3 rounded-lg border border-border bg-muted/30"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="truncate">{current.attachment_url.split("/").pop()}</span>
            </a>
          )}

          {needsConfirmation && !isConfirmed ? (
            <div className="border border-destructive/30 rounded-lg p-4 bg-destructive/5 space-y-3">
              <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                <AlertTriangle className="w-4 h-4" /> Confirmação obrigatória
              </div>
              <p className="text-xs text-muted-foreground">Este comunicado requer sua confirmação de leitura para prosseguir.</p>
              <Button size="sm" variant="destructive" onClick={handleConfirm} disabled={confirmRead.isPending}>
                <CheckCircle2 className="w-4 h-4 mr-1" /> Li e concordo
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button onClick={handleDismiss}>
                {currentIndex < popupAnnouncements.length - 1 ? (
                  <>Próximo <ChevronRight className="w-4 h-4 ml-1" /></>
                ) : (
                  "Entendi"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

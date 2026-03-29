// @ts-nocheck
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContentItem } from "@/hooks/useClienteContentV2";
import { format } from "date-fns";

interface ContentPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentHistory: ContentItem[] | undefined;
  onSelect: (content: ContentItem) => void;
}

export function ContentPickerDialog({ open, onOpenChange, contentHistory, onSelect }: ContentPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar conteúdo</DialogTitle>
          <DialogDescription>Escolha um conteúdo gerado para vincular à postagem</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72">
          <div className="space-y-2 pr-2">
            {(contentHistory || []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum conteúdo gerado ainda.</p>
            )}
            {(contentHistory || []).map((c) => (
              <Card
                key={c.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => {
                  onSelect(c);
                  onOpenChange(false);
                }}
              >
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {c.format && <Badge variant="outline" className="text-[10px]">{c.format}</Badge>}
                    <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), "dd/MM/yyyy")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

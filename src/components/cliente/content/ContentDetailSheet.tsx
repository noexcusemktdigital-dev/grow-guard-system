// @ts-nocheck
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Download, ExternalLink } from "lucide-react";
import { ContentVisualRenderer } from "./ContentVisuals";
import type { GeneratedContent } from "./ContentTypes";

interface ContentDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: GeneratedContent | null;
  onCopy: () => void;
  onPost: () => void;
}

export function ContentDetailSheet({ open, onOpenChange, content: c, onCopy, onPost }: ContentDetailSheetProps) {
  if (!c) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">{c.titulo}</SheetTitle>
          <SheetDescription className="flex gap-2">
            <Badge className="text-xs">{c.formato}</Badge>
            <Badge variant="outline" className="text-xs">{c.objetivo}</Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Full visual */}
          <ContentVisualRenderer formato={c.formato} content={c.conteudo_principal} />

          {/* Full caption */}
          {c.legenda && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Legenda</p>
              <div className="rounded-lg bg-muted/40 p-3 text-sm whitespace-pre-wrap leading-relaxed">
                {c.legenda}
              </div>
            </div>
          )}

          {/* Hashtags */}
          {c.hashtags && c.hashtags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Hashtags</p>
              <div className="flex flex-wrap gap-1.5">
                {c.hashtags.map((h: string, j: number) => (
                  <Badge key={j} variant="secondary" className="text-xs">#{h.replace(/^#/, "")}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {c.cta && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">CTA</p>
              <p className="text-sm">{c.cta}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={onCopy} className="flex-1">
              <Copy className="w-4 h-4 mr-1" /> Copiar Tudo
            </Button>
            <Button variant="outline" size="sm" onClick={onPost} className="flex-1">
              <ExternalLink className="w-4 h-4 mr-1" /> Gerar Postagem
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

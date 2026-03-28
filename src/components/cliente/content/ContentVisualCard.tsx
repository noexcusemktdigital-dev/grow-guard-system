import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Download, ExternalLink, Check, Trash2, Eye, Clapperboard } from "lucide-react";
import { ContentVisualRenderer } from "./ContentVisuals";
import type { GeneratedContent } from "./ContentTypes";

interface ContentVisualCardProps {
  content: GeneratedContent;
  index: number;
  onCopy: () => void;
  onPdf: () => void;
  onPost: () => void;
  onApprove: () => void;
  onDelete?: () => void;
  onExpand?: () => void;
  onRecord?: () => void;
  approving: boolean;
  isApproved?: boolean;
  showContext?: { tom?: string; publico?: string; plataforma?: string };
}

export const ContentVisualCard = memo(function ContentVisualCard({
  content: c, index, onCopy, onPdf, onPost, onApprove, onDelete, onExpand, onRecord, approving, isApproved, showContext,
}: ContentVisualCardProps) {
  return (
    <Card id={`content-card-${index}`} className="overflow-hidden group hover:shadow-lg transition-shadow">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Badge className="text-xs">{c.formato}</Badge>
        <Badge variant="outline" className="text-xs">{c.objetivo}</Badge>
        {showContext?.plataforma && (
          <Badge variant="secondary" className="text-[10px] ml-auto">{showContext.plataforma}</Badge>
        )}
      </div>

      <CardContent className="space-y-3 pt-0">
        <h3 className="text-lg font-bold leading-tight">{c.titulo}</h3>

        {/* Context: persona/tone used */}
        {showContext && (showContext.tom || showContext.publico) && (
          <div className="flex flex-wrap gap-1.5">
            {showContext.tom && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">🎯 Tom: {showContext.tom}</span>
            )}
            {showContext.publico && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">👤 {showContext.publico}</span>
            )}
          </div>
        )}

        {/* Content body — format-specific visual */}
        <ContentVisualRenderer formato={c.formato} content={c.conteudo_principal} />

        {/* Caption */}
        {c.legenda && (
          <div className="rounded-lg bg-muted/40 p-3 text-sm whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
            {c.legenda}
          </div>
        )}

        {/* Hashtags */}
        {c.hashtags && c.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {c.hashtags.map((h: string, j: number) => (
              <span key={j} className="text-xs text-primary font-medium">#{h.replace(/^#/, "")}</span>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onCopy}>
            <Copy className="w-4 h-4 mr-1" /> Copiar
          </Button>
          <Button variant="outline" size="sm" onClick={onPdf}>
            <Download className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onPost}>
            <ExternalLink className="w-4 h-4 mr-1" /> Postagem
          </Button>
          {onExpand && (
            <Button variant="ghost" size="sm" onClick={onExpand}>
              <Eye className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          {isApproved && onRecord ? (
            <Button size="sm" onClick={onRecord} className="ml-auto gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Clapperboard className="w-4 h-4" /> Gravar
            </Button>
          ) : (
            <Button size="sm" onClick={onApprove} disabled={approving} className="ml-auto">
              <Check className="w-4 h-4 mr-1" /> Aprovar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

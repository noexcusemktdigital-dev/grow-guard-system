import { useState, useMemo } from "react";
import { FolderOpen, ChevronDown, ChevronRight, Copy, ExternalLink, Search, Filter, Eye, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { ApprovalCountBar } from "@/components/cliente/ApprovalCountBar";
import type { ContentItem } from "@/hooks/useClienteContentV2";
import type { ContentBatch } from "./ContentTypes";
import { parseConteudoPrincipal } from "./ContentTypes";
import { ContentDetailSheet } from "./ContentDetailSheet";

interface BatchFolderViewProps {
  history: ContentItem[];
  navigate: (path: string) => void;
  onDelete?: (id: string) => void;
}

export function BatchFolderView({ history, navigate, onDelete }: BatchFolderViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [expandedContent, setExpandedContent] = useState<ContentItem | null>(null);

  // Filter items
  const filtered = useMemo(() => {
    return history.filter(item => {
      if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (formatFilter !== "all" && item.format !== formatFilter) return false;
      return true;
    });
  }, [history, search, statusFilter, formatFilter]);

  // Get unique formats for filter
  const uniqueFormats = useMemo(() => {
    return [...new Set(history.map(i => i.format).filter(Boolean))];
  }, [history]);

  // Group into batches
  const batches = useMemo(() => {
    if (!filtered.length) return [];
    const sorted = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const groups: ContentBatch[] = [];
    let current: ContentItem[] = [];
    let anchor = new Date(sorted[0].created_at).getTime();

    for (const item of sorted) {
      const t = new Date(item.created_at).getTime();
      if (Math.abs(anchor - t) > 2 * 60 * 1000) {
        if (current.length) groups.push({ date: current[0].created_at, items: current });
        current = [item];
        anchor = t;
      } else {
        current.push(item);
      }
    }
    if (current.length) groups.push({ date: current[0].created_at, items: current });
    return groups;
  }, [filtered]);

  const handleCopyItem = (item: ContentItem) => {
    const r = item.result as Record<string, unknown>;
    let text = item.title + "\n\n";
    if (r?.legenda) text += r.legenda + "\n\n";
    // Smart copy: include all carousel slides
    if (r?.conteudo_principal) {
      const parsed = parseConteudoPrincipal(r.conteudo_principal);
      if (Array.isArray(parsed)) {
        text += parsed.map((s: Record<string, string>, i: number) => `[Slide ${i + 1}] ${s.titulo || ""}\n${s.texto || s.content || ""}`).join("\n\n") + "\n\n";
      }
    }
    if ((r?.hashtags as string[])?.length) text += (r.hashtags as string[]).map((h: string) => `#${h.replace(/^#/, "")}`).join(" ");
    navigator.clipboard.writeText(text);
    toast({ title: "Conteúdo copiado!" });
  };

  const handleExpand = (item: ContentItem) => {
    const r = item.result as Record<string, unknown>;
    setExpandedContent({
      titulo: item.title,
      formato: item.format || r?.formato || "",
      objetivo: item.objective || r?.objetivo || "",
      legenda: r?.legenda,
      hashtags: r?.hashtags,
      conteudo_principal: r?.conteudo_principal,
      cta: r?.cta,
    });
  };

  // Approval counters
  const approvalCounts = useMemo(() => ({
    pending: history.filter(i => i.status !== "approved").length,
    approved: history.filter(i => i.status === "approved").length,
  }), [history]);

  return (
    <div className="space-y-4">
      {/* Approval count bar */}
      {history.length > 0 && (
        <ApprovalCountBar
          pending={approvalCounts.pending}
          approved={approvalCounts.approved}
          label="Conteúdos"
        />
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por título..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar por título" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={formatFilter} onValueChange={setFormatFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Formato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {uniqueFormats.map(f => (
              <SelectItem key={f!} value={f!}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {(search || statusFilter !== "all" || formatFilter !== "all") && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} conteúdo{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {batches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>{search || statusFilter !== "all" || formatFilter !== "all" ? "Nenhum conteúdo encontrado com esses filtros." : "Nenhum conteúdo gerado ainda."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {batches.map((batch, bi) => (
            <BatchFolder key={bi} batch={batch} navigate={navigate} onCopy={handleCopyItem} onExpand={handleExpand} onDelete={onDelete} />
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <ContentDetailSheet
        open={!!expandedContent}
        onOpenChange={open => !open && setExpandedContent(null)}
        content={expandedContent}
        onCopy={() => {
          if (expandedContent) {
            let text = expandedContent.titulo + "\n\n";
            if (expandedContent.legenda) text += expandedContent.legenda + "\n\n";
            if (expandedContent.hashtags?.length) text += expandedContent.hashtags.map((h: string) => `#${h.replace(/^#/, "")}`).join(" ");
            navigator.clipboard.writeText(text);
            toast({ title: "Copiado!" });
          }
        }}
        onPost={() => {
          setExpandedContent(null);
        }}
      />
    </div>
  );
}

function BatchFolder({ batch, navigate, onCopy, onExpand, onDelete }: {
  batch: ContentBatch;
  navigate: (path: string) => void;
  onCopy: (item: ContentItem) => void;
  onExpand: (item: ContentItem) => void;
  onDelete?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dateStr = new Date(batch.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = new Date(batch.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors text-left">
          {open ? <ChevronDown className="w-5 h-5 text-primary shrink-0" /> : <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />}
          <FolderOpen className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-sm">Lote {dateStr}</span>
            <span className="text-xs text-muted-foreground ml-2">às {timeStr} — {batch.items.length} conteúdo{batch.items.length > 1 ? "s" : ""}</span>
          </div>
          <div className="flex gap-1">
            {[...new Set(batch.items.map(i => i.format))].filter(Boolean).map(f => (
              <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
            ))}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 pl-8">
          {batch.items.map(item => {
            const r = item.result as Record<string, unknown>;
            if (!r) return null;
            const formato = ((item.format || r.formato || "") as string).toLowerCase();
            const parsedContent = parseConteudoPrincipal(r.conteudo_principal);

            return (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                  {item.format && <Badge className="text-[10px]">{item.format}</Badge>}
                  {item.objective && <Badge variant="outline" className="text-[10px]">{item.objective}</Badge>}
                  <Badge variant={item.status === "approved" ? "default" : "secondary"} className="text-[10px] ml-auto">
                    {item.status === "approved" ? "Aprovado" : "Pendente"}
                  </Badge>
                </div>
                <CardContent className="space-y-2 pt-1">
                  <h4 className="font-bold text-sm">{item.title}</h4>

                  {formato.includes("carrossel") && Array.isArray(parsedContent) && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {(parsedContent as Array<Record<string, string>>).slice(0, 4).map((s, si: number) => (
                        <div key={si} className="flex-none w-28 rounded-lg bg-primary/5 border p-2">
                          <span className="text-[10px] font-bold text-primary/50">{si + 1}</span>
                          {s.titulo && <p className="text-[11px] font-bold leading-tight">{s.titulo}</p>}
                        </div>
                      ))}
                      {(parsedContent as Array<Record<string, string>>).length > 4 && (
                        <div className="flex-none w-28 rounded-lg bg-muted/50 border p-2 flex items-center justify-center text-xs text-muted-foreground">
                          +{(parsedContent as Array<Record<string, string>>).length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  {(formato.includes("post") || formato.includes("educativo") || formato.includes("autoridade")) && (parsedContent as Record<string, unknown>)?.headline && (
                    <p className="text-sm font-extrabold">{String((parsedContent as Record<string, unknown>).headline)}</p>
                  )}

                  {(formato.includes("video") || formato.includes("vídeo") || formato.includes("roteiro")) && (parsedContent as Record<string, unknown>)?.hook && (
                    <div className="rounded-lg bg-primary/10 p-2 text-center">
                      <p className="text-xs font-bold">🎬 "{String((parsedContent as Record<string, unknown>).hook)}"</p>
                    </div>
                  )}

                  {r.legenda && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{String(r.legenda)}</p>
                  )}

                  <div className="flex gap-2 pt-1 border-t">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onCopy(item)}>
                      <Copy className="w-3 h-3 mr-1" /> Copiar
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onExpand(item)}>
                      <Eye className="w-3 h-3 mr-1" /> Ver
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(`/cliente/postagem?content_id=${item.id}`)}>
                      <ExternalLink className="w-3 h-3 mr-1" /> Postagem
                    </Button>
                    {onDelete && item.status !== "approved" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive ml-auto" onClick={() => onDelete(item.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

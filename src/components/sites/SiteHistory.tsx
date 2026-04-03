import { useState, useMemo } from "react";
import { Globe, Clock, ExternalLink, Download, Eye, Filter, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApprovalCountBar } from "@/components/cliente/ApprovalCountBar";
import { toast } from "@/hooks/use-toast";

export interface SavedSite {
  id: string;
  name: string;
  type: string;
  status: "Rascunho" | "Aprovado" | "Publicado";
  createdAt: string;
  url?: string;
  html?: string;
}

interface Props {
  sites: SavedSite[];
  onPreview: (site: SavedSite) => void;
  onApprove?: (site: SavedSite) => void;
}

const typeLabels: Record<string, string> = {
  lp: "Landing Page",
  "3pages": "3 Páginas",
  "5pages": "5 Páginas",
  "8pages": "8 Páginas",
};

type StatusFilter = "all" | "pending" | "approved";

function normalizeStatus(s: string): "pending" | "approved" | "published" {
  if (s === "Rascunho" || s === "pending") return "pending";
  if (s === "Publicado" || s === "published") return "published";
  return "approved";
}

function statusLabel(s: string): string {
  const n = normalizeStatus(s);
  if (n === "pending") return "Pendente";
  if (n === "published") return "Publicado";
  return "Aprovado";
}

function statusVariant(s: string): "default" | "secondary" | "outline" {
  const n = normalizeStatus(s);
  if (n === "published") return "default";
  if (n === "approved") return "secondary";
  return "outline";
}

export function SiteHistory({ sites, onPreview, onApprove }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const counts = useMemo(() => {
    const pending = sites.filter(s => normalizeStatus(s.status) === "pending").length;
    const approved = sites.filter(s => normalizeStatus(s.status) !== "pending").length;
    return { pending, approved };
  }, [sites]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return sites;
    if (statusFilter === "pending") return sites.filter(s => normalizeStatus(s.status) === "pending");
    return sites.filter(s => normalizeStatus(s.status) !== "pending");
  }, [sites, statusFilter]);

  const handleDownload = (site: SavedSite) => {
    if (!site.html) return;
    const blob = new Blob([site.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${site.name.replace(/\s+/g, "-").toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Site baixado!" });
  };

  if (sites.length === 0) {
    return (
      <div className="text-center py-8">
        <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nenhum site gerado ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Approval bar + filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ApprovalCountBar pending={counts.pending} approved={counts.approved} label="Sites" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[130px]">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.map((s) => (
        <Card key={s.id} className={normalizeStatus(s.status) === "pending" ? "border-amber-200 dark:border-amber-800/30" : ""}>
          <CardContent className="py-4 flex items-center gap-4">
            <Globe className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{s.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusVariant(s.status)} className="text-[9px]">
                  {statusLabel(s.status)}
                </Badge>
                <Badge variant="outline" className="text-[8px]">{typeLabels[s.type] || s.type}</Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {s.createdAt}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Approve inline */}
              {onApprove && normalizeStatus(s.status) === "pending" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1 border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  onClick={() => onApprove(s)}
                >
                  <Check className="w-3.5 h-3.5" /> Aprovar
                </Button>
              )}
              {s.html && (
                <>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onPreview(s)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDownload(s)}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
              {s.url && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild aria-label="Abrir em nova aba">
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

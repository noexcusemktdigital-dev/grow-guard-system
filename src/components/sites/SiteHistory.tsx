import { Globe, Clock, ExternalLink, Download, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export interface SavedSite {
  id: string;
  name: string;
  type: string;
  status: "Rascunho" | "Publicado";
  createdAt: string;
  url?: string;
  html?: string;
}

interface Props {
  sites: SavedSite[];
  onPreview: (site: SavedSite) => void;
}

const typeLabels: Record<string, string> = {
  lp: "Landing Page",
  "3pages": "3 Páginas",
  "5pages": "5 Páginas",
  "8pages": "8 Páginas",
};

export function SiteHistory({ sites, onPreview }: Props) {
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
      {sites.map((s) => (
        <Card key={s.id}>
          <CardContent className="py-4 flex items-center gap-4">
            <Globe className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{s.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={s.status === "Publicado" ? "default" : "outline"} className="text-[9px]">{s.status}</Badge>
                <Badge variant="outline" className="text-[8px]">{typeLabels[s.type] || s.type}</Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {s.createdAt}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
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

// @ts-nocheck
import { ClipboardCheck, FileText, Image, Globe, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApprovalCountBar } from "./ApprovalCountBar";
import { useApprovalStats } from "@/hooks/useApprovalStats";
import { useNavigate } from "react-router-dom";

export function ApprovalDashboard() {
  const { data: stats, isLoading } = useApprovalStats();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando aprovações...
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalPending === 0) return null;

  return (
    <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
      <CardContent className="py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Central de Aprovações</h3>
              <p className="text-[11px] text-muted-foreground">
                {stats.totalPending} item{stats.totalPending !== 1 ? "ns" : ""} aguardando sua revisão
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-100/50 dark:bg-amber-900/30 text-xs">
            {stats.totalPending} pendente{stats.totalPending !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="space-y-3">
          {(stats.contents.pending > 0 || stats.contents.approved > 0) && (
            <button
              className="w-full text-left hover:bg-amber-100/50 dark:hover:bg-amber-900/20 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => navigate("/cliente/conteudos")}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Conteúdos</span>
              </div>
              <ApprovalCountBar
                pending={stats.contents.pending}
                approved={stats.contents.approved}
                label=""
              />
            </button>
          )}

          {(stats.posts.pending > 0 || stats.posts.approved > 0) && (
            <button
              className="w-full text-left hover:bg-amber-100/50 dark:hover:bg-amber-900/20 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => navigate("/cliente/postagem")}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Image className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Artes & Vídeos</span>
              </div>
              <ApprovalCountBar
                pending={stats.posts.pending}
                approved={stats.posts.approved}
                label=""
              />
            </button>
          )}

          {(stats.sites.pending > 0 || stats.sites.approved > 0) && (
            <button
              className="w-full text-left hover:bg-amber-100/50 dark:hover:bg-amber-900/20 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => navigate("/cliente/sites")}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Sites</span>
              </div>
              <ApprovalCountBar
                pending={stats.sites.pending}
                approved={stats.sites.approved}
                label=""
              />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

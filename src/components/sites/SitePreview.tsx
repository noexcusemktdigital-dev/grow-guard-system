import { useState } from "react";
import {
  Monitor, Tablet, Smartphone, Maximize2, Minimize2,
  Download, RotateCcw, Edit3, Coins, Share2, Copy, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ApprovalPanel, type ApprovalStatus } from "@/components/approval/ApprovalPanel";
import { SiteDeployGuide } from "@/components/sites/SiteDeployGuide";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CREDIT_COST = 100;

interface Props {
  html: string;
  siteId?: string;
  siteStatus?: string;
  siteUrl?: string;
  onRegenerate: () => void;
  onEditBriefing: () => void;
  onApprove?: () => void;
  onPublish?: () => void;
  generating: boolean;
}

type Viewport = "desktop" | "tablet" | "mobile";

const viewportWidths: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function SitePreview({ html, siteId, siteStatus, siteUrl, onRegenerate, onEditBriefing, onApprove, onPublish, generating }: Props) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [fullscreen, setFullscreen] = useState(false);

  const isApproved = siteStatus === "Aprovado" || siteStatus === "Publicado";
  const isPublished = siteStatus === "Publicado";

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "site.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Site baixado!", description: "Arquivo HTML pronto para hospedar." });
  };

  const handleCopyLink = () => {
    if (siteUrl) {
      navigator.clipboard.writeText(siteUrl);
      toast({ title: "Link copiado!", description: "Compartilhe com seus clientes." });
    }
  };

  const ViewportButtons = () => (
    <div className="flex items-center gap-1">
      {(["desktop", "tablet", "mobile"] as Viewport[]).map((vp) => {
        const Icon = vp === "desktop" ? Monitor : vp === "tablet" ? Tablet : Smartphone;
        return (
          <Button
            key={vp}
            variant={viewport === vp ? "default" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setViewport(vp)}
          >
            <Icon className="w-4 h-4" />
          </Button>
        );
      })}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between p-3 border-b bg-card">
          <ViewportButtons />
          <Button variant="ghost" size="sm" onClick={() => setFullscreen(false)}>
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-start justify-center overflow-auto bg-muted/30 p-4">
          <iframe
            srcDoc={html}
            sandbox="allow-scripts"
            className="bg-white shadow-2xl rounded-lg transition-all duration-300"
            style={{ width: viewportWidths[viewport], height: "100%", maxWidth: "100%" }}
            title="Preview do site"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Viewport controls */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <ViewportButtons />
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setFullscreen(true)}>
              <Maximize2 className="w-3.5 h-3.5" /> Tela cheia
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* iframe preview */}
      <div className="flex justify-center">
        <div
          className="bg-white rounded-xl shadow-xl overflow-hidden border transition-all duration-300"
          style={{ width: viewportWidths[viewport], maxWidth: "100%" }}
        >
          <iframe
            srcDoc={html}
            sandbox="allow-scripts"
            className="w-full border-0"
            style={{ height: "600px" }}
            title="Preview do site"
          />
        </div>
      </div>

      {/* Approval Panel — only if not yet approved */}
      {!isApproved && (
        <ApprovalPanel
          status="pending"
          onApprove={() => {
            onApprove?.();
            toast({ title: "Site aprovado!", description: "Agora você pode publicar e compartilhar." });
          }}
          onRequestChanges={(note) => {
            onEditBriefing();
            toast({ title: "Ajustes solicitados", description: "Edite o briefing e regenere o site." });
          }}
          onReject={() => {}}
          showReject={false}
          helpText="Ao aprovar, o site fica pronto para publicação e compartilhamento."
        />
      )}

      {isApproved && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">✅ Site aprovado — pronto para publicação</p>
        </div>
      )}

      {/* Published link */}
      {isPublished && siteUrl && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-foreground">Link do site publicado</p>
            </div>
            <div className="flex items-center gap-2 bg-background rounded-lg p-2 border">
              <input
                readOnly
                value={siteUrl}
                className="flex-1 text-xs bg-transparent outline-none text-foreground font-mono"
              />
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleCopyLink} aria-label="Copiar">
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => window.open(siteUrl, "_blank")} aria-label="Abrir em nova aba">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className={`grid gap-3 ${isApproved && !isPublished ? "grid-cols-3" : "grid-cols-2"}`}>
        <Button
          className="w-full gap-2"
          onClick={handleDownload}
          disabled={!isApproved}
        >
          <Download className="w-4 h-4" />
          {isApproved ? "Baixar Código" : "Aprove para Baixar"}
        </Button>

        {isApproved && !isPublished && (
          <Button className="w-full gap-2 bg-green-600 hover:bg-green-700" onClick={onPublish}>
            <Share2 className="w-4 h-4" /> Publicar Link
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2" disabled={generating}>
              <RotateCcw className="w-4 h-4" /> Regenerar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                Regenerar site
              </AlertDialogTitle>
              <AlertDialogDescription>
                Regenerar o site consumirá <strong>{CREDIT_COST} créditos</strong>. Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onRegenerate}>
                Regenerar ({CREDIT_COST} créditos)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Deploy Guide - shown after approval */}
      {isApproved && <SiteDeployGuide />}
    </div>
  );
}

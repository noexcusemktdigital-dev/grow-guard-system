// @ts-nocheck
import { useState } from "react";
import {
  Monitor, Tablet, Smartphone, Maximize2, Minimize2,
  Download, RotateCcw, Edit3, Coins,
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
  onRegenerate: () => void;
  onEditBriefing: () => void;
  onApprove?: () => void;
  generating: boolean;
}

type Viewport = "desktop" | "tablet" | "mobile";

const viewportWidths: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function SitePreview({ html, siteId, siteStatus, onRegenerate, onEditBriefing, onApprove, generating }: Props) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [fullscreen, setFullscreen] = useState(false);

  const isApproved = siteStatus === "Aprovado" || siteStatus === "Publicado";

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
            toast({ title: "Site aprovado!", description: "Agora você pode baixar o código." });
          }}
          onRequestChanges={(note) => {
            onEditBriefing();
            toast({ title: "Ajustes solicitados", description: "Edite o briefing e regenere o site." });
          }}
          onReject={() => {}}
          showReject={false}
          helpText="Ao aprovar, o site fica marcado como pronto para download e publicação."
        />
      )}

      {isApproved && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">✅ Site aprovado — pronto para download e publicação</p>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="w-full gap-2"
          onClick={handleDownload}
          disabled={!isApproved}
        >
          <Download className="w-4 h-4" />
          {isApproved ? "Baixar Código" : "Aprove para Baixar"}
        </Button>

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

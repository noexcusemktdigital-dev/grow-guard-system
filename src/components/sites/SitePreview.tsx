import { useState } from "react";
import {
  Monitor, Tablet, Smartphone, Maximize2, Minimize2,
  Download, RotateCcw, Edit3, BookOpen, Link, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ApprovalPanel, type ApprovalStatus } from "@/components/approval/ApprovalPanel";

interface Props {
  html: string;
  onRegenerate: () => void;
  onEditBriefing: () => void;
  generating: boolean;
}

type Viewport = "desktop" | "tablet" | "mobile";

const viewportWidths: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function SitePreview({ html, onRegenerate, onEditBriefing, generating }: Props) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [fullscreen, setFullscreen] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [siteStatus, setSiteStatus] = useState<ApprovalStatus>("pending");
  const [changeNote, setChangeNote] = useState<string | undefined>();

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

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between p-3 border-b bg-card">
          <div className="flex items-center gap-2">
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
                    <Icon className="w-3.5 h-3.5" />
                  </Button>
                );
              })}
            </div>
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

      {/* Approval Panel */}
      <ApprovalPanel
        status={siteStatus}
        changeNote={changeNote}
        onApprove={() => {
          setSiteStatus("approved");
          toast({ title: "Site aprovado!", description: "Agora você pode baixar o código." });
        }}
        onRequestChanges={(note) => {
          setSiteStatus("changes_requested");
          setChangeNote(note);
          onEditBriefing();
          toast({ title: "Ajustes solicitados", description: "Edite o briefing e regenere o site." });
        }}
        onReject={() => {
          setSiteStatus("rejected");
          toast({ title: "Site rejeitado." });
        }}
        showReject={false}
        helpText="Ao aprovar, o site está pronto para download e publicação no seu domínio."
      />

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="w-full gap-2"
          onClick={handleDownload}
          disabled={siteStatus !== "approved"}
        >
          <Download className="w-4 h-4" />
          {siteStatus === "approved" ? "Baixar Código" : "Aprove para Baixar"}
        </Button>
        <Button variant="outline" className="w-full gap-2" onClick={onRegenerate} disabled={generating}>
          <RotateCcw className="w-4 h-4" /> Regenerar
        </Button>
      </div>

      {/* Publication guide */}
      <Card className="border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => setShowGuide(!showGuide)}>
            <BookOpen className="w-4 h-4 text-primary" />
            <p className="text-xs font-bold">Guia de Publicação</p>
            <Badge variant="outline" className="text-[8px] ml-auto">{showGuide ? "Ocultar" : "Ver"}</Badge>
          </div>
          {showGuide && (
            <div className="space-y-2 text-[11px] text-muted-foreground">
              <div className="flex items-start gap-2"><Badge className="text-[8px] shrink-0">1</Badge> Aprove o site clicando em "Aprovar"</div>
              <div className="flex items-start gap-2"><Badge className="text-[8px] shrink-0">2</Badge> Clique em "Baixar Código" para salvar o arquivo HTML</div>
              <div className="flex items-start gap-2"><Badge className="text-[8px] shrink-0">3</Badge> Acesse o painel da sua hospedagem (Hostinger, Locaweb, Vercel, etc.)</div>
              <div className="flex items-start gap-2"><Badge className="text-[8px] shrink-0">4</Badge> Faça upload do arquivo na pasta raiz do seu domínio</div>
              <div className="flex items-start gap-2"><Badge className="text-[8px] shrink-0">5</Badge> Aguarde a propagação (até 24h)</div>
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <Link className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <Input
              value={publishedUrl}
              onChange={(e) => setPublishedUrl(e.target.value)}
              placeholder="Informe a URL após publicar..."
              className="text-xs h-8"
            />
            {publishedUrl && (
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => toast({ title: "URL salva!" })}>
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

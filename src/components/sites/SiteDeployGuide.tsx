// @ts-nocheck
import { useState } from "react";
import {
  Download, Globe, FolderOpen, Upload, Link2, CheckCircle2,
  Rocket, Headset, ExternalLink, Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const deploySteps = [
  {
    icon: Download,
    title: "Baixe seu site",
    description: "Clique no botão 'Baixar Código' acima para salvar o arquivo HTML no seu computador.",
    time: "10 segundos",
  },
  {
    icon: Globe,
    title: "Acesse sua hospedagem",
    description: "Entre no painel de controle da sua hospedagem. Ex: Hostinger, Locaweb, Vercel, Netlify.",
    time: "2 minutos",
  },
  {
    icon: FolderOpen,
    title: "Gerenciador de arquivos",
    description: "Procure por 'Gerenciador de Arquivos' ou 'File Manager' no painel da hospedagem.",
    time: "1 minuto",
  },
  {
    icon: Upload,
    title: "Faça upload do arquivo",
    description: "Navegue até a pasta 'public_html' ou raiz do domínio e faça upload do arquivo HTML.",
    time: "2 minutos",
  },
  {
    icon: Link2,
    title: "Configure o domínio",
    description: "Aponte seu domínio para o servidor da hospedagem nas configurações de DNS.",
    time: "5 minutos",
  },
  {
    icon: CheckCircle2,
    title: "Pronto!",
    description: "Aguarde até 24h para propagação do DNS. Após isso, seu site estará no ar!",
    time: "até 24h",
  },
];

const hostingProviders = [
  { name: "Hostinger", desc: "Tutorial de upload", url: "https://www.hostinger.com.br/tutoriais/como-fazer-upload-de-site" },
  { name: "Vercel", desc: "Deploy em 1 clique", url: "https://vercel.com/docs/getting-started-with-vercel" },
  { name: "Netlify", desc: "Arrastar e soltar", url: "https://docs.netlify.com/site-deploys/create-deploys/#drag-and-drop" },
  { name: "Locaweb", desc: "Painel de controle", url: "https://www.locaweb.com.br/ajuda/wiki/como-enviar-arquivos-via-gerenciador-de-arquivos/" },
];

export function SiteDeployGuide() {
  const [publishedUrl, setPublishedUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  const handleSaveUrl = () => {
    if (!publishedUrl.trim()) return;
    setSaved(true);
    toast({ title: "🎉 URL salva com sucesso!", description: "Seu site está registrado como publicado." });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="py-5 text-center space-y-1">
          <Rocket className="w-8 h-8 text-primary mx-auto" />
          <h3 className="text-sm font-bold">Como Publicar seu Site</h3>
          <p className="text-[11px] text-muted-foreground">Siga o passo-a-passo para colocar seu site no ar</p>
        </CardContent>
      </Card>

      {/* Steps grid */}
      <div className="grid grid-cols-2 gap-3">
        {deploySteps.map((s, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="py-3 space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                  {i + 1}
                </div>
                <s.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              </div>
              <p className="text-xs font-bold leading-tight">{s.title}</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{s.description}</p>
              <Badge variant="outline" className="text-[8px] gap-1">
                <Clock className="w-2.5 h-2.5" /> {s.time}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hosting providers */}
      <Card>
        <CardContent className="py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Hospedagens Populares</p>
          <div className="grid grid-cols-2 gap-2">
            {hostingProviders.map((h) => (
              <a
                key={h.name}
                href={h.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{h.name}</p>
                  <p className="text-[9px] text-muted-foreground">{h.desc}</p>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Published URL input */}
      <Card className={saved ? "border-green-500/30 bg-green-500/5" : ""}>
        <CardContent className="py-3 space-y-2">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <Label className="text-[10px] font-bold uppercase tracking-wider">Informe a URL do seu site publicado</Label>
          </div>
          <div className="flex gap-2">
            <Input
              value={publishedUrl}
              onChange={(e) => { setPublishedUrl(e.target.value); setSaved(false); }}
              placeholder="https://www.seusite.com.br"
              className="text-xs h-8 flex-1"
            />
            <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSaveUrl} disabled={!publishedUrl.trim() || saved}>
              {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
              {saved ? "Salvo" : "Salvar URL"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Support card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Headset className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold">Precisa de ajuda?</p>
            <p className="text-[10px] text-muted-foreground">Nossa equipe está pronta para te ajudar a publicar seu site</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => navigate("/cliente/suporte")}>
              <Headset className="w-3 h-3" /> Falar com Suporte
            </Button>
            <Badge variant="outline" className="text-[8px]">Resposta em até 4h</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

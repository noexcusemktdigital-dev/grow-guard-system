// @ts-nocheck
import { useState } from "react";
import { Copy, Eye, Globe, MessageCircle, Palette, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function WebsiteChatConfig() {
  const { data: org } = useOrgProfile();
  const [color, setColor] = useState("#6366f1");
  const [welcome, setWelcome] = useState("Olá! Como posso ajudar?");
  const [agentName, setAgentName] = useState("Atendente");
  const [position, setPosition] = useState<"right" | "left">("right");
  const [copied, setCopied] = useState(false);

  const widgetUrl = `${SUPABASE_URL}/functions/v1/website-chat-widget`;
  const apiUrl = `${SUPABASE_URL}/functions/v1/website-chat`;

  const snippet = `<script src="${widgetUrl}" data-org="${org?.api_key || "SUA_API_KEY"}" data-color="${color}" data-welcome="${welcome}" data-agent="${agentName}" data-position="${position}" data-api="${apiUrl}"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4" /> Chat do Site
          </CardTitle>
          <CardDescription>Adicione um chat ao vivo no seu site. Mensagens aparecem em Conversas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!org?.api_key && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Gere uma API Key na seção acima antes de configurar o widget.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Cor primária</Label>
                <div className="flex gap-2 mt-1">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer" />
                  <Input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 h-8 text-xs font-mono" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Mensagem de boas-vindas</Label>
                <Input value={welcome} onChange={(e) => setWelcome(e.target.value)} className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Nome do atendente</Label>
                <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Posição</Label>
                <Select value={position} onValueChange={(v) => setPosition(v as "right" | "left")}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right" className="text-xs">Direita</SelectItem>
                    <SelectItem value="left" className="text-xs">Esquerda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <div className="relative bg-muted/30 rounded-xl p-4 min-h-[280px] flex items-end" style={{ justifyContent: position === "right" ? "flex-end" : "flex-start" }}>
              <Badge variant="outline" className="absolute top-2 right-2 text-[9px] gap-1">
                <Eye className="w-3 h-3" /> Preview
              </Badge>
              <div className="w-[240px]">
                <div className="rounded-xl overflow-hidden shadow-lg border border-border mb-2">
                  <div className="p-3 text-white text-xs font-semibold flex items-center gap-2" style={{ background: color }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>💬</div>
                    <div>
                      <div>{agentName}</div>
                      <div className="text-[10px] opacity-80">Online</div>
                    </div>
                  </div>
                  <div className="bg-background p-3 space-y-2">
                    <div className="bg-muted rounded-xl rounded-bl px-3 py-2 text-[11px] max-w-[80%]">{welcome}</div>
                    <div className="rounded-xl rounded-br px-3 py-2 text-[11px] text-white max-w-[80%] ml-auto" style={{ background: color }}>Quero saber mais!</div>
                  </div>
                  <div className="border-t border-border p-2 flex gap-1">
                    <div className="flex-1 h-7 rounded-full bg-muted/50 border border-border" />
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: color }}>
                      <MessageCircle className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center" style={{ background: color, marginLeft: position === "right" ? "auto" : "0" }}>
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Snippet */}
          <div>
            <Label className="text-xs font-semibold">Código para colar no site</Label>
            <div className="relative mt-1">
              <pre className="bg-muted p-3 rounded-lg text-[11px] font-mono overflow-x-auto whitespace-pre-wrap break-all border">{snippet}</pre>
              <Button size="sm" variant="outline" className="absolute top-2 right-2 h-7 text-[10px] gap-1" onClick={handleCopy}>
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Cole este código antes do {"</body>"} no HTML do seu site.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

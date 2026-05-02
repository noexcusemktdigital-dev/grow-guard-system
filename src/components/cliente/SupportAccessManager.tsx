// @ts-nocheck
import { useState } from "react";
import { Shield, Copy, Clock, X, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSupportTokens, useSupportLogs, useGenerateSupportToken, useRevokeSupportToken } from "@/hooks/useSupportAccess";
import { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow, format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

const DURATION_OPTIONS = [
  { value: "15", label: "15 minutos" },
  { value: "30", label: "30 minutos" },
  { value: "60", label: "1 hora" },
  { value: "custom", label: "Personalizado" },
];

export function SupportAccessManager() {
  const { user } = useAuth();
  const { data: tokens, isLoading } = useSupportTokens();
  const { data: logs } = useSupportLogs();
  const generateMutation = useGenerateSupportToken();
  const revokeMutation = useRevokeSupportToken();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [duration, setDuration] = useState("30");
  const [customMinutes, setCustomMinutes] = useState("");
  const [accessLevel, setAccessLevel] = useState("read_only");
  const [password, setPassword] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const activeTokens = tokens?.filter(t => t.is_active && !isPast(new Date(t.expires_at))) ?? [];

  const handleGenerate = async () => {
    if (!password) return toast.error("Digite sua senha para confirmar");

    setVerifying(true);
    try {
      // Verify password
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password,
      });
      if (signInErr) {
        toast.error("Senha incorreta");
        setVerifying(false);
        return;
      }

      const mins = duration === "custom" ? parseInt(customMinutes) : parseInt(duration);
      if (!mins || mins < 1 || mins > 1440) {
        toast.error("Duração inválida (1-1440 minutos)");
        setVerifying(false);
        return;
      }

      const result = await generateMutation.mutateAsync({
        duration_minutes: mins,
        access_level: accessLevel,
      });

      setGeneratedToken(result.token);
      setPassword("");
    } catch {
      // error handled by mutation
    } finally {
      setVerifying(false);
    }
  };

  const copyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      toast.success("Token copiado!");
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setGeneratedToken(null);
    setPassword("");
    setDuration("30");
    setAccessLevel("read_only");
    setCustomMinutes("");
  };

  const getStatusBadge = (token: Tables<"support_access_tokens">) => {
    if (!token.is_active) {
      if (token.revoked_at) return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Revogado</Badge>;
      return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Expirado</Badge>;
    }
    if (isPast(new Date(token.expires_at))) {
      return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Expirado</Badge>;
    }
    return <Badge className="gap-1 bg-green-600"><CheckCircle2 className="w-3 h-3" /> Ativo</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header + Action */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Acesso Temporário de Suporte
          </CardTitle>
          <CardDescription>
            Autorize temporariamente o suporte a acessar sua conta com segurança total e rastreabilidade completa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Shield className="w-4 h-4" />
            Permitir acesso do suporte
          </Button>

          {activeTokens.length > 0 && (
            <div className="mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                {activeTokens.length} acesso(s) ativo(s)
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active tokens */}
      {tokens && tokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Histórico de Acessos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tokens.map(token => (
                <div key={token.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(token)}
                      <Badge variant="outline" className="text-[10px]">
                        {token.access_level === "full" ? "Acesso total" : "Somente leitura"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Criado {formatDistanceToNow(new Date(token.created_at), { addSuffix: true, locale: ptBR })}
                      {" · "}Expira em {format(new Date(token.expires_at), "dd/MM HH:mm")}
                    </p>
                    {token.ip_created && (
                      <p className="text-[10px] text-muted-foreground/60">IP: {token.ip_created}</p>
                    )}
                  </div>
                  {token.is_active && !isPast(new Date(token.expires_at)) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => revokeMutation.mutate(token.id)}
                      disabled={revokeMutation.isPending}
                      className="gap-1"
                    >
                      <X className="w-3 h-3" /> Revogar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit logs */}
      {logs && logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Log de Auditoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-3 text-xs p-2 rounded border bg-muted/5">
                  <span className="text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), "dd/MM HH:mm:ss")}
                  </span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {log.action === "token_created" ? "Criado" :
                     log.action === "token_validated" ? "Acessado" :
                     log.action === "token_revoked" ? "Revogado" : log.action}
                  </Badge>
                  {log.ip_address && (
                    <span className="text-muted-foreground/60">IP: {log.ip_address}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Autorizar Acesso do Suporte
            </DialogTitle>
          </DialogHeader>

          {generatedToken ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-lg border-2 border-green-500/30 bg-green-500/5">
                <p className="text-sm font-semibold text-green-700 mb-2">Token gerado com sucesso!</p>
                <p className="text-xs text-muted-foreground mb-3">Copie e envie este token para o suporte. Ele não será exibido novamente.</p>
                <div className="flex gap-2">
                  <Input value={generatedToken} readOnly className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={copyToken}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={closeDialog}>Fechar</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Duração do acesso</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {duration === "custom" && (
                  <Input
                    type="number"
                    min={1}
                    max={1440}
                    placeholder="Minutos (máx 1440)"
                    value={customMinutes}
                    onChange={e => setCustomMinutes(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Nível de acesso</Label>
                <RadioGroup value={accessLevel} onValueChange={setAccessLevel} className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/10">
                    <RadioGroupItem value="read_only" id="read_only" className="mt-0.5" />
                    <div>
                      <Label htmlFor="read_only" className="cursor-pointer font-medium flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Somente Leitura
                      </Label>
                      <p className="text-xs text-muted-foreground">O suporte pode visualizar, mas não editar nada</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/10">
                    <RadioGroupItem value="full" id="full" className="mt-0.5" />
                    <div>
                      <Label htmlFor="full" className="cursor-pointer font-medium flex items-center gap-1">
                        <EyeOff className="w-3.5 h-3.5" /> Acesso Completo
                      </Label>
                      <p className="text-xs text-muted-foreground">O suporte pode visualizar e editar (com restrições críticas)</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Confirme sua senha</Label>
                <PasswordInput
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                <Button
                  onClick={handleGenerate}
                  disabled={verifying || generateMutation.isPending || !password}
                >
                  {verifying || generateMutation.isPending ? "Gerando..." : "Gerar Token Seguro"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// @ts-nocheck
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ImagePlus, Send, Trash2, X, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AsyncButton } from "@/components/ui/async-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePublishOrSchedule,
  useScheduledPosts,
  useCancelScheduledPost,
  uploadSocialMedia,
} from "@/hooks/useSocialPublishing";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import type { SocialAccount } from "@/hooks/useSocialAccounts";

interface Props {
  accounts: SocialAccount[];
}

const STATUS_BADGE = {
  scheduled: { label: "Agendado", icon: Clock, className: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  publishing: { label: "Publicando…", icon: Clock, className: "bg-amber-500/15 text-amber-600 border-amber-500/20" },
  published: { label: "Publicado", icon: CheckCircle2, className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" },
  failed: { label: "Falhou", icon: AlertCircle, className: "bg-destructive/15 text-destructive border-destructive/20" },
  canceled: { label: "Cancelado", icon: X, className: "bg-muted text-muted-foreground" },
} as const;

export function SocialPublishTab({ accounts }: Props) {
  const { data: orgId } = useUserOrgId();
  const eligible = useMemo(
    () => accounts.filter((a) => a.status === "active" && (a.platform === "facebook" || a.platform === "instagram")),
    [accounts],
  );

  const [accountId, setAccountId] = useState<string>(eligible[0]?.id ?? "");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const publish = usePublishOrSchedule();
  const cancel = useCancelScheduledPost();
  const { data: posts, isLoading } = useScheduledPosts();

  if (eligible.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Conecte o Facebook ou Instagram na aba <strong>Contas</strong> para criar publicações.
        </CardContent>
      </Card>
    );
  }

  const selectedAccount = eligible.find((a) => a.id === accountId);
  const requiresImage = selectedAccount?.platform === "instagram";

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;
    setUploading(true);
    try {
      const url = await uploadSocialMedia(orgId, file);
      setImageUrl(url);
      toast.success("Imagem enviada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(scheduled: boolean) {
    if (!accountId) return toast.error("Selecione uma conta.");
    if (!caption.trim()) return toast.error("Escreva uma legenda.");
    if (requiresImage && !imageUrl) return toast.error("Instagram exige uma imagem.");

    let scheduled_for: string | undefined;
    if (scheduled) {
      if (!scheduleDate || !scheduleTime) return toast.error("Defina data e hora do agendamento.");
      const dt = new Date(`${scheduleDate}T${scheduleTime}`);
      if (dt.getTime() < Date.now() + 60_000) return toast.error("Agende para pelo menos 1 minuto no futuro.");
      scheduled_for = dt.toISOString();
    }

    try {
      await publish.mutateAsync({
        social_account_id: accountId,
        caption,
        image_url: imageUrl || undefined,
        scheduled_for,
      });
      setCaption("");
      setImageUrl("");
      setScheduleDate("");
      setScheduleTime("");
    } catch {
      /* toast já mostrou */
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Composer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova publicação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Conta</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {eligible.map((a) => (
                  <SelectItem key={a.id} value={a.id} className="capitalize">
                    {a.platform} · {a.account_name ?? a.account_username ?? "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Legenda</Label>
            <Textarea
              rows={5}
              placeholder="O que você quer publicar?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Imagem {requiresImage ? <span className="text-destructive">*</span> : <span className="text-muted-foreground text-xs">(opcional para Facebook)</span>}
            </Label>
            {imageUrl ? (
              <div className="relative inline-block">
                <img src={imageUrl} alt="preview" className="w-32 h-32 rounded-lg object-cover border" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30">
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                {uploading ? (
                  <span className="text-sm text-muted-foreground">Enviando…</span>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ImagePlus className="w-4 h-4" /> Clique para enviar imagem
                  </span>
                )}
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Data (agendar)</Label>
              <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hora</Label>
              <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <AsyncButton
              type="button"
              className="flex-1 gap-1.5"
              loading={publish.isPending && !scheduleDate}
              onClick={() => handleSubmit(false)}
            >
              <Send className="w-4 h-4" /> Publicar agora
            </AsyncButton>
            <AsyncButton
              type="button"
              variant="outline"
              className="flex-1 gap-1.5"
              loading={publish.isPending && !!scheduleDate}
              disabled={!scheduleDate || !scheduleTime}
              onClick={() => handleSubmit(true)}
            >
              <Calendar className="w-4 h-4" /> Agendar
            </AsyncButton>
          </div>
        </CardContent>
      </Card>

      {/* Histórico / agendados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Publicações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <Skeleton className="h-32" />
          ) : !posts || posts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma publicação ainda.</p>
          ) : (
            posts.map((p) => {
              const cfg = STATUS_BADGE[p.status];
              const Icon = cfg.icon;
              return (
                <div key={p.id} className="flex gap-3 p-3 rounded-lg border border-border/50">
                  {p.image_url && (
                    <img src={p.image_url} alt="" className="w-14 h-14 rounded object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{p.caption || <em className="text-muted-foreground">(sem legenda)</em>}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                      <Badge variant="outline" className="text-[10px] capitalize">{p.platform}</Badge>
                      <Badge className={`text-[10px] ${cfg.className}`}>
                        <Icon className="w-2.5 h-2.5 mr-1" />
                        {cfg.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(p.scheduled_for), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {p.error_message && (
                      <p className="text-[10px] text-destructive mt-1">{p.error_message}</p>
                    )}
                  </div>
                  {p.status === "scheduled" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => cancel.mutate(p.id)}
                      disabled={cancel.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

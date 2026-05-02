import { useMemo, useState } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  ImagePlus,
  Send,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Hash,
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Instagram,
  Facebook,
} from "lucide-react";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
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
import type { Tables } from "@/integrations/supabase/typed";
import { cn } from "@/lib/utils";

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

const IG_MAX = 2200;
const FB_MAX = 63206;

// Sugestão simples de hashtags a partir de palavras da legenda
function suggestHashtags(text: string): string[] {
  const stop = new Set([
    "a","o","as","os","de","da","do","das","dos","e","em","no","na","nos","nas","um","uma","uns","umas",
    "para","por","com","que","se","sua","seu","suas","seus","ao","aos","à","às","mais","menos","muito",
    "muita","como","ou","mas","já","sem","ser","é","são","está","estão","ter","tem","temos","você","voce",
    "vocês","vc","vcs","isso","isto","aqui","agora","hoje","amanhã","ontem","mim","meu","minha","nossa","nosso",
  ]);
  const words = (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stop.has(w));
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  return top.map(([w]) => `#${w}`);
}

function PostPreview({
  account,
  caption,
  imageUrl,
}: {
  account: SocialAccount | undefined;
  caption: string;
  imageUrl: string;
}) {
  const isIg = account?.platform === "instagram";
  const handle = account?.account_username || account?.account_name || "sua_conta";

  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[2.2rem] border-[10px] border-foreground/80 bg-background shadow-xl overflow-hidden">
      {/* notch */}
      <div className="h-5 bg-foreground/80 mx-auto w-24 rounded-b-2xl" />
      <div className="bg-background">
        {/* header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white",
              isIg ? "bg-gradient-to-br from-fuchsia-500 to-pink-500" : "bg-blue-600",
            )}
          >
            {isIg ? <Instagram className="w-4 h-4" /> : <Facebook className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{handle}</div>
            <div className="text-[10px] text-muted-foreground">Agora · Pré-visualização</div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* media */}
        <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="text-xs text-muted-foreground p-4 text-center">
              {isIg ? "Adicione uma imagem para visualizar" : "Imagem opcional para Facebook"}
            </div>
          )}
        </div>

        {/* actions */}
        <div className="flex items-center gap-3 px-3 py-2">
          <Heart className="w-5 h-5" />
          <MessageCircle className="w-5 h-5" />
          <Send className="w-5 h-5" />
          <Bookmark className="w-5 h-5 ml-auto" />
        </div>

        {/* caption */}
        <div className="px-3 pb-3 text-xs">
          <span className="font-semibold mr-1">{handle}</span>
          <span className="whitespace-pre-wrap break-words">
            {caption || <span className="text-muted-foreground">Sua legenda aparecerá aqui…</span>}
          </span>
        </div>
      </div>
    </div>
  );
}

function ScheduledWeekGrid({
  posts,
  onCancel,
  cancelling,
}: {
  posts: Tables<'social_scheduled_posts'>[];
  onCancel: (id: string) => void;
  cancelling: boolean;
}) {
  const today = new Date();
  const weekStart = startOfWeek(today, { locale: ptBR });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const scheduled = posts.filter((p) => p.status === "scheduled");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = scheduled.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1.5 text-xs">
        {days.map((d) => {
          const dayPosts = scheduled.filter((p) => isSameDay(new Date(p.scheduled_for), d));
          const isToday = isSameDay(d, today);
          return (
            <div
              key={d.toISOString()}
              className={cn(
                "border rounded-lg p-2 min-h-[80px] flex flex-col",
                isToday && "border-primary/50 bg-primary/5",
              )}
            >
              <div className="text-[10px] uppercase text-muted-foreground">
                {format(d, "EEE", { locale: ptBR })}
              </div>
              <div className={cn("text-sm font-semibold", isToday && "text-primary")}>
                {format(d, "dd")}
              </div>
              <div className="mt-1 space-y-1 flex-1">
                {dayPosts.length === 0 ? (
                  <div className="text-[10px] text-muted-foreground/60">—</div>
                ) : (
                  dayPosts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={cn(
                        "w-full text-left text-[10px] px-1.5 py-1 rounded bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 truncate",
                        selectedId === p.id && "ring-1 ring-blue-500",
                      )}
                    >
                      {format(new Date(p.scheduled_for), "HH:mm")} · {p.platform}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
          {selected.image_url && (
            <img src={selected.image_url} alt="" className="w-14 h-14 rounded object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm line-clamp-2">{selected.caption || "(sem legenda)"}</p>
            <div className="flex gap-2 mt-1 text-[11px] text-muted-foreground">
              <Badge variant="outline" className="text-[10px] capitalize">{selected.platform}</Badge>
              <span>{format(new Date(selected.scheduled_for), "dd/MM HH:mm", { locale: ptBR })}</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            disabled={cancelling}
            onClick={() => {
              onCancel(selected.id);
              setSelectedId(null);
            }}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}

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

  const selectedAccount = eligible.find((a) => a.id === accountId);
  const requiresImage = selectedAccount?.platform === "instagram";
  const maxLen = selectedAccount?.platform === "instagram" ? IG_MAX : FB_MAX;
  const charCount = caption.length;
  const overLimit = charCount > maxLen;

  const hashtagSuggestions = useMemo(() => suggestHashtags(caption), [caption]);

  if (eligible.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Conecte o Facebook ou Instagram na aba <strong>Contas</strong> para criar publicações.
        </CardContent>
      </Card>
    );
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;
    setUploading(true);
    try {
      const url = await uploadSocialMedia(orgId, file);
      setImageUrl(url);
      toast.success("Imagem enviada.");
    } catch (err) {
      reportError(err instanceof Error ? err : new Error(String(err)), { title: "Erro no upload", category: "social.image_upload" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(scheduled: boolean) {
    if (!accountId) return void reportError(new Error("Selecione uma conta."), { title: "Selecione uma conta", category: "social.publish_validation" });
    if (!caption.trim()) return void reportError(new Error("Escreva uma legenda."), { title: "Escreva uma legenda", category: "social.publish_validation" });
    if (overLimit) return void reportError(new Error(`Legenda excede ${maxLen} caracteres.`), { title: `Legenda excede ${maxLen} caracteres`, category: "social.publish_validation" });
    if (requiresImage && !imageUrl) return void reportError(new Error("Instagram exige uma imagem."), { title: "Instagram exige uma imagem", category: "social.publish_validation" });

    let scheduled_for: string | undefined;
    if (scheduled) {
      if (!scheduleDate || !scheduleTime) return void reportError(new Error("Defina data e hora do agendamento."), { title: "Defina data e hora do agendamento", category: "social.schedule_validation" });
      const dt = new Date(`${scheduleDate}T${scheduleTime}`);
      if (dt.getTime() < Date.now() + 60_000) return void reportError(new Error("Agende para pelo menos 1 minuto no futuro."), { title: "Agendamento muito próximo", category: "social.schedule_validation" });
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

  function appendHashtags() {
    if (hashtagSuggestions.length === 0) {
      toast.info("Escreva mais texto para gerar sugestões.");
      return;
    }
    const sep = caption.endsWith("\n") || caption.length === 0 ? "" : "\n\n";
    setCaption((c) => c + sep + hashtagSuggestions.join(" "));
  }

  return (
    <div className="space-y-4">
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
              <div className="flex items-center justify-between">
                <Label>Legenda</Label>
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    overLimit ? "text-destructive font-semibold" : "text-muted-foreground",
                  )}
                >
                  {charCount.toLocaleString("pt-BR")} / {maxLen.toLocaleString("pt-BR")}
                </span>
              </div>
              <Textarea
                rows={6}
                placeholder="O que você quer publicar?"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className={cn(overLimit && "border-destructive")}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-7 text-xs"
                  onClick={appendHashtags}
                >
                  <Hash className="w-3.5 h-3.5" /> Sugerir hashtags
                </Button>
                {hashtagSuggestions.slice(0, 5).map((h) => (
                  <button
                    key={h}
                    type="button"
                    className="text-[11px] text-primary hover:underline"
                    onClick={() => setCaption((c) => `${c}${c.endsWith(" ") || c.length === 0 ? "" : " "}${h}`)}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                Imagem{" "}
                {requiresImage ? (
                  <span className="text-destructive">*</span>
                ) : (
                  <span className="text-muted-foreground text-xs">(opcional para Facebook)</span>
                )}
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

        {/* Preview ao vivo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pré-visualização</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            <PostPreview account={selectedAccount} caption={caption} imageUrl={imageUrl} />
          </CardContent>
        </Card>
      </div>

      {/* Calendário semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Posts agendados desta semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32" />
          ) : (
            <ScheduledWeekGrid
              posts={posts ?? []}
              onCancel={(id) => cancel.mutate(id)}
              cancelling={cancel.isPending}
            />
          )}
        </CardContent>
      </Card>

      {/* Histórico completo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de publicações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
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

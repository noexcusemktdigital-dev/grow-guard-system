import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Facebook, RefreshCw, CheckCircle2, XCircle, Settings, Plus, ExternalLink, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useCrmFunnels, type CrmFunnel } from "@/hooks/useCrmFunnels";
import type { FunnelStage } from "@/components/crm/CrmStageSystem";

import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  can_manage: boolean;
}

interface MetaForm {
  id: string;
  name: string;
  status: string;
  leads_count: number;
  created_time: string;
}

interface SubscribedPage {
  page_id: string;
  page_name: string;
  active: boolean;
  [key: string]: unknown;
}

interface LeadgenMapping {
  id: string;
  page_id: string;
  form_id: string | null;
  funnel_id: string;
  stage: string;
  is_default: boolean;
  crm_funnels?: { name: string } | null;
  [key: string]: unknown;
}

interface LeadgenEvent {
  id: string;
  page_id: string;
  form_id: string | null;
  status: string;
  created_at: string;
}

export default function CrmMetaLeadAdsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { data: funnels } = useCrmFunnels();

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

  // Verifica conexão Facebook diretamente em social_accounts
  const { data: fbAccount } = useQuery({
    queryKey: ["social_facebook_account", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data } = await supabase
        .from("social_accounts")
        .select("account_name, account_id, status")
        .eq("organization_id", orgId)
        .eq("platform", "facebook")
        .eq("status", "active")
        .order("last_synced_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!orgId,
  });

  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<MetaPage | null>(null);
  const [mappingForm, setMappingForm] = useState<{
    page_id: string;
    page_name: string;
    form_id: string | null;
    form_name: string;
    funnel_id: string;
    stage: string;
    is_default: boolean;
  } | null>(null);

  // Mapeamentos página → funil/etapa
  const { data: mappings } = useQuery({
    queryKey: ["meta-leadgen-mappings", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("meta_leadgen_form_mappings")
        .select("*, crm_funnels(name)")
        .eq("organization_id", orgId)
        .eq("active", true);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // Eventos recentes recebidos
  const { data: recentEvents } = useQuery({
    queryKey: ["meta-leadgen-events", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("meta_leadgen_events")
        .select("id, page_id, form_id, status, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) return [];
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // Páginas assinadas (do banco)
  const { data: subscribedPages, isLoading: pagesLoading } = useQuery({
    queryKey: ["meta-leadgen-subscribed-pages", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("meta_leadgen_subscribed_pages")
        .select("*")
        .eq("organization_id", orgId)
        .eq("active", true)
        .order("subscribed_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // Listar páginas do FB
  const listPagesMutation = useMutation({
    mutationFn: async () => {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/meta-leadgen-pages?action=list_pages&org_id=${orgId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: ANON,
          },
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Erro ${res.status}`);
      return (json?.pages ?? []) as MetaPage[];
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const { data, error } = await invokeEdge("meta-leadgen-subscribe", {
        body: { org_id: orgId, page_id: pageId, action: "subscribe" },
      });
      if (error) throw await extractEdgeFunctionError(error);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Página conectada!", description: "Os leads deste formulário chegarão ao seu CRM automaticamente." });
      setPageDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["meta-leadgen-subscribed-pages"] });
      qc.invalidateQueries({ queryKey: ["meta-leadgen-mappings"] });
    },
    onError: (err: unknown) => {
      toast({
        title: "Erro ao conectar página",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const { data, error } = await invokeEdge("meta-leadgen-subscribe", {
        body: { org_id: orgId, page_id: pageId, action: "unsubscribe" },
      });
      if (error) throw await extractEdgeFunctionError(error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Página desconectada" });
      qc.invalidateQueries({ queryKey: ["meta-leadgen-subscribed-pages"] });
      qc.invalidateQueries({ queryKey: ["meta-leadgen-mappings"] });
    },
    onError: (err: unknown) => {
      toast({ title: "Erro ao desconectar página", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    },
  });

  // Salvar mapeamento
  const saveMappingMutation = useMutation({
    mutationFn: async () => {
      if (!mappingForm || !orgId) throw new Error("Dados inválidos");
      const payload: Record<string, unknown> = {
        organization_id: orgId,
        page_id: mappingForm.page_id,
        page_name: mappingForm.page_name,
        form_id: mappingForm.is_default ? null : mappingForm.form_id,
        form_name: mappingForm.is_default ? null : mappingForm.form_name,
        funnel_id: mappingForm.funnel_id || null,
        stage: mappingForm.stage || "Novo Lead",
        is_default: mappingForm.is_default,
        active: true,
      };
      const { error } = await supabase
        .from("meta_leadgen_form_mappings")
        .upsert(payload, { onConflict: "organization_id,page_id,form_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Mapeamento salvo!" });
      qc.invalidateQueries({ queryKey: ["meta-leadgen-mappings"] });
      setMappingDialogOpen(false);
      setMappingForm(null);
    },
    onError: (err: unknown) => {
      toast({ title: "Erro ao salvar", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    },
  });

  const deleteMappingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meta_leadgen_form_mappings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Mapeamento removido" });
      qc.invalidateQueries({ queryKey: ["meta-leadgen-mappings"] });
    },
  });

  const handleConnectMeta = () => {
    if (!orgId) {
      toast({ title: "Organização não identificada", variant: "destructive" });
      return;
    }
    window.location.href = `${SUPABASE_URL}/functions/v1/social-oauth-meta?org_id=${orgId}&redirect_to=crm-leads`;
  };

  // Detectar retorno do OAuth: ?connected=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      toast({
        title: "Facebook conectado!",
        description: "Carregando suas páginas...",
      });
      // Limpar query da URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
      // Recarregar conexão e abrir seletor de páginas
      qc.invalidateQueries({ queryKey: ["social_facebook_account", orgId] });
      qc.invalidateQueries({ queryKey: ["meta-leadgen-subscribed-pages", orgId] });
      // Após um pequeno delay, abrir o seletor
      setTimeout(() => {
        setPageDialogOpen(true);
        listPagesMutation.mutate();
      }, 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const openPageSelector = async () => {
    setPageDialogOpen(true);
    listPagesMutation.mutate();
  };

  const openNewMapping = (pageId: string, pageName: string, isDefault = false) => {
    const defaultFunnel = funnels?.find((f) => f.is_default) ?? funnels?.[0];
    const firstStage = defaultFunnel?.stages?.[0];
    const firstStageKey =
      typeof firstStage === "string" ? firstStage : firstStage?.label ?? firstStage?.key ?? "Novo Lead";
    setMappingForm({
      page_id: pageId,
      page_name: pageName,
      form_id: null,
      form_name: "",
      funnel_id: defaultFunnel?.id ?? "",
      stage: firstStageKey,
      is_default: isDefault,
    });
    setMappingDialogOpen(true);
  };

  const hasMetaConnection = !!fbAccount;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Facebook className="w-5 h-5 text-blue-600" /> Meta Lead Ads → CRM
          </h1>
          <p className="text-xs text-muted-foreground">
            Receba leads de formulários instantâneos do Facebook e Instagram diretamente no seu CRM
          </p>
        </div>
      </div>

      {/* Status da conexão Meta */}
      {!hasMetaConnection ? (
        <Card className="border-primary/20">
          <CardContent className="p-10 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#1877F2]/10 flex items-center justify-center">
              <Facebook className="w-8 h-8 text-[#1877F2]" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h2 className="text-base font-semibold">Conecte seu Facebook para importar leads</h2>
              <p className="text-sm text-muted-foreground">
                Conecte sua conta para que o sistema puxe automaticamente os leads dos seus formulários de anúncio.
              </p>
            </div>
            <Button
              onClick={handleConnectMeta}
              className="gap-2 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
              size="lg"
            >
              <Facebook className="w-4 h-4" /> Conectar com Facebook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Facebook conectado: {fbAccount?.account_name}</p>
              <p className="text-xs text-muted-foreground">
                Agora adicione as Páginas que receberão leads.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={openPageSelector} className="gap-1.5">
              <Plus className="w-4 h-4" /> Adicionar Página
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Páginas conectadas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Páginas conectadas</span>
            <Badge variant="secondary" className="text-[10px]">{subscribedPages?.length ?? 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pagesLoading ? (
            <p className="text-xs text-muted-foreground">Carregando...</p>
          ) : (subscribedPages?.length ?? 0) === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Nenhuma página conectada ainda. Clique em "Adicionar Página" acima.
            </p>
          ) : (
            <div className="space-y-2">
              {(subscribedPages as SubscribedPage[])!.map((p) => {
                const pageMappings = (mappings as LeadgenMapping[] ?? []).filter((m) => m.page_id === p.page_id);
                return (
                  <div key={p.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{p.page_name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          ID: {p.page_id}
                          {p.last_lead_at && (
                            <span className="ml-2">
                              · Último lead: {format(new Date(p.last_lead_at), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => openNewMapping(p.page_id, p.page_name, true)}
                        >
                          <Settings className="w-3 h-3" /> Mapeamento padrão
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => openNewMapping(p.page_id, p.page_name, false)}
                        >
                          <Plus className="w-3 h-3" /> Por formulário
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={() => unsubscribeMutation.mutate(p.page_id)}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {pageMappings.length > 0 && (
                      <div className="pl-3 border-l-2 border-muted space-y-1">
                        {pageMappings.map((m) => (
                          <div key={m.id} className="flex items-center justify-between text-[11px]">
                            <span>
                              {m.is_default ? (
                                <Badge variant="secondary" className="text-[9px] mr-1">Padrão</Badge>
                              ) : (
                                <span className="font-medium">Form: {m.form_name || m.form_id}</span>
                              )}
                              {" → "}
                              <span className="text-primary">{m.crm_funnels?.name ?? "Funil padrão"}</span>
                              {" / "}
                              <span>{m.stage}</span>
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0"
                              onClick={() => deleteMappingMutation.mutate(m.id)}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eventos recentes */}
      {(recentEvents?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Últimos leads recebidos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Quando</TableHead>
                  <TableHead className="text-xs">Página</TableHead>
                  <TableHead className="text-xs">Formulário</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recentEvents as LeadgenEvent[])!.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-[11px]">
                      {format(new Date(e.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-[11px] font-mono">{e.page_id}</TableCell>
                    <TableCell className="text-[11px] font-mono">{e.form_id}</TableCell>
                    <TableCell>
                      <Badge
                        variant={e.status === "processed" ? "default" : e.status === "failed" ? "destructive" : "secondary"}
                        className="text-[9px]"
                      >
                        {e.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog: selecionar página */}
      <Dialog open={pageDialogOpen} onOpenChange={setPageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selecione uma Página</DialogTitle>
            <DialogDescription>
              Escolha qual Página do Facebook receberá leads no CRM.
            </DialogDescription>
          </DialogHeader>
          {listPagesMutation.isPending ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Carregando páginas...</p>
          ) : listPagesMutation.isError ? (
            <p className="text-xs text-destructive py-6 text-center">
              {(listPagesMutation.error as Error)?.message ?? "Erro ao carregar"}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {(listPagesMutation.data ?? []).map((p: MetaPage) => {
                const already = (subscribedPages as SubscribedPage[] | undefined)?.some((sp) => sp.page_id === p.id && sp.active);
                return (
                  <button
                    key={p.id}
                    disabled={already || subscribeMutation.isPending}
                    onClick={() => subscribeMutation.mutate(p.id)}
                    className="w-full text-left p-2.5 border rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.id}</p>
                    </div>
                    {already && <Badge variant="secondary" className="text-[9px]">Já conectada</Badge>}
                  </button>
                );
              })}
              {(listPagesMutation.data?.length ?? 0) === 0 && !listPagesMutation.isPending && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma página encontrada na conta Meta conectada.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: criar mapeamento */}
      <Dialog open={mappingDialogOpen} onOpenChange={setMappingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mappingForm?.is_default ? "Mapeamento padrão" : "Mapear formulário"}
            </DialogTitle>
            <DialogDescription>
              {mappingForm?.is_default
                ? "Define o destino padrão para qualquer formulário desta página sem mapeamento específico."
                : "Define um destino específico para um formulário selecionado."}
            </DialogDescription>
          </DialogHeader>
          {mappingForm && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Página</Label>
                <p className="text-sm">{mappingForm.page_name}</p>
              </div>

              {!mappingForm.is_default && (
                <FormSelector
                  pageId={mappingForm.page_id}
                  orgId={orgId!}
                  value={mappingForm.form_id ?? ""}
                  onChange={(id, name) => setMappingForm({ ...mappingForm, form_id: id, form_name: name })}
                />
              )}

              <div>
                <Label className="text-xs">Funil de destino</Label>
                <Select
                  value={mappingForm.funnel_id}
                  onValueChange={(v) => setMappingForm({ ...mappingForm, funnel_id: v })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(funnels ?? []).map((f: CrmFunnel) => (
                      <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Etapa inicial</Label>
                <Select
                  value={mappingForm.stage}
                  onValueChange={(v) => setMappingForm({ ...mappingForm, stage: v })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const stages: FunnelStage[] =
                        funnels?.find((f) => f.id === mappingForm.funnel_id)?.stages ?? [];
                      const list: Array<FunnelStage | { key: string; label: string }> = stages.length > 0 ? stages : [{ key: "novo", label: "Novo Lead" }];
                      return list.map((s, idx: number) => {
                        const label = typeof s === "string" ? s : s?.label ?? s?.key ?? `Etapa ${idx + 1}`;
                        const value = label;
                        return (
                          <SelectItem key={`${value}-${idx}`} value={value} className="text-xs">
                            {label}
                          </SelectItem>
                        );
                      });
                    })()}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setMappingDialogOpen(false)}>Cancelar</Button>
            <Button
              size="sm"
              disabled={saveMappingMutation.isPending || (!mappingForm?.is_default && !mappingForm?.form_id)}
              onClick={() => saveMappingMutation.mutate()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Sub-componente: seletor de formulários da página ---
function FormSelector({
  pageId,
  orgId,
  value,
  onChange,
}: {
  pageId: string;
  orgId: string;
  value: string;
  onChange: (id: string, name: string) => void;
}) {
  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ["meta-leadgen-forms", pageId, orgId],
    queryFn: async () => {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
      const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/meta-leadgen-pages?action=list_forms&org_id=${orgId}&page_id=${pageId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: ANON,
          },
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Erro ${res.status}`);
      return (json?.forms ?? []) as MetaForm[];
    },
    enabled: !!pageId && !!orgId,
  });

  return (
    <div>
      <Label className="text-xs">Formulário</Label>
      {isLoading ? (
        <p className="text-[11px] text-muted-foreground py-2">Carregando formulários...</p>
      ) : isError ? (
        <p className="text-[11px] text-destructive py-2">
          {(queryError as Error)?.message ?? "Erro ao carregar formulários"}
        </p>
      ) : (
        <Select
          value={value}
          onValueChange={(v) => {
            const f = data?.find((x) => x.id === v);
            onChange(v, f?.name ?? v);
          }}
        >
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione um formulário" /></SelectTrigger>
          <SelectContent>
            {(data ?? []).map((f) => (
              <SelectItem key={f.id} value={f.id} className="text-xs">
                {f.name} <span className="text-muted-foreground ml-1">({f.leads_count} leads)</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

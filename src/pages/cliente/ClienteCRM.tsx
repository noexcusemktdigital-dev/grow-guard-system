// @ts-nocheck

import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCrmLeads, useCrmLeadMutations } from "@/hooks/useClienteCrm";
import { useCrmLeadTaskCounts } from "@/hooks/useCrmLeads";
import { useCrmFunnels, useEnsureDefaultFunnel } from "@/hooks/useClienteCrm";
import { useCrmSettings } from "@/hooks/useCrmSettings";
import { useCrmTeam } from "@/hooks/useCrmTeam";
import { useToast } from "@/hooks/use-toast";
import { useLeadQuota } from "@/hooks/useLeadQuota";
import { UsageQuotaBanner } from "@/components/quota/UsageQuotaBanner";
import { PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { CrmLeadDetailSheet } from "@/components/crm/CrmLeadDetailSheet";
import { CrmNewLeadDialog } from "@/components/crm/CrmNewLeadDialog";
import { CrmFunnelManager } from "@/components/crm/CrmFunnelManager";
import { CrmContactsView } from "@/components/crm/CrmContactsView";
import { CrmCsvImportDialog } from "@/components/crm/CrmCsvImportDialog";
import { CrmSetupBar } from "@/components/crm/CrmSetupBar";
import { CrmTutorial } from "@/components/crm/CrmTutorial";
import { CrmTourGuide } from "@/components/crm/CrmTourGuide";
import { DEFAULT_STAGES, type FunnelStage } from "@/components/crm/CrmStageSystem";
import { type LeadRow } from "./ClienteCRMKanban";
import { ClienteCRMSummary } from "./ClienteCRMSummary";
import { ClienteCRMPipelineFilters } from "./ClienteCRMPipelineFilters";
import { ClienteCRMLeadsView } from "./ClienteCRMLeadsView";
import { ClienteCRMHeader } from "./ClienteCRMHeader";
import { useMemberPermissions } from "@/hooks/useMemberPermissions";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// ===== Main Component =====
export interface ClienteCRMProps {
  hideQuota?: boolean;
  configRoute?: string;
}

export default function ClienteCRM({ hideQuota = false, configRoute }: ClienteCRMProps = {}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: funnelsData, isLoading: funnelsLoading } = useCrmFunnels();
  useEnsureDefaultFunnel();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();
  const { data: crmSettings } = useCrmSettings();
  const { data: team } = useCrmTeam();
  const { activeLeadCount, maxLeads, atLimit: quotaAtLimit, planName } = useLeadQuota();
  const atLimit = hideQuota ? false : quotaAtLimit;
  const { permissions, isAdmin } = useMemberPermissions();
  const canManageCrm = isAdmin || permissions.can_manage_crm;

  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);

  // Determine accessible funnels
  const accessibleFunnels = useMemo(() => {
    if (!funnelsData) return [];
    return funnelsData;
  }, [funnelsData]);

  // Auto-select first funnel
  useEffect(() => {
    if (!selectedFunnelId && accessibleFunnels.length > 0) {
      const def = accessibleFunnels.find(f => f.is_default) || accessibleFunnels[0];
      setSelectedFunnelId(def.id);
    }
  }, [accessibleFunnels, selectedFunnelId]);

  const { data: leads, isLoading: leadsLoading } = useCrmLeads(selectedFunnelId || undefined);
  const { updateLead, deleteLead, markAsLost, bulkUpdateLeads, bulkDeleteLeads, bulkAddTag } = useCrmLeadMutations();

  const [activeTab, setActiveTab] = useState<"pipeline" | "contatos">("pipeline");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [newLeadContact, setNewLeadContact] = useState<LeadRow | null>(null);
  const [funnelManagerOpen, setFunnelManagerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [bulkDeleteLeadsOpen, setBulkDeleteLeadsOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [bulkMoveStage, setBulkMoveStage] = useState("");
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [bulkAssigned, setBulkAssigned] = useState("");
  const [tourActive, setTourActive] = useState(() => !localStorage.getItem("crm_tour_v1"));
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // All filters
  const [filterSource, setFilterSource] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterAssigned, setFilterAssigned] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterValueMin, setFilterValueMin] = useState("");
  const [filterValueMax, setFilterValueMax] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [orderBy, setOrderBy] = useState<"updated_at" | "task_due" | "created_at" | "name">("updated_at");

  const selectedFunnel = useMemo(() => {
    if (!funnelsData || !selectedFunnelId) return null;
    return funnelsData.find(f => f.id === selectedFunnelId) || null;
  }, [funnelsData, selectedFunnelId]);

  const stages: FunnelStage[] = useMemo(() => {
    if (selectedFunnel) {
      const dbStages = selectedFunnel.stages as Array<{ key?: string; label?: string; color?: string; icon?: string }>;
      if (Array.isArray(dbStages) && dbStages.length > 0) {
        return dbStages.map((s: { key?: string; label?: string; color?: string; icon?: string }, idx: number) => ({
          key: s.key || s.label?.toLowerCase().replace(/\s+/g, "_") || `stage_${idx}`,
          label: s.label || `Etapa ${idx + 1}`,
          color: s.color || "blue",
          icon: s.icon || "circle-dot",
        }));
      }
    }
    return DEFAULT_STAGES;
  }, [selectedFunnel]);

  const rawLeads = leads ?? [];
  const leadIds = useMemo(() => rawLeads.map((l) => l.id), [rawLeads]);
  const { data: taskCounts } = useCrmLeadTaskCounts(leadIds);
  const allLeads = useMemo(() => {
    if (!taskCounts) return rawLeads;
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = `${todayStr}T00:00:00.000Z`;
    const tomorrow = `${todayStr}T23:59:59.999Z`;
    return rawLeads.map((l) => {
      const c = taskCounts[l.id];
      if (!c || c.total === 0) return { ...l, crm_tasks: [] };
      // Synthesize minimal crm_tasks entries for backward compatibility with card UI
      const tasks: Array<{ id: string; due_date: string; completed_at: null }> = [];
      for (let i = 0; i < c.overdue; i++) tasks.push({ id: `syn-o-${l.id}-${i}`, due_date: yesterday, completed_at: null });
      for (let i = 0; i < c.total - c.overdue; i++) tasks.push({ id: `syn-p-${l.id}-${i}`, due_date: tomorrow, completed_at: null });
      return { ...l, crm_tasks: tasks };
    });
  }, [rawLeads, taskCounts]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allLeads.forEach(l => l.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [allLeads]);

  const isLoading = leadsLoading || funnelsLoading;

  const activeFilterCount = [filterSource, filterTag, filterAssigned, filterStatus, filterValueMin, filterValueMax, filterDateFrom, filterDateTo].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterSource(""); setFilterTag(""); setFilterAssigned(""); setFilterStatus("");
    setFilterValueMin(""); setFilterValueMax(""); setFilterDateFrom(""); setFilterDateTo("");
  };

  const filteredLeads = useMemo(() => {
    let result = allLeads;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l => l.name.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.phone?.includes(q) || l.company?.toLowerCase().includes(q));
    }
    if (filterSource) result = result.filter(l => l.source === filterSource);
    if (filterTag) result = result.filter(l => l.tags?.includes(filterTag));
    if (filterAssigned) result = result.filter(l => l.assigned_to === filterAssigned);
    if (filterStatus === "won") result = result.filter(l => l.won_at);
    else if (filterStatus === "lost") result = result.filter(l => l.lost_at);
    else if (filterStatus === "active") result = result.filter(l => !l.won_at && !l.lost_at);
    if (filterValueMin) result = result.filter(l => (l.value || 0) >= parseFloat(filterValueMin));
    if (filterValueMax) result = result.filter(l => (l.value || 0) <= parseFloat(filterValueMax));
    if (filterDateFrom) result = result.filter(l => new Date(l.created_at) >= new Date(filterDateFrom));
    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(l => new Date(l.created_at) <= to);
    }
    return result;
  }, [allLeads, search, filterSource, filterTag, filterAssigned, filterStatus, filterValueMin, filterValueMax, filterDateFrom, filterDateTo]);

  const leadsByStage = useMemo(() => {
    const map: Record<string, LeadRow[]> = {};
    stages.forEach(s => { map[s.key] = []; });
    filteredLeads.forEach(l => {
      if (map[l.stage]) map[l.stage].push(l);
      else if (stages.length > 0) map[stages[0].key]?.push(l);
    });
    const earliestDue = (l: LeadRow): number => {
      const tasks = (l.crm_tasks || []).filter((t) => !t.completed_at && t.due_date);
      if (tasks.length === 0) return Number.POSITIVE_INFINITY;
      return Math.min(...tasks.map((t) => new Date(t.due_date!).getTime()));
    };
    const cmp = (a: LeadRow, b: LeadRow): number => {
      switch (orderBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "", "pt-BR");
        case "created_at":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "task_due": {
          const da = earliestDue(a);
          const db = earliestDue(b);
          if (da === db) return 0;
          return da - db; // ascending; leads without tasks (Infinity) go last
        }
        case "updated_at":
        default: {
          const ua = new Date(a.updated_at || a.created_at).getTime();
          const ub = new Date(b.updated_at || b.created_at).getTime();
          return ub - ua;
        }
      }
    };
    Object.keys(map).forEach((k) => { map[k] = [...map[k]].sort(cmp); });
    return map;
  }, [filteredLeads, stages, orderBy]);

  const handleDragStart = (e: DragStartEvent) => setDraggingId(String(e.active.id));
  const handleDragEnd = async (e: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = e;
    if (!over) return;
    const leadId = String(active.id);
    const overId = String(over.id);

    // Validate that overId is a valid stage key
    const validStageKeys = stages.map(s => s.key);
    let newStage: string | null = null;

    if (validStageKeys.includes(overId)) {
      // Dropped directly on a column
      newStage = overId;
    } else {
      // Dropped on another card — find which stage that card belongs to
      const targetLead = allLeads.find(l => l.id === overId);
      if (targetLead && validStageKeys.includes(targetLead.stage)) {
        newStage = targetLead.stage;
      }
    }

    if (!newStage) return;
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    // Backtrack control based on funnel configuration
    const currentStageIndex = stages.findIndex(s => s.key === lead.stage);
    const targetStageIndex = stages.findIndex(s => s.key === newStage);
    const isMovingBack =
      currentStageIndex >= 0 && targetStageIndex >= 0 && targetStageIndex < currentStageIndex;

    if (isMovingBack) {
      const funnel = (funnelsData || []).find(f => f.id === lead.funnel_id);
      const mode = funnel?.backtrack_mode || (funnel?.allow_backtrack === false ? "block" : "allow");

      if (mode === "block" || funnel?.allow_backtrack === false) {
        toast({
          title: "Retrocesso não permitido",
          description: "Este funil não permite retroceder etapas.",
          variant: "destructive",
        });
        return;
      }

      if (mode === "warn") {
        const currentLabel = stages[currentStageIndex]?.label || lead.stage;
        const targetLabel = stages[targetStageIndex]?.label || newStage;
        const actorEmail = user?.email || "um usuário";

        if (orgId) {
          try {
            // Notify all admins of the org
            const { data: admins } = await supabase
              .from("user_roles")
              .select("user_id")
              .eq("organization_id", orgId)
              .in("role", ["cliente_admin", "admin", "super_admin"]);

            const rows = (admins || []).map((a: { user_id: string }) => ({
              user_id: a.user_id,
              organization_id: orgId,
              title: "Lead retrocedeu no funil",
              message: `Lead "${lead.name}" foi movido de "${currentLabel}" para "${targetLabel}" por ${actorEmail}`,
              type: "CRM",
              action_url: "/crm",
            }));
            if (rows.length > 0) {
              await supabase.from("client_notifications").insert(rows);
            }
          } catch {
            // silent — não bloquear a movimentação
          }
        }

        toast({
          title: "⚠️ Lead retrocedido",
          description: "O administrador foi notificado sobre este retrocesso.",
        });
      }
    }

    updateLead.mutate({ id: leadId, stage: newStage });
  };

  const hasFilters = activeFilterCount > 0;
  const someLeadsSelected = selectedLeadIds.size > 0;

  const toggleLeadSelection = (id: string) => {
    const next = new Set(selectedLeadIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedLeadIds(next);
  };

  const toggleAllLeads = () => {
    if (filteredLeads.every(l => selectedLeadIds.has(l.id))) setSelectedLeadIds(new Set());
    else setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
  };

  const handleBulkMoveStage = (stage: string) => {
    bulkUpdateLeads.mutate({ ids: Array.from(selectedLeadIds), fields: { stage } });
    setSelectedLeadIds(new Set());
    toast({ title: `Leads movidos para "${stages.find(s => s.key === stage)?.label || stage}"` });
  };

  const handleBulkAssign = (userId: string) => {
    bulkUpdateLeads.mutate({ ids: Array.from(selectedLeadIds), fields: { assigned_to: userId } });
    setSelectedLeadIds(new Set());
    toast({ title: "Responsável atribuído em massa" });
  };

  const handleBulkAddTag = () => {
    if (!bulkTagInput.trim()) return;
    const tag = bulkTagInput.trim();
    const ids = Array.from(selectedLeadIds);
    if (ids.length > 0) {
      bulkAddTag.mutate({ ids, tag });
    }
    setBulkTagInput("");
    setSelectedLeadIds(new Set());
    toast({ title: "Tag adicionada em massa" });
  };

  const handleBulkTransferFunnel = (funnelId: string) => {
    const targetFunnel = accessibleFunnels.find(f => f.id === funnelId);
    if (!targetFunnel) return;
    const targetStages = targetFunnel.stages as Array<{ key?: string; label?: string }>;
    const firstStageKey = Array.isArray(targetStages) && targetStages.length > 0
      ? (targetStages[0].key || targetStages[0].label?.toLowerCase().replace(/\s+/g, "_") || "novo")
      : "novo";
    bulkUpdateLeads.mutate({ ids: Array.from(selectedLeadIds), fields: { funnel_id: funnelId, stage: firstStageKey } });
    setSelectedLeadIds(new Set());
    toast({ title: `Leads transferidos para "${targetFunnel.name}"` });
  };

  const handleBulkMarkLost = () => {
    bulkUpdateLeads.mutate({ ids: Array.from(selectedLeadIds), fields: { lost_at: new Date().toISOString(), stage: "perdido" } });
    setSelectedLeadIds(new Set());
    toast({ title: "Leads marcados como perdidos" });
  };

  const handleBulkDeleteLeads = () => {
    bulkDeleteLeads.mutate(Array.from(selectedLeadIds));
    setSelectedLeadIds(new Set());
    setBulkDeleteLeadsOpen(false);
    toast({ title: "Leads excluídos" });
  };

  // Pipeline summary (hooks must be before early returns)
  const pipelineSummary = useMemo(() => {
    const activeLeads = filteredLeads.filter(l => !l.won_at && !l.lost_at);
    const totalValue = activeLeads.reduce((s, l) => s + (l.value || 0), 0);
    const wonLeads = filteredLeads.filter(l => l.won_at);
    const wonValue = wonLeads.reduce((s, l) => s + (l.value || 0), 0);
    const lostLeads = filteredLeads.filter(l => l.lost_at);
    const closedLeads = wonLeads.length + lostLeads.length;
    const convRate = closedLeads > 0 ? Math.round((wonLeads.length / closedLeads) * 100) : 0;
    const avgValue = activeLeads.length > 0 ? Math.round(totalValue / activeLeads.length) : 0;
    return { totalLeads: activeLeads.length, totalValue, wonLeads: wonLeads.length, wonValue, convRate, avgValue };
  }, [filteredLeads]);

  const stageValues = useMemo(() => {
    const map: Record<string, number> = {};
    stages.forEach(s => {
      const stageLeads = leadsByStage[s.key] || [];
      map[s.key] = stageLeads.reduce((sum, l) => sum + (l.value || 0), 0);
    });
    return map;
  }, [leadsByStage, stages]);

  const totalPipelineValue = useMemo(() => Object.values(stageValues).reduce((a, b) => a + b, 0), [stageValues]);

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="CRM de Vendas" subtitle="Gerencie seus leads e oportunidades" icon={<Users className="w-5 h-5 text-primary" />} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const draggingLead = draggingId ? allLeads.find(l => l.id === draggingId) : null;

  const handleCreateLeadFromContact = (contact: Record<string, unknown>) => {
    setNewLeadContact(contact);
    setActiveTab("pipeline");
    setNewLeadOpen(true);
  };

  return (
    <div className="w-full space-y-5">
      <CrmTutorial open={tutorialOpen} onOpenChange={setTutorialOpen} />
      <CrmSetupBar
        onOpenNewLead={() => setNewLeadOpen(true)}
        onOpenFunnelManager={() => setFunnelManagerOpen(true)}
        configRoute={configRoute}
      />
      <ClienteCRMHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        allLeadsCount={allLeads.length}
        crmSettingsLeadRouletteEnabled={crmSettings?.lead_roulette_enabled}
        atLimit={atLimit}
        view={view}
        setView={setView}
        setNewLeadOpen={setNewLeadOpen}
        setCsvImportOpen={setCsvImportOpen}
        setTutorialOpen={setTutorialOpen}
        tutorialOpen={tutorialOpen}
        configRoute={configRoute}
        showConfig={canManageCrm}
      />

      {/* ===== CONTACTS TAB ===== */}
      {activeTab === "contatos" && (
        <CrmContactsView onCreateLeadFromContact={handleCreateLeadFromContact} onBackToPipeline={() => setActiveTab("pipeline")} />
      )}

      {/* ===== PIPELINE TAB ===== */}
      {activeTab === "pipeline" && (
        <>
          {/* Empty State: No funnels */}
          {!funnelsLoading && accessibleFunnels.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Settings2 className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Configure seu primeiro funil</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  Antes de adicionar leads, crie pelo menos um funil com as etapas do seu processo comercial.
                </p>
                {canManageCrm && (
                  <Button onClick={() => navigate(configRoute || "/cliente/crm/config")} className="gap-2">
                    <Settings2 className="w-4 h-4" /> Criar Funil
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
          <>
          {/* Lead Quota Banner */}
          {!hideQuota && (
            <UsageQuotaBanner
              used={activeLeadCount}
              limit={maxLeads}
              label="leads"
              planName={planName}
            />
          )}

          {/* Pipeline Summary */}
          {allLeads.length > 0 && (
            <div data-tour="summary">
              <ClienteCRMSummary pipelineSummary={pipelineSummary} />
            </div>
          )}
          {/* Funnel selector + Search + Unified Filter + Bulk Actions */}
          <ClienteCRMPipelineFilters
            accessibleFunnels={accessibleFunnels}
            selectedFunnelId={selectedFunnelId}
            setSelectedFunnelId={setSelectedFunnelId}
            search={search}
            setSearch={setSearch}
            filtersOpen={filtersOpen}
            setFiltersOpen={setFiltersOpen}
            activeFilterCount={activeFilterCount}
            hasFilters={hasFilters}
            clearAllFilters={clearAllFilters}
            filterSource={filterSource}
            setFilterSource={setFilterSource}
            filterTag={filterTag}
            setFilterTag={setFilterTag}
            filterAssigned={filterAssigned}
            setFilterAssigned={setFilterAssigned}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterValueMin={filterValueMin}
            setFilterValueMin={setFilterValueMin}
            filterValueMax={filterValueMax}
            setFilterValueMax={setFilterValueMax}
            filterDateFrom={filterDateFrom}
            setFilterDateFrom={setFilterDateFrom}
            filterDateTo={filterDateTo}
            setFilterDateTo={setFilterDateTo}
            allTags={allTags}
            team={team}
            selectionMode={selectionMode}
            setSelectionMode={setSelectionMode}
            setSelectedLeadIds={setSelectedLeadIds}
            someLeadsSelected={someLeadsSelected}
            selectedLeadIds={selectedLeadIds}
            stages={stages}
            handleBulkMoveStage={handleBulkMoveStage}
            handleBulkAssign={handleBulkAssign}
            bulkTagInput={bulkTagInput}
            setBulkTagInput={setBulkTagInput}
            handleBulkAddTag={handleBulkAddTag}
            handleBulkTransferFunnel={handleBulkTransferFunnel}
            handleBulkMarkLost={handleBulkMarkLost}
            setBulkDeleteLeadsOpen={setBulkDeleteLeadsOpen}
            orderBy={orderBy}
            setOrderBy={setOrderBy}
          />

          <ClienteCRMLeadsView
            view={view}
            allLeads={allLeads}
            filteredLeads={filteredLeads}
            stages={stages}
            leadsByStage={leadsByStage}
            stageValues={stageValues}
            totalPipelineValue={totalPipelineValue}
            selectionMode={selectionMode}
            selectedLeadIds={selectedLeadIds}
            toggleLeadSelection={toggleLeadSelection}
            toggleAllLeads={toggleAllLeads}
            setSelectedLead={setSelectedLead}
            setNewLeadOpen={setNewLeadOpen}
            draggingId={draggingId}
            sensors={sensors}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
            setSelectedLeadIds={setSelectedLeadIds}
            onCopyPhone={(lead) => {
              if (lead.phone) {
                navigator.clipboard.writeText(lead.phone);
                toast({ title: "Telefone copiado" });
              } else {
                toast({ title: "Lead sem telefone", variant: "destructive" });
              }
            }}
            onMarkLost={(lead) => {
              markAsLost.mutate({ id: lead.id });
              toast({ title: "Lead marcado como perdido" });
            }}
            onDelete={(lead) => {
              deleteLead.mutate(lead.id);
              toast({ title: "Lead excluído" });
            }}
            onUpdateTemperature={(lead, temp) => {
              updateLead.mutate({ id: lead.id, temperature: temp });
            }}
          />
          </>
          )}
        </>
      )}

      {/* Lead Detail Sheet */}
      <CrmLeadDetailSheet lead={selectedLead} onClose={() => setSelectedLead(null)} stages={stages} funnels={accessibleFunnels.map(f => ({ id: f.id, name: f.name, stages: f.stages as Array<{ key?: string; label?: string; color?: string; icon?: string }>, custom_fields_schema: f.custom_fields_schema || [] }))} currentFunnelId={selectedFunnelId || undefined} />

      {/* New Lead Dialog */}
      <CrmNewLeadDialog open={newLeadOpen} onOpenChange={(o) => { setNewLeadOpen(o); if (!o) setNewLeadContact(null); }} defaultStage={stages[0]?.key || "novo"} funnelId={selectedFunnelId || undefined} prefillContact={newLeadContact} />

      {/* Funnel Manager */}
      <CrmFunnelManager open={funnelManagerOpen} onOpenChange={setFunnelManagerOpen} />

      {/* CSV Import Dialog (for leads) */}
      <CrmCsvImportDialog open={csvImportOpen} onOpenChange={setCsvImportOpen} />

      {/* Bulk Delete Leads Confirmation */}
      <AlertDialog open={bulkDeleteLeadsOpen} onOpenChange={setBulkDeleteLeadsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedLeadIds.size} lead(s)?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Todos os dados associados serão perdidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteLeads} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CrmTourGuide active={tourActive} onFinish={() => {
        setTourActive(false);
        // Após o tour, abre o tutorial se nunca foi visto
        if (!localStorage.getItem("crm_gps_tutorial_v2")) {
          setTutorialOpen(true);
        }
      }} />
    </div>
  );
}

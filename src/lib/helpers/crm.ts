import type { Lead, Activity, Task, LeadFile, LeadProposal, FunnelType } from "@/types/crm";
import { mockLeads, mockActivities, mockTasks, mockFiles, mockProposals } from "@/mocks/crm";

export function getLeadsByFunnel(funnel: FunnelType): Lead[] {
  return mockLeads.filter((l) => l.funnel === funnel);
}

export function getLeadsByStage(funnel: FunnelType, stage: string): Lead[] {
  return mockLeads.filter((l) => l.funnel === funnel && l.stage === stage);
}

export function getActivitiesForLead(leadId: string): Activity[] {
  return mockActivities.filter((a) => a.leadId === leadId);
}

export function getTasksForLead(leadId: string): Task[] {
  return mockTasks.filter((t) => t.leadId === leadId);
}

export function getFilesForLead(leadId: string): LeadFile[] {
  return mockFiles.filter((f) => f.leadId === leadId);
}

export function getProposalsForLead(leadId: string): LeadProposal[] {
  return mockProposals.filter((p) => p.leadId === leadId);
}
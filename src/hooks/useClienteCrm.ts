// Re-exports CRM hooks - Cliente SaaS uses the same CRM tables
// The organization_id filter ensures data isolation
export { useCrmLeads, useCrmLeadById, useCrmLeadMutations } from "./useCrmLeads";
export { useCrmFunnels, useCrmFunnelMutations, useEnsureDefaultFunnel } from "./useCrmFunnels";
export { useCrmActivities, useCrmActivityMutations } from "./useCrmActivities";
export { useCrmTasks, useCrmTaskMutations } from "./useCrmTasks";
export { useCrmSettings, useCrmSettingsMutations } from "./useCrmSettings";
export { useCrmAutomations, useCrmAutomationMutations } from "./useCrmAutomations";
export { useCrmTeam } from "./useCrmTeam";
export { useCrmProposals, useCrmProposalMutations } from "./useCrmProposals";
export { useCrmProducts, useCrmProductMutations } from "./useCrmProducts";
export { useCrmPartners, useCrmPartnerMutations } from "./useCrmPartners";
export { useCrmLeadProducts, useCrmLeadProductMutations } from "./useCrmLeadProducts";

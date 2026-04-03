import { useAuth } from "@/contexts/AuthContext";
import { useUserOrganizations } from "@/hooks/useUserOrganizations";
import { useUserOrgId, setStoredOrgId } from "@/hooks/useUserOrgId";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkspaceSwitcherProps {
  collapsed: boolean;
}

export function WorkspaceSwitcher({ collapsed }: WorkspaceSwitcherProps) {
  const { user } = useAuth();
  const { data: organizations } = useUserOrganizations();
  const { data: currentOrgId } = useUserOrgId();
  const queryClient = useQueryClient();

  const currentOrg = organizations?.find((o) => o.org_id === currentOrgId);
  const hasMultipleOrgs = (organizations?.length ?? 0) > 1;

  const handleSwitch = (orgId: string) => {
    if (!user || orgId === currentOrgId) return;
    setStoredOrgId(user.id, orgId);
    // Invalidate all queries that depend on orgId
    queryClient.invalidateQueries();
  };

  if (!organizations || organizations.length === 0) return null;

  const initial = currentOrg?.org_name?.charAt(0)?.toUpperCase() || "?";

  if (collapsed) {
    if (!hasMultipleOrgs) {
      return (
        <div className="flex justify-center py-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center text-xs font-bold text-sidebar-primary">
            {initial}
          </div>
        </div>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex justify-center py-2 w-full hover:bg-white/[0.04] transition-colors">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center text-xs font-bold text-sidebar-primary">
              {initial}
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-56">
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.org_id}
              onClick={() => handleSwitch(org.org_id)}
              className="flex items-center gap-2 text-xs"
            >
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                {org.org_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <span className="truncate flex-1">{org.org_name}</span>
              {org.org_id === currentOrgId && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (!hasMultipleOrgs) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-2.5 mx-1.5">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center text-xs font-bold text-sidebar-primary flex-shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-white truncate">{currentOrg?.org_name || "Workspace"}</p>
          <p className="text-[10px] text-sidebar-muted truncate">Workspace</p>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 px-3 py-2.5 mx-1.5 w-[calc(100%-12px)] rounded-lg hover:bg-white/[0.04] transition-colors text-left">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center text-xs font-bold text-sidebar-primary flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-white truncate">{currentOrg?.org_name || "Workspace"}</p>
            <p className="text-[10px] text-sidebar-muted truncate">Workspace</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-sidebar-muted flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-56">
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.org_id}
            onClick={() => handleSwitch(org.org_id)}
            className="flex items-center gap-2 text-xs"
          >
            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
              {org.org_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <span className="truncate flex-1">{org.org_name}</span>
            {org.org_id === currentOrgId && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

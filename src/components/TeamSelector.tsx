import { X } from "lucide-react";
import { useOrgTeams } from "@/hooks/useOrgTeams";
import { Label } from "@/components/ui/label";

const TEAM_COLORS: Record<string, string> = {
  vendas: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  marketing: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  suporte: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  juridico: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  operacoes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  financeiro: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface TeamSelectorProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
  showLabel?: boolean;
}

export function TeamSelector({ selectedIds, onToggle, showLabel = true }: TeamSelectorProps) {
  const { data: teams } = useOrgTeams();

  if (!teams || teams.length === 0) return null;

  return (
    <div>
      {showLabel && <Label className="mb-2 block">Times / Funções</Label>}
      <div className="flex flex-wrap gap-2">
        {teams.map((team) => {
          const isSelected = selectedIds.includes(team.id);
          const color = TEAM_COLORS[team.slug] || "bg-muted text-muted-foreground";
          return (
            <button
              key={team.id}
              type="button"
              onClick={() => onToggle(team.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isSelected
                  ? `${color} border-transparent ring-2 ring-primary/30`
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {team.name}
              {isSelected && <X className="w-3 h-3 inline ml-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { TEAM_COLORS };

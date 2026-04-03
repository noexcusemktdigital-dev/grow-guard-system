import { cn } from "@/lib/utils";

interface ApprovalCountBarProps {
  pending: number;
  approved: number;
  label: string;
  className?: string;
}

export function ApprovalCountBar({ pending, approved, label, className }: ApprovalCountBarProps) {
  const total = pending + approved;
  if (total === 0) return null;
  const pct = Math.round((approved / total) * 100);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          <span className="text-amber-500 font-semibold">{pending}</span>
          {" pendente"}{pending !== 1 ? "s" : ""}
          {" · "}
          <span className="text-emerald-500 font-semibold">{approved}</span>
          {" aprovado"}{approved !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

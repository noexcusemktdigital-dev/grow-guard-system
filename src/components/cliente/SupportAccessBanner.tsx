import { Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupportTokens, useRevokeSupportToken } from "@/hooks/useSupportAccess";
import { isPast, format } from "date-fns";

export function SupportAccessBanner() {
  const { data: tokens } = useSupportTokens();
  const revokeMutation = useRevokeSupportToken();

  const activeTokens = tokens?.filter(t => t.is_active && !isPast(new Date(t.expires_at))) ?? [];

  if (activeTokens.length === 0) return null;

  const soonest = activeTokens.reduce((a, b) =>
    new Date(a.expires_at) < new Date(b.expires_at) ? a : b
  );

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between shrink-0 text-sm">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4" />
        <span>
          🚨 Acesso de suporte ativo até{" "}
          <strong>{format(new Date(soonest.expires_at), "HH:mm")}</strong>
          {activeTokens.length > 1 && ` (+${activeTokens.length - 1})`}
        </span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="text-white hover:bg-red-700 gap-1 h-7"
        onClick={() => activeTokens.forEach(t => revokeMutation.mutate(t.id))}
        disabled={revokeMutation.isPending}
      >
        <X className="w-3 h-3" /> Encerrar acesso
      </Button>
    </div>
  );
}

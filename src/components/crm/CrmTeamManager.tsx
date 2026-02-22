import { useCrmTeam } from "@/hooks/useCrmTeam";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users2 } from "lucide-react";

export function CrmTeamManager() {
  const { data: team, isLoading } = useCrmTeam();
  const { data: leads } = useCrmLeads();

  if (isLoading) return <Skeleton className="h-48" />;

  const leadsCountByUser = (leads || []).reduce((acc, l) => {
    if (l.assigned_to) acc[l.assigned_to] = (acc[l.assigned_to] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2"><Users2 className="w-4 h-4" /> Equipe do CRM</CardTitle>
      </CardHeader>
      <CardContent>
        {(!team || team.length === 0) ? (
          <p className="text-xs text-muted-foreground text-center py-8">Nenhum membro encontrado na organização.</p>
        ) : (
          <div className="space-y-2">
            {team.map(m => (
              <div key={m.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {m.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.full_name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{m.role}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {leadsCountByUser[m.user_id] || 0} leads
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

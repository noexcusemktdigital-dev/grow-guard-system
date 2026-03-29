// @ts-nocheck
import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, Phone, CheckCircle2 } from "lucide-react";

interface CrmKanbanCardProps {
  lead: {
    id: string;
    name: string;
    company?: string | null;
    phone?: string | null;
    value?: number | null;
    source?: string | null;
    tags?: string[] | null;
    created_at: string;
  };
  hasProspection?: boolean;
  hasStrategy?: boolean;
  hasProposal?: boolean;
  proposalAccepted?: boolean;
  onClick: () => void;
}

export const CrmKanbanCard = memo(function CrmKanbanCard({
  lead, hasProspection, hasStrategy, hasProposal, proposalAccepted, onClick,
}: CrmKanbanCardProps) {
  return (
    <Card
      className="glass-card hover-lift cursor-pointer group border-l-2 border-l-transparent hover:border-l-primary transition-all"
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-1.5">
        <p className="font-medium text-sm truncate">{lead.name}</p>

        {lead.company && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
            <Building2 className="w-3 h-3 flex-shrink-0" />{lead.company}
          </p>
        )}

        {lead.phone && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="w-3 h-3 flex-shrink-0" />{lead.phone}
          </p>
        )}

        {lead.value && Number(lead.value) > 0 && (
          <p className="text-xs font-medium text-primary flex items-center gap-1">
            <DollarSign className="w-3 h-3" />R$ {Number(lead.value).toLocaleString()}
          </p>
        )}

        {lead.source && (
          <Badge variant="outline" className="text-[10px] h-4 px-1.5">{lead.source}</Badge>
        )}

        {/* Indicadores de progresso */}
        <div className="flex items-center gap-1.5 pt-1">
          {hasProspection && (
            <div className="flex items-center gap-0.5" title="Prospecção realizada">
              <CheckCircle2 className="w-3 h-3 text-blue-500" />
            </div>
          )}
          {hasStrategy && (
            <div className="flex items-center gap-0.5" title="Estratégia criada">
              <CheckCircle2 className="w-3 h-3 text-purple-500" />
            </div>
          )}
          {hasProposal && (
            <div className="flex items-center gap-0.5" title="Proposta gerada">
              <CheckCircle2 className="w-3 h-3 text-orange-500" />
            </div>
          )}
          {proposalAccepted && (
            <div className="flex items-center gap-0.5" title="Proposta aceita">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

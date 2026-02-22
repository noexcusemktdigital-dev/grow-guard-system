import { Bot, Copy, Edit, MoreVertical, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AiAgent } from "@/types/cliente";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "Ativo", variant: "default" },
  draft: { label: "Rascunho", variant: "secondary" },
  paused: { label: "Pausado", variant: "outline" },
};

const channelLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  email: "E-mail",
  website: "Website",
};

interface AgentCardProps {
  agent: AiAgent;
  onEdit: (agent: AiAgent) => void;
  onDuplicate: (agent: AiAgent) => void;
  onDelete: (agent: AiAgent) => void;
}

export function AgentCard({ agent, onEdit, onDuplicate, onDelete }: AgentCardProps) {
  const status = statusMap[agent.status] ?? statusMap.draft;

  return (
    <Card className="group hover:shadow-md transition-shadow cursor-pointer" onClick={() => onEdit(agent)}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {agent.avatar_url ? (
              <img src={agent.avatar_url} alt={agent.name} className="w-11 h-11 rounded-full object-cover" />
            ) : (
              <Bot className="w-5 h-5 text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
              <Badge variant={status.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                {status.label}
              </Badge>
            </div>
            {agent.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{agent.description}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">
                {channelLabels[agent.channel] ?? agent.channel}
              </Badge>
              {agent.tags?.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] text-muted-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(agent); }}>
                <Edit className="w-4 h-4 mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(agent); }}>
                <Copy className="w-4 h-4 mr-2" /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(agent); }}>
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

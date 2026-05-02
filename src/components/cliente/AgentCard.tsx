import { Bot, Copy, Edit, MoreVertical, Trash2, Smartphone, Play, Pause, MessageCircle, Users, RotateCcw, Power, PowerOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { agentRoleConfig } from "@/types/cliente";
import { useAgentStats } from "@/hooks/useClienteAgents";

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
  onToggleStatus: (agent: AiAgent) => void;
  onReactivateContacts?: (agent: AiAgent) => void;
}

export function AgentCard({ agent, onEdit, onDuplicate, onDelete, onToggleStatus, onReactivateContacts }: AgentCardProps) {
  const roleInfo = agentRoleConfig[agent.role] ?? agentRoleConfig.sdr;
  const isActive = agent.status === "active";
  const instanceCount = Array.isArray(agent.whatsapp_instance_ids) ? agent.whatsapp_instance_ids.length : 0;
  const { data: stats } = useAgentStats(agent.id);

  return (
    <Card className="group hover:shadow-md transition-shadow cursor-pointer" onClick={() => onEdit(agent)}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {agent.avatar_url ? (
              <img src={agent.avatar_url} alt={agent.name} className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <Bot className="w-6 h-6 text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="font-semibold text-sm truncate max-w-[180px]">{agent.name}</h3>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px]">
                  <p className="text-xs">{agent.name}</p>
                </TooltipContent>
              </Tooltip>
              <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${roleInfo.color}`}>
                {roleInfo.label}
              </Badge>
            </div>
            {agent.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{agent.description}</p>
            )}

            {/* Stats row */}
            {stats && (
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" /> {stats.activeContacts} contatos ativos
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> {stats.messagesToday} msg hoje
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">
                {channelLabels[agent.channel] ?? agent.channel}
              </Badge>
              {instanceCount > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Smartphone className="w-3 h-3" /> {instanceCount}
                </Badge>
              )}
              {agent.tags?.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] text-muted-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Toggle + Menu */}
          <div className="flex items-center gap-1 shrink-0">
            <div
              onClick={(e) => { e.stopPropagation(); onToggleStatus(agent); }}
              className="flex items-center gap-1.5 cursor-pointer"
              title={isActive ? "Pausar agente" : "Ativar agente"}
            >
              {isActive ? (
                <Badge variant="default" className="gap-1 text-[10px] bg-green-600 hover:bg-green-700">
                  <Play className="w-3 h-3" /> Ativo
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <Pause className="w-3 h-3" /> {agent.status === "paused" ? "Pausado" : "Rascunho"}
                </Badge>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Mais opções">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(agent); }}>
                  <Edit className="w-4 h-4 mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStatus(agent); }}>
                  {isActive ? (
                    <><PowerOff className="w-4 h-4 mr-2" /> Pausar agente</>
                  ) : (
                    <><Power className="w-4 h-4 mr-2 text-green-600" /> Ativar agente</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(agent); }}>
                  <Copy className="w-4 h-4 mr-2" /> Duplicar
                </DropdownMenuItem>
                {!isActive && onReactivateContacts && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReactivateContacts(agent); }}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Reativar contatos na IA
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(agent); }}>
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

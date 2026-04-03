import { Bot, Send, Loader2, History, ScrollText } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AgentRole } from "@/types/cliente";
import { agentRoleConfig } from "@/types/cliente";

interface SimMessage {
  role: string;
  content: string;
}

interface AgentLog {
  id: string | unknown;
  created_at: string | unknown;
  contact_id: string | unknown;
  input_message: string | unknown;
  output_message: string | unknown;
}

interface AgentStats {
  activeContacts: number;
  messagesToday: number;
  recentLogs?: AgentLog[];
}

interface AgentFormSheetSimulatorProps {
  agentName: string;
  agentRole: string;
  simMessages: SimMessage[];
  simInput: string;
  setSimInput: (v: string) => void;
  simLoading: boolean;
  handleSimulate: () => void;
}

interface AgentFormSheetHistoricoProps {
  agentStats: AgentStats | undefined | null;
}

export function AgentFormSheetSimulator({
  agentName,
  agentRole,
  simMessages,
  simInput,
  setSimInput,
  simLoading,
  handleSimulate,
}: AgentFormSheetSimulatorProps) {
  const roleInfo = agentRoleConfig[(agentRole as AgentRole) ?? "sdr"];

  return (
    <TabsContent value="simulator" className="mt-4">
      <div className="flex flex-col h-[420px] border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-4 py-2 border-b flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Simulador — {agentName || "Agente"}</span>
          <Badge className={`text-[10px] ml-auto ${roleInfo.color}`}>{roleInfo.label}</Badge>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {simMessages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                Envie uma mensagem para testar seu agente.
              </p>
            )}
            {simMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {simLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 p-3 border-t">
          <Input
            value={simInput}
            onChange={(e) => setSimInput(e.target.value)}
            placeholder="Digite uma mensagem de teste..."
            onKeyDown={(e) => e.key === "Enter" && handleSimulate()}
            disabled={simLoading}
          />
          <Button size="icon" onClick={handleSimulate} disabled={simLoading || !simInput.trim()} aria-label="Enviar">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </TabsContent>
  );
}

export function AgentFormSheetHistorico({ agentStats }: AgentFormSheetHistoricoProps) {
  return (
    <TabsContent value="historico" className="space-y-4 mt-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold">Histórico de Atividades</p>
        <p className="text-xs text-muted-foreground">Últimas interações realizadas por este agente</p>
      </div>

      {agentStats && agentStats.activeContacts > 0 && (
        <div className="flex gap-3">
          <div className="p-3 rounded-lg bg-primary/5 border flex-1 text-center">
            <p className="text-lg font-bold">{agentStats.activeContacts}</p>
            <p className="text-[10px] text-muted-foreground">Contatos ativos</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border flex-1 text-center">
            <p className="text-lg font-bold">{agentStats.messagesToday}</p>
            <p className="text-[10px] text-muted-foreground">Mensagens hoje</p>
          </div>
        </div>
      )}

      {agentStats?.recentLogs && agentStats.recentLogs.length > 0 ? (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {agentStats.recentLogs.map((log) => (
              <div key={String(log.id)} className="p-3 rounded-lg border space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[9px]">
                    {new Date(String(log.created_at)).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground">{String(log.contact_id).slice(0, 8)}...</span>
                </div>
                {log.input_message && (
                  <div className="text-xs">
                    <span className="text-muted-foreground font-medium">Cliente:</span>{" "}
                    <span className="text-foreground">
                      {String(log.input_message).slice(0, 120)}{String(log.input_message).length > 120 ? "..." : ""}
                    </span>
                  </div>
                )}
                {log.output_message && (
                  <div className="text-xs">
                    <span className="text-primary font-medium">Agente:</span>{" "}
                    <span className="text-foreground">
                      {String(log.output_message).slice(0, 120)}{String(log.output_message).length > 120 ? "..." : ""}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <History className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm font-medium">Nenhuma interação registrada</p>
          <p className="text-xs text-muted-foreground mt-1">
            O histórico aparecerá quando o agente começar a responder contatos.
          </p>
        </div>
      )}
    </TabsContent>
  );
}

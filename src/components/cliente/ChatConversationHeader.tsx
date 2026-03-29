// @ts-nocheck
import React from "react";
import {
  Bot, User, UserPlus, Search, RefreshCw, ChevronDown, ChevronUp, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertTriangle, ArrowRight, ExternalLink, X } from "lucide-react";
import type { WhatsAppContact } from "@/hooks/useWhatsApp";

interface ChatConversationHeaderProps {
  contact: WhatsAppContact;
  contactTyping: boolean;
  linkedLead: { id: string; name: string; stage: string; value?: number | null } | null;
  attendingMode: string | null;
  agentId: string | null;
  agents: { id: string; name: string }[];
  stages: { key: string; label: string }[];
  actionsOpen: boolean;
  setActionsOpen: (open: boolean) => void;
  searchOpen: boolean;
  searchQuery: string;
  searchResultsCount: number | null;
  onToggleSearch: () => void;
  onSearchChange: (query: string) => void;
  onCloseSearch: () => void;
  onToggleMode: () => void;
  onCreateLead: () => void;
  onChangeAgent: (agentId: string) => void;
  onChangeStage: (stage: string) => void;
  onNavigateCrm: () => void;
  onBack?: () => void;
  isHandoffAlert: boolean;
  updateModePending: boolean;
  createLeadPending: boolean;
  linkMutationPending: boolean;
}

export function ChatConversationHeader({
  contact, contactTyping, linkedLead, attendingMode, agentId, agents, stages,
  actionsOpen, setActionsOpen, searchOpen, searchQuery, searchResultsCount,
  onToggleSearch, onSearchChange, onCloseSearch, onToggleMode, onCreateLead,
  onChangeAgent, onChangeStage, onNavigateCrm, onBack,
  isHandoffAlert, updateModePending, createLeadPending, linkMutationPending,
}: ChatConversationHeaderProps) {
  return (
    <>
      {/* WhatsApp-style Header */}
      <div className="flex items-center gap-2 px-3 md:px-4 py-3 wa-header shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white hover:bg-white/10 md:hidden shrink-0" onClick={onBack} aria-label="Voltar">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <Avatar className="h-10 w-10 border-2 border-white/20">
          <AvatarImage src={contact.photo_url || undefined} />
          <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
            {(contact.name || contact.phone).substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate text-white">{contact.name || contact.phone}</p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/70">{contact.phone}</span>
            {contactTyping && <span className="text-[11px] text-emerald-300 animate-pulse">digitando...</span>}
            {linkedLead && <Badge className="text-[8px] px-1.5 py-0 bg-emerald-600/80 text-white border-0">{linkedLead.stage}</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full text-white hover:bg-white/10" onClick={onToggleSearch}>
            <Search className="w-3.5 h-3.5" />
          </Button>
          {attendingMode && (
            <Badge variant="outline" className={`text-[10px] gap-1 rounded-full border-white/30 ${attendingMode === "ai" ? "text-purple-200" : "text-emerald-200"}`}>
              {attendingMode === "ai" ? <><Bot className="w-3 h-3" /> IA</> : <><User className="w-3 h-3" /> Humano</>}
            </Badge>
          )}
          {attendingMode && (
            <Button variant="ghost" size="sm" className={`h-7 text-[11px] gap-1 rounded-full text-white hover:bg-white/10 ${attendingMode !== "ai" ? "border border-white/30" : ""}`} onClick={onToggleMode} disabled={updateModePending}>
              {attendingMode === "ai" ? <><User className="w-3 h-3" /> Assumir</> : <><RefreshCw className="w-3 h-3" /> IA</>}
            </Button>
          )}
          {!linkedLead && (
            <Button size="sm" className="h-7 text-[11px] gap-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md" onClick={onCreateLead} disabled={createLeadPending || linkMutationPending}>
              <UserPlus className="w-3 h-3" /> Criar Lead
            </Button>
          )}
          <Collapsible open={actionsOpen} onOpenChange={setActionsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full text-white hover:bg-white/10">
                {actionsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input autoFocus placeholder="Buscar na conversa..." className="h-7 text-xs border-0 bg-transparent focus-visible:ring-0" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} aria-label="Buscar na conversa" />
          {searchResultsCount !== null && <span className="text-[10px] text-muted-foreground whitespace-nowrap">{searchResultsCount} resultado{searchResultsCount !== 1 ? "s" : ""}</span>}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onCloseSearch}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Collapsible Actions Panel */}
      <Collapsible open={actionsOpen} onOpenChange={setActionsOpen}>
        <CollapsibleContent>
          <div className="px-4 py-2.5 border-b border-border bg-muted/30 space-y-2">
            {isHandoffAlert && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p className="text-[11px] font-medium">IA solicitou transbordo — atendimento humano necessário</p>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {linkedLead ? (
                <Card className="flex-1 min-w-[200px] border-border/50">
                  <CardContent className="p-2 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold truncate">{linkedLead.name}</p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[8px] px-1 py-0">{linkedLead.stage}</Badge>
                        {linkedLead.value != null && <span className="text-[10px] font-medium text-primary">R$ {Number(linkedLead.value).toLocaleString()}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onNavigateCrm}>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1 rounded-full" onClick={onCreateLead} disabled={createLeadPending || linkMutationPending}>
                  <UserPlus className="w-3 h-3" /> Criar Lead
                </Button>
              )}
              {linkedLead && stages.length > 0 && (
                <Select value={linkedLead.stage} onValueChange={onChangeStage}>
                  <SelectTrigger className="h-7 text-[10px] w-32 rounded-full"><ArrowRight className="w-3 h-3 mr-1" /><SelectValue placeholder="Etapa" /></SelectTrigger>
                  <SelectContent>{stages.map((s) => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}</SelectContent>
                </Select>
              )}
              {agents.length > 0 && (
                <Select value={agentId || ""} onValueChange={onChangeAgent}>
                  <SelectTrigger className="h-7 text-[10px] w-32 rounded-full"><Bot className="w-3 h-3 mr-1" /><SelectValue placeholder="Agente" /></SelectTrigger>
                  <SelectContent>{agents.map((a) => <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}

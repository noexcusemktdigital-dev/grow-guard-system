import React from "react";
import { Bot, User, Users, Globe, Pin, Archive } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WhatsAppContact } from "@/hooks/useWhatsApp";
import { isToday, isYesterday, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  contact: WhatsAppContact;
  isSelected: boolean;
  onSelect: (contact: WhatsAppContact) => void;
  stageLabel?: string;
  preview?: string;
  leadStages?: Map<string, string>;
  onPin?: (contactId: string, pinned: boolean) => void;
  onArchive?: (contactId: string, archived: boolean) => void;
}

function formatContactTime(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd/MM", { locale: ptBR });
}

export const ChatContactItem = React.forwardRef<HTMLButtonElement, Props>(
  function ChatContactItem({ contact, isSelected, onSelect, stageLabel, preview, onPin, onArchive }, ref) {
    const contactAny = contact as any;
    const mode = contactAny.attending_mode || null;
    const contactType = contactAny.contact_type || "individual";
    const assignedName = contactAny.assigned_name || null;
    const isGroup = contactType === "group";
    const isLid = contactType === "lid";
    const isWebsite = contactType === "website";
    const isPinned = !!(contactAny.is_pinned);
    const isArchived = !!(contactAny.is_archived);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            ref={ref}
            onClick={() => onSelect(contact)}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 ${
              isSelected ? "bg-primary/10" : "hover:bg-muted/40"
            } ${contact.unread_count > 0 ? "bg-primary/[0.03]" : ""}`}
          >
        <div className="relative shrink-0">
          {isGroup ? (
            <div className="h-11 w-11 rounded-full bg-purple-500/15 border-2 border-purple-500/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
          ) : isWebsite ? (
            <div className="h-11 w-11 rounded-full bg-blue-500/15 border-2 border-blue-500/30 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-400" />
            </div>
          ) : (
            <Avatar className="h-11 w-11">
              <AvatarImage src={contact.photo_url || undefined} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                {(contact.name || contact.phone).substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          {mode && !isGroup && !isWebsite && (
            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card flex items-center justify-center ${
              mode === "ai" ? "bg-purple-500" : "bg-emerald-500"
            }`}>
              {mode === "ai" ? <Bot className="w-2.5 h-2.5 text-white" /> : <User className="w-2.5 h-2.5 text-white" />}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className={`text-sm truncate ${contact.unread_count > 0 ? "font-bold" : "font-medium"}`}>
                {contact.name || contact.phone}
              </p>
              {isGroup && (
                <Badge variant="secondary" className="text-[8px] px-1 py-0 shrink-0 bg-purple-500/15 text-purple-400 border-0">Grupo</Badge>
              )}
              {isLid && (
                <Badge variant="secondary" className="text-[8px] px-1 py-0 shrink-0 bg-blue-500/15 text-blue-400 border-0">Anúncio</Badge>
              )}
              {isWebsite && (
                <Badge variant="secondary" className="text-[8px] px-1 py-0 shrink-0 bg-sky-500/15 text-sky-400 border-0">Site</Badge>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {isPinned && <Pin className="w-3 h-3 text-muted-foreground rotate-45" />}
              <span className={`text-[10px] ${contact.unread_count > 0 ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {formatContactTime(contact.last_message_at)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <div className="text-xs truncate pr-2 flex-1 min-w-0">
              {preview ? (
                <span
                  className="text-muted-foreground/80"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(preview
                      .replace(/^(✓✓?)\s*Você:/g, '<span class="text-emerald-500">$1</span> <span class="font-semibold text-foreground/70">Você:</span>')
                      .replace(/^(🎤|📷|📹|📄)/g, '<span class="text-primary/80">$1</span>'))
                  }}
                />
              ) : (
                <span className="text-muted-foreground/60">{contact.phone}</span>
              )}
            </div>
            {contact.unread_count > 0 && (
              <Badge className="h-[18px] min-w-[18px] px-1 text-[9px] bg-primary text-primary-foreground shrink-0 rounded-full">
                {contact.unread_count}
              </Badge>
            )}
          </div>
          {stageLabel && (
            <Badge variant="outline" className="text-[8px] px-1 py-0 font-normal mt-1">{stageLabel}</Badge>
          )}
          {assignedName && (
            <div className="flex items-center gap-1 mt-0.5">
              <User className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">{assignedName}</span>
            </div>
          )}
        </div>
      </button>
    );
  }
);

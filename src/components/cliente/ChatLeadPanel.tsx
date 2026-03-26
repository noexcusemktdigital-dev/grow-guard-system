import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User, Phone, Mail, Building2, DollarSign, Tag, Calendar,
  ExternalLink, UserPlus, X, Image as ImageIcon, FileText, Link2,
} from "lucide-react";
import type { WhatsAppContact, WhatsAppMessage } from "@/hooks/useWhatsApp";
import { useFindLeadByPhone, useWhatsAppMessages } from "@/hooks/useWhatsApp";
import { useCrmActivities } from "@/hooks/useCrmActivities";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

interface Props {
  contact: WhatsAppContact | null;
  onClose: () => void;
  onCreateLead?: () => void;
}

export function ChatLeadPanel({ contact, onClose, onCreateLead }: Props) {
  const navigate = useNavigate();
  const contactAny = contact as any;
  const crmLeadId = contactAny?.crm_lead_id || null;
  const { data: leadData } = useFindLeadByPhone(contact?.phone ?? null);
  const lead = leadData as any;
  // Use lead id from either linked contact or phone-matched lead
  const effectiveLeadId = crmLeadId || lead?.id || null;
  const { data: activities } = useCrmActivities(effectiveLeadId);

  if (!contact) return null;

  return (
    <div className="w-[300px] shrink-0 h-full border-l border-border bg-card/50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-bold tracking-tight">Informações</h3>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Contact Info */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <User className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold">{contact.name || contact.phone}</p>
              <p className="text-[11px] text-muted-foreground">{contact.phone}</p>
            </div>
          </div>

          <Separator />

          {/* Lead info */}
          {lead ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lead</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => navigate("/cliente/crm")}>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>

              <Card>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">{lead.name}</span>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">{lead.email}</span>
                    </div>
                  )}
                  {lead.company && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">{lead.company}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[9px]">{lead.stage}</Badge>
                    {lead.value != null && (
                      <Badge className="text-[9px] bg-primary/10 text-primary border-0">
                        <DollarSign className="w-2.5 h-2.5 mr-0.5" /> R$ {Number(lead.value).toLocaleString()}
                      </Badge>
                    )}
                  </div>
                  {lead.tags && lead.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Tag className="w-3 h-3 text-muted-foreground" />
                      {lead.tags.map((t: string) => (
                        <Badge key={t} variant="secondary" className="text-[8px] px-1 py-0">{t}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent activities */}
              {activities && activities.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Atividades recentes</span>
                  {activities.slice(0, 5).map((act: any) => (
                    <div key={act.id} className="flex items-start gap-2 text-[11px]">
                      <Calendar className="w-3 h-3 shrink-0 mt-0.5 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{act.title}</p>
                        <p className="text-muted-foreground text-[10px]">
                          {new Date(act.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-xs text-muted-foreground">Nenhum lead vinculado</p>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={onCreateLead}>
                <UserPlus className="w-3 h-3" /> Criar Lead
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

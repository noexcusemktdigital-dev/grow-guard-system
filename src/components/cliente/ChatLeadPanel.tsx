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
  const effectiveLeadId = crmLeadId || lead?.id || null;
  const { data: activities } = useCrmActivities(effectiveLeadId);
  const { data: allMessages = [] } = useWhatsAppMessages(contact?.id ?? null);

  const mediaItems = useMemo(() => allMessages.filter(m => m.media_url && (m.type === "image" || /\.(jpe?g|png|gif|webp)(\?|$)/i.test(m.media_url || ""))), [allMessages]);
  const docItems = useMemo(() => allMessages.filter(m => m.media_url && (m.type === "document" || /\.(pdf|doc|xls|ppt|csv|txt)(\?|$)/i.test(m.media_url || ""))), [allMessages]);
  const linkItems = useMemo(() => {
    const urlRegex = /(https?:\/\/[^\s<]+)/gi;
    return allMessages.filter(m => m.content && urlRegex.test(m.content)).map(m => {
      const match = m.content!.match(urlRegex);
      return { ...m, links: match || [] };
    });
  }, [allMessages]);

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

          <Separator />

          {/* Media/Docs/Links tabs */}
          <Tabs defaultValue="media" className="w-full">
            <TabsList className="w-full h-8 bg-muted/30">
              <TabsTrigger value="media" className="text-[10px] gap-1 flex-1"><ImageIcon className="w-3 h-3" /> Mídia ({mediaItems.length})</TabsTrigger>
              <TabsTrigger value="docs" className="text-[10px] gap-1 flex-1"><FileText className="w-3 h-3" /> Docs ({docItems.length})</TabsTrigger>
              <TabsTrigger value="links" className="text-[10px] gap-1 flex-1"><Link2 className="w-3 h-3" /> Links ({linkItems.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="media" className="mt-2">
              {mediaItems.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-4">Nenhuma mídia</p>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {mediaItems.slice(0, 30).map(m => (
                    <a key={m.id} href={m.media_url!} target="_blank" rel="noopener noreferrer">
                      <img src={m.media_url!} alt="Mídia da conversa" className="w-full aspect-square object-cover rounded-md" loading="lazy" />
                    </a>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="docs" className="mt-2">
              {docItems.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-4">Nenhum documento</p>
              ) : (
                <div className="space-y-1.5">
                  {docItems.slice(0, 20).map(m => (
                    <a key={m.id} href={m.media_url!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-[11px] truncate">{m.media_url!.split("/").pop()}</span>
                    </a>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="links" className="mt-2">
              {linkItems.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-4">Nenhum link</p>
              ) : (
                <div className="space-y-1.5">
                  {linkItems.slice(0, 20).map(m => (
                    <div key={m.id}>
                      {(m as any).links.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-[10px] text-primary truncate">{url}</span>
                        </a>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}

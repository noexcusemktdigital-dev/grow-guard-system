import { useState, useMemo } from "react";
import { Users, FileText, Keyboard, Search, AlertCircle, CheckSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCrmContacts } from "@/hooks/useCrmContacts";

interface Props {
  recipients: string[];
  sourceType: string;
  onChange: (recipients: string[], sourceType: string) => void;
}

export function DisparoWizardStep2({ recipients, sourceType, onChange }: Props) {
  const [manualText, setManualText] = useState(recipients.join("\n"));
  const [crmSearch, setCrmSearch] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState("");
  const { data: contacts } = useCrmContacts();

  const contactsWithPhone = useMemo(() => {
    if (!contacts) return [];
    let filtered = contacts.filter((c) => c.phone?.trim());
    if (crmSearch) {
      const s = crmSearch.toLowerCase();
      filtered = filtered.filter(
        (c) => c.name.toLowerCase().includes(s) || c.phone?.includes(s)
      );
    }
    if (tagFilter) {
      const t = tagFilter.toLowerCase();
      filtered = filtered.filter((c) => c.tags?.some((tag) => tag.toLowerCase().includes(t)));
    }
    return filtered;
  }, [contacts, crmSearch, tagFilter]);

  const allTags = useMemo(() => {
    if (!contacts) return [];
    const tags = new Set<string>();
    contacts.forEach((c) => c.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [contacts]);

  const handleManualChange = (text: string) => {
    setManualText(text);
    const phones = text
      .split(/[,;\n]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    onChange(phones, "manual");
  };

  const handleToggleContact = (contactId: string, phone: string) => {
    const next = new Set(selectedContactIds);
    if (next.has(contactId)) {
      next.delete(contactId);
    } else {
      next.add(contactId);
    }
    setSelectedContactIds(next);

    const phones = contactsWithPhone
      .filter((c) => next.has(c.id))
      .map((c) => c.phone!.trim());
    onChange(phones, "crm_contacts");
  };

  const handleSelectAll = () => {
    const visible = contactsWithPhone.slice(0, 100); // respect 100 limit
    const allSelected = visible.every((c) => selectedContactIds.has(c.id));

    if (allSelected) {
      // Deselect all visible
      const next = new Set(selectedContactIds);
      visible.forEach((c) => next.delete(c.id));
      setSelectedContactIds(next);
      const phones = contactsWithPhone
        .filter((c) => next.has(c.id))
        .map((c) => c.phone!.trim());
      onChange(phones, "crm_contacts");
    } else {
      // Select all visible (up to 100)
      const next = new Set(selectedContactIds);
      visible.forEach((c) => next.add(c.id));
      setSelectedContactIds(next);
      const phones = contactsWithPhone
        .filter((c) => next.has(c.id))
        .map((c) => c.phone!.trim());
      onChange(phones, "crm_contacts");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const phones = text
        .split(/[\r\n,;]+/)
        .map((p) => p.trim().replace(/[^0-9+]/g, ""))
        .filter((p) => p.length >= 8);
      onChange(phones, "list");
    };
    reader.readAsText(file);
  };

  const isOverLimit = recipients.length > 100;
  const allVisibleSelected = contactsWithPhone.length > 0 && contactsWithPhone.slice(0, 100).every((c) => selectedContactIds.has(c.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Destinatários</Label>
        <Badge
          variant="outline"
          className={`text-[10px] ${isOverLimit ? "border-destructive text-destructive" : ""}`}
        >
          {recipients.length}/100
        </Badge>
      </div>

      {isOverLimit && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">
            Máximo de 100 destinatários por disparo. Remova {recipients.length - 100} número(s).
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="manual" className="flex-1 text-xs gap-1">
            <Keyboard className="w-3 h-3" /> Manual
          </TabsTrigger>
          <TabsTrigger value="crm" className="flex-1 text-xs gap-1">
            <Users className="w-3 h-3" /> CRM
          </TabsTrigger>
          <TabsTrigger value="file" className="flex-1 text-xs gap-1">
            <FileText className="w-3 h-3" /> Arquivo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-2">
          <Textarea
            placeholder={"5511999999999\n5511888888888\n(um por linha ou separados por vírgula)"}
            className="min-h-[120px] font-mono text-xs"
            value={manualText}
            onChange={(e) => handleManualChange(e.target.value)}
          />
        </TabsContent>

        <TabsContent value="crm" className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar contato..."
                className="pl-8 text-xs h-8"
                value={crmSearch}
                onChange={(e) => setCrmSearch(e.target.value)}
              />
            </div>
            {allTags.length > 0 && (
              <Input
                placeholder="Filtrar por tag..."
                className="w-32 text-xs h-8"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
              />
            )}
          </div>

          {/* Select all */}
          {contactsWithPhone.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={handleSelectAll}
            >
              <CheckSquare className="w-3 h-3" />
              {allVisibleSelected ? "Desmarcar todos" : `Selecionar todos (${Math.min(contactsWithPhone.length, 100)})`}
            </Button>
          )}

          <div className="max-h-[200px] overflow-y-auto border rounded-lg divide-y">
            {contactsWithPhone.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhum contato com telefone encontrado
              </p>
            ) : (
              contactsWithPhone.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedContactIds.has(c.id)}
                    onCheckedChange={() => handleToggleContact(c.id, c.phone!)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.phone}</p>
                  </div>
                  {c.tags?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {c.tags.slice(0, 2).map((t) => (
                        <Badge key={t} variant="outline" className="text-[8px] px-1">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </label>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="file" className="space-y-2">
          <label className="flex flex-col items-center gap-2 px-4 py-8 border border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
            <FileText className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Arraste ou clique para enviar arquivo CSV/TXT
            </span>
            <span className="text-[10px] text-muted-foreground">Um número por linha</span>
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          {sourceType === "list" && recipients.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {recipients.length} número(s) carregados do arquivo
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useRef } from "react";
import { Link, FileText, MessageSquare, Upload, Plus, X, Loader2, ChevronRight } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface KBEntry {
  type: "url" | "file" | "text";
  content: string;
  name?: string;
  url?: string;
  size?: number;
}

interface AgentFormSheetKnowledgeProps {
  knowledgeBase: KBEntry[];
  urlInput: string;
  setUrlInput: (v: string) => void;
  textInput: string;
  setTextInput: (v: string) => void;
  uploading: boolean;
  addKbUrl: () => void;
  addKbText: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeKbEntry: (idx: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isEditing: boolean;
  isStep3Complete: boolean;
  goNext: () => void;
  canGoNext: boolean;
}

function NextButton({ disabled, goNext }: { disabled: boolean; goNext: () => void }) {
  return (
    <div className="pt-4 flex justify-end">
      <Button type="button" onClick={goNext} disabled={disabled} className="gap-1.5">
        Próximo <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function AgentFormSheetKnowledge({
  knowledgeBase,
  urlInput,
  setUrlInput,
  textInput,
  setTextInput,
  uploading,
  addKbUrl,
  addKbText,
  handleFileUpload,
  removeKbEntry,
  fileInputRef,
  isEditing,
  isStep3Complete,
  goNext,
  canGoNext,
}: AgentFormSheetKnowledgeProps) {
  return (
    <TabsContent value="knowledge" className="space-y-4 mt-4">
      <p className="text-sm text-muted-foreground">Adicione links, arquivos ou textos para treinar a base de conhecimento do agente.</p>

      {/* URLs */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5"><Link className="w-3.5 h-3.5" /> Links / URLs</Label>
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://exemplo.com/pagina"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKbUrl())}
          />
          <Button type="button" size="icon" variant="outline" onClick={addKbUrl} aria-label="Adicionar">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Files */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Arquivos</Label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleFileUpload}
        />
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Enviando..." : "Fazer upload de arquivos"}
        </Button>
      </div>

      {/* Text */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Texto manual</Label>
        <Textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Cole aqui informações, FAQ, regras do negócio..."
          rows={3}
        />
        <Button variant="outline" size="sm" onClick={addKbText} disabled={!textInput.trim()}>
          Adicionar texto
        </Button>
      </div>

      {/* List */}
      {knowledgeBase.length > 0 ? (
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs text-muted-foreground">{knowledgeBase.length} item(ns) adicionado(s)</Label>
          {knowledgeBase.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2.5 rounded-md border bg-muted/30 text-sm">
              <Badge variant="outline" className="text-[10px] shrink-0">
                {typeof entry === "string" ? "texto" : entry.type}
              </Badge>
              <span className="flex-1 truncate text-xs">
                {typeof entry === "string" ? entry : entry.name || entry.content}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => removeKbEntry(idx)}
                aria-label="Remover"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground text-sm border rounded-md border-dashed">
          Nenhuma referência adicionada ainda.
        </div>
      )}

      {!isEditing && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          Adicione pelo menos <strong>1 item</strong> à base de conhecimento para avançar.
        </div>
      )}

      <NextButton disabled={!isStep3Complete || !canGoNext} goNext={goNext} />
    </TabsContent>
  );
}

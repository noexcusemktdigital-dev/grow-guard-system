// @ts-nocheck
import { Loader2, Sparkles, ChevronRight } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface AgentFormSheetPersonaProps {
  persona: Record<string, any>;
  updatePersona: (key: string, value: unknown) => void;
  generating: string | null;
  handleGeneratePersona: () => void;
  handleGenerateGreeting: () => void;
  isEditing: boolean;
  isStep2Complete: boolean;
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

export function AgentFormSheetPersona({
  persona,
  updatePersona,
  generating,
  handleGeneratePersona,
  handleGenerateGreeting,
  isEditing,
  isStep2Complete,
  goNext,
  canGoNext,
}: AgentFormSheetPersonaProps) {
  return (
    <TabsContent value="persona" className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>Como o agente deve cumprimentar?</Label>
        <Select value={persona.greeting ?? "informal"} onValueChange={(v) => updatePersona("greeting", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="formal">Formal — "Prezado(a), bom dia..."</SelectItem>
            <SelectItem value="informal">Informal — "Oi! Tudo bem?"</SelectItem>
            <SelectItem value="personalizado">Personalizado</SelectItem>
          </SelectContent>
        </Select>
        {persona.greeting === "personalizado" && (
          <div className="space-y-2">
            <Textarea
              placeholder="Digite a saudação personalizada..."
              value={persona.custom_greeting ?? ""}
              onChange={(e) => updatePersona("custom_greeting", e.target.value)}
              rows={2}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-xs"
              onClick={handleGenerateGreeting}
              disabled={generating === "greeting"}
            >
              {generating === "greeting" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Gerar saudação com a nossa IA
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Nível de formalidade</Label>
        <Select value={persona.formality ?? "profissional"} onValueChange={(v) => updatePersona("formality", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="muito_formal">Muito formal</SelectItem>
            <SelectItem value="profissional">Profissional</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="descontraido">Descontraído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Uso de emojis</Label>
        <Select value={persona.emojis ?? "pouco"} onValueChange={(v) => updatePersona("emojis", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="nunca">Nunca</SelectItem>
            <SelectItem value="pouco">Pouco</SelectItem>
            <SelectItem value="moderado">Moderado</SelectItem>
            <SelectItem value="bastante">Bastante</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Comprimento das mensagens</Label>
        <Select value={persona.message_length ?? "medias"} onValueChange={(v) => updatePersona("message_length", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="curtas">Curtas e diretas</SelectItem>
            <SelectItem value="medias">Médias</SelectItem>
            <SelectItem value="detalhadas">Detalhadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Personalidade (selecione pelo menos 1) *</Label>
        <div className="flex flex-wrap gap-2">
          {["Empático", "Consultivo", "Proativo", "Objetivo", "Paciente", "Persuasivo"].map((trait) => {
            const selected = (persona.traits ?? []).includes(trait);
            return (
              <Badge
                key={trait}
                variant={selected ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const traits = persona.traits ?? [];
                  updatePersona("traits", selected ? traits.filter((t: string) => t !== trait) : [...traits, trait]);
                }}
              >
                {trait}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Restrições — O que o agente NÃO deve fazer</Label>
        <Textarea
          value={persona.restrictions ?? ""}
          onChange={(e) => updatePersona("restrictions", e.target.value)}
          placeholder="Ex: Não falar de preços, não prometer prazos, não mencionar concorrentes..."
          rows={3}
        />
      </div>

      {persona.generated_description && (
        <div className="space-y-2">
          <Label>Persona gerada pela nossa IA (editável)</Label>
          <Textarea
            value={persona.generated_description}
            onChange={(e) => updatePersona("generated_description", e.target.value)}
            rows={4}
          />
        </div>
      )}

      <Button variant="outline" className="gap-2 w-full" onClick={handleGeneratePersona} disabled={generating === "persona"}>
        {generating === "persona" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Gerar descrição da persona com a nossa IA
      </Button>

      {!isEditing && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          Selecione uma <strong>saudação</strong> e pelo menos <strong>1 personalidade</strong> para avançar.
        </div>
      )}

      <NextButton disabled={!isStep2Complete || !canGoNext} goNext={goNext} />
    </TabsContent>
  );
}

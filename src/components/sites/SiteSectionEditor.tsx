// @ts-nocheck
import { useState } from "react";
import { Edit3, Check, ChevronDown, ChevronUp, MessageSquare, Type, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface SectionEdit {
  textos?: string;
  imagem?: string;
  instrucao?: string;
}

interface SiteSectionEditorProps {
  html: string;
  edits: Record<string, SectionEdit>;
  onEditsChange: (edits: Record<string, SectionEdit>) => void;
  onRegenerate: () => void;
  onApprove: () => void;
  regenerating: boolean;
}

interface ParsedSection {
  id: string;
  label: string;
  preview: string;
}

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero / Topo",
  problema: "Problema",
  solucao: "Solução",
  beneficios: "Benefícios",
  "prova-social": "Prova Social",
  formulario: "Formulário",
  "cta-final": "CTA Final",
  sobre: "Sobre",
  equipe: "Equipe",
  servicos: "Serviços",
  valores: "Valores",
  contato: "Contato",
  produto: "Produto",
  preco: "Preço",
  depoimentos: "Depoimentos",
  garantia: "Garantia",
  faq: "FAQ",
  projetos: "Projetos",
  processo: "Processo",
  links: "Links",
  redes: "Redes Sociais",
  "mini-sobre": "Mini Sobre",
  footer: "Footer",
};

function parseSections(html: string): ParsedSection[] {
  const regex = /<section[^>]*id="section-([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi;
  const sections: ParsedSection[] = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    const id = match[1];
    const content = match[2];
    // Extract first meaningful text as preview
    const textMatch = content.match(/<(?:h[1-6]|p)[^>]*>([^<]+)/i);
    const preview = textMatch?.[1]?.trim().slice(0, 80) || "Seção configurada";

    sections.push({
      id,
      label: SECTION_LABELS[id] || id.charAt(0).toUpperCase() + id.slice(1),
      preview,
    });
  }

  // If no sections found (old format), create generic ones
  if (sections.length === 0) {
    return [{ id: "geral", label: "Site Completo", preview: "Edite o site inteiro com instruções" }];
  }

  return sections;
}

export function SiteSectionEditor({ html, edits, onEditsChange, onRegenerate, onApprove, regenerating }: SiteSectionEditorProps) {
  const sections = parseSections(html);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const updateSectionEdit = (sectionId: string, field: keyof SectionEdit, value: string) => {
    onEditsChange({
      ...edits,
      [sectionId]: { ...(edits[sectionId] || {}), [field]: value },
    });
  };

  const hasEdits = Object.values(edits).some(e => e.textos || e.imagem || e.instrucao);
  const editedCount = Object.entries(edits).filter(([_, e]) => e.textos || e.imagem || e.instrucao).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Editar Seções</h3>
          <p className="text-[11px] text-muted-foreground">
            Clique em uma seção para alterar textos, imagens ou dar instruções. Depois regenere sem custo.
          </p>
        </div>
        {editedCount > 0 && (
          <Badge variant="secondary" className="text-[10px]">{editedCount} alteração(ões)</Badge>
        )}
      </div>

      <div className="space-y-2">
        {sections.map((section) => {
          const isExpanded = expandedSection === section.id;
          const sectionEdit = edits[section.id] || {};
          const hasChanges = !!(sectionEdit.textos || sectionEdit.imagem || sectionEdit.instrucao);

          return (
            <Card key={section.id} className={`transition-all ${hasChanges ? "border-primary/40 bg-primary/5" : ""}`}>
              <button
                className="w-full flex items-center justify-between p-3 text-left"
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    hasChanges ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {hasChanges ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{section.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[250px]">{section.preview}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <CardContent className="pt-0 pb-4 space-y-3 border-t">
                  <div>
                    <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                      <Type className="w-3 h-3" /> Alterar textos
                    </label>
                    <Textarea
                      placeholder="Cole ou escreva os novos textos para esta seção..."
                      value={sectionEdit.textos || ""}
                      onChange={e => updateSectionEdit(section.id, "textos", e.target.value)}
                      rows={3}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                      <Image className="w-3 h-3" /> Trocar/adicionar imagem
                    </label>
                    <Input
                      placeholder="Cole a URL da imagem ou descreva a imagem desejada"
                      value={sectionEdit.imagem || ""}
                      onChange={e => updateSectionEdit(section.id, "imagem", e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Instrução livre
                    </label>
                    <Textarea
                      placeholder="Ex: Mude a cor de fundo para azul, adicione mais um serviço, aumente a fonte do título..."
                      value={sectionEdit.instrucao || ""}
                      onChange={e => updateSectionEdit(section.id, "instrucao", e.target.value)}
                      rows={2}
                      className="mt-1 text-xs"
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={onRegenerate}
          disabled={!hasEdits || regenerating}
        >
          <Edit3 className="w-4 h-4" />
          {regenerating ? "Regenerando..." : "Regenerar com alterações"}
        </Button>
        <Button className="w-full gap-2" onClick={onApprove}>
          <Check className="w-4 h-4" /> Aprovar site
        </Button>
      </div>

      {!hasEdits && (
        <p className="text-[10px] text-muted-foreground text-center">
          Se o site já está bom, clique em "Aprovar site". Caso queira ajustes, edite as seções acima.
        </p>
      )}
    </div>
  );
}

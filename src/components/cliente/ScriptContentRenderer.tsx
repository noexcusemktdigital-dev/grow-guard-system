import React from "react";
import { Badge } from "@/components/ui/badge";

interface ScriptContentRendererProps {
  content: string;
}

const TAG_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  "[PAUSA]": { bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400", label: "⏸ PAUSA" },
  "[ANOTAR]": { bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400", label: "📝 ANOTAR" },
  "[DECISÃO]": { bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", label: "✅ DECISÃO" },
  "[EXEMPLO]": { bg: "bg-purple-500/15", text: "text-purple-600 dark:text-purple-400", label: "💡 EXEMPLO" },
};

function renderInlineTags(text: string): React.ReactNode[] {
  const tagPattern = /\[(PAUSA|ANOTAR|DECISÃO|EXEMPLO)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const tag = match[0];
    const style = TAG_STYLES[tag];
    if (style) {
      parts.push(
        <span
          key={match.index}
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${style.bg} ${style.text} border border-current/10`}
        >
          {style.label}
        </span>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

function isHeader(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.startsWith("#")) return true;
  if (trimmed.startsWith("---") || trimmed.startsWith("===")) return true;
  if (/^[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ\s\d\-:]{8,}$/.test(trimmed) && !trimmed.startsWith("-")) return true;
  return false;
}

function isNumberedItem(line: string): boolean {
  return /^\s*\d+[\.\)]\s/.test(line);
}

function isBulletItem(line: string): boolean {
  return /^\s*[-•]\s/.test(line);
}

function isSeparator(line: string): boolean {
  const trimmed = line.trim();
  return /^[-=_]{3,}$/.test(trimmed);
}

function isDialogue(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('"') ||
    trimmed.startsWith('"') ||
    trimmed.startsWith('«') ||
    /^(Vendedor|Prospect|Cliente|Você):/i.test(trimmed)
  );
}

export function ScriptContentRenderer({ content }: ScriptContentRendererProps) {
  if (!content) {
    return <p className="text-sm text-muted-foreground italic">Sem conteúdo</p>;
  }

  const lines = content.split("\n");

  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={i} className="h-2" />;
        }

        if (isSeparator(trimmed)) {
          return <hr key={i} className="border-border/50 my-3" />;
        }

        if (isHeader(trimmed)) {
          const text = trimmed.replace(/^#+\s*/, "").replace(/^[-=]+$/, "");
          if (!text) return <hr key={i} className="border-border/50 my-3" />;
          return (
            <div key={i} className="flex items-center gap-2 pt-4 pb-1">
              <div className="w-1 h-5 rounded-full bg-primary shrink-0" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                {text}
              </h3>
            </div>
          );
        }

        if (isDialogue(trimmed)) {
          const colonIdx = trimmed.indexOf(":");
          const hasRole = /^(Vendedor|Prospect|Cliente|Você):/i.test(trimmed);
          return (
            <div
              key={i}
              className="pl-4 py-2 my-1 border-l-2 border-primary/30 bg-primary/5 rounded-r-lg"
            >
              {hasRole && colonIdx > 0 ? (
                <p>
                  <span className="font-semibold text-primary">
                    {trimmed.slice(0, colonIdx + 1)}
                  </span>
                  <span className="text-foreground/90">
                    {renderInlineTags(trimmed.slice(colonIdx + 1))}
                  </span>
                </p>
              ) : (
                <p className="text-foreground/90 italic">
                  {renderInlineTags(trimmed)}
                </p>
              )}
            </div>
          );
        }

        if (isNumberedItem(trimmed)) {
          const match = trimmed.match(/^(\s*\d+[\.\)])\s(.*)$/);
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span className="text-primary font-bold shrink-0 min-w-[1.5rem] text-right">
                {match ? match[1] : ""}
              </span>
              <span className="text-foreground/90">
                {renderInlineTags(match ? match[2] : trimmed)}
              </span>
            </div>
          );
        }

        if (isBulletItem(trimmed)) {
          const text = trimmed.replace(/^\s*[-•]\s/, "");
          return (
            <div key={i} className="flex gap-2 pl-4">
              <span className="text-primary mt-1.5 shrink-0">•</span>
              <span className="text-foreground/90">{renderInlineTags(text)}</span>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={i} className="text-foreground/90 pl-1">
            {renderInlineTags(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

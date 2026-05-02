// @ts-nocheck
import { Badge } from "@/components/ui/badge";
import { parseConteudoPrincipal } from "./ContentTypes";

/* ── Carrossel: slides empilhados ── */
export function CarrosselVisual({ content }: { content: unknown }) {
  if (!Array.isArray(content)) return <GenericVisual content={content} />;
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
      {content.map((slide: Record<string, string>, i: number) => (
        <div key={i} className="flex-none w-48 snap-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border p-4 space-y-1">
          <span className="text-xs font-bold text-primary/60">{i + 1}/{content.length}</span>
          {slide.titulo && <p className="font-bold text-sm leading-tight">{slide.titulo}</p>}
          <p className="text-xs text-muted-foreground leading-snug line-clamp-4">{slide.texto || slide.content || ""}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Post Único / Educativo / Autoridade ── */
export function PostVisual({ content }: { content: unknown }) {
  if (!content || typeof content !== "object") return <GenericVisual content={content} />;
  return (
    <div className="rounded-xl bg-gradient-to-br from-primary/8 to-transparent border p-5 space-y-3">
      {content.headline && <p className="text-xl font-extrabold leading-tight">{content.headline}</p>}
      {content.texto && <p className="text-sm text-muted-foreground leading-relaxed">{content.texto}</p>}
      {content.dica_pratica && (
        <div className="rounded-lg bg-primary/10 p-3">
          <p className="text-xs font-semibold text-primary mb-1">💡 Dica Prática</p>
          <p className="text-sm">{content.dica_pratica}</p>
        </div>
      )}
      {content.dado_autoridade && (
        <div className="rounded-lg bg-primary/10 p-3">
          <p className="text-xs font-semibold text-primary mb-1">📊 Dado de Autoridade</p>
          <p className="text-sm">{content.dado_autoridade}</p>
        </div>
      )}
      {content.cta && <Badge className="text-xs">{content.cta}</Badge>}
    </div>
  );
}

/* ── Vídeo: hook em destaque + roteiro colapsado ── */
export function VideoVisual({ content }: { content: unknown }) {
  if (!content || typeof content !== "object") return <GenericVisual content={content} />;
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-gradient-to-r from-primary/15 to-primary/5 border-2 border-primary/20 p-5 text-center">
        <p className="text-xs font-bold text-primary mb-1">🎬 HOOK</p>
        <p className="text-lg font-extrabold leading-tight">"{content.hook}"</p>
      </div>
      <div className="space-y-2">
        {content.desenvolvimento && (
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Desenvolvimento</p>
            <p className="text-sm">{content.desenvolvimento}</p>
          </div>
        )}
        {content.conclusao && (
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Conclusão</p>
            <p className="text-sm">{content.conclusao}</p>
          </div>
        )}
        {content.texto_tela && (
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Texto na tela</p>
            {Array.isArray(content.texto_tela) ? (
              <ul className="text-sm space-y-1 list-disc list-inside">
                {content.texto_tela.map((t: string, i: number) => <li key={i}>{t}</li>)}
              </ul>
            ) : (
              <p className="text-sm">{content.texto_tela}</p>
            )}
          </div>
        )}
      </div>
      {content.cta && <Badge className="text-xs">{content.cta}</Badge>}
    </div>
  );
}

/* ── Story: frames horizontais ── */
export function StoryVisual({ content }: { content: unknown }) {
  if (!Array.isArray(content)) return <GenericVisual content={content} />;
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
      {content.map((frame: Record<string, string>, i: number) => (
        <div key={i} className="flex-none w-32 h-56 snap-center rounded-2xl bg-gradient-to-b from-primary/15 to-primary/5 border p-3 flex flex-col justify-between">
          <span className="text-xs font-bold text-primary/60">{i + 1}</span>
          <div>
            <p className="text-xs font-bold leading-tight">{frame.texto || frame.content || ""}</p>
            {frame.acao && <p className="text-[10px] text-muted-foreground mt-1">{frame.acao}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Artigo ── */
export function ArtigoVisual({ content }: { content: unknown }) {
  if (!content || typeof content !== "object") return <GenericVisual content={content} />;
  return (
    <div className="rounded-xl border p-5 space-y-3">
      {content.titulo && <p className="text-xl font-extrabold">{content.titulo}</p>}
      {content.introducao && <p className="text-sm text-muted-foreground italic">{content.introducao}</p>}
      {((content as Record<string, unknown>).secoes as Array<{ subtitulo?: string; texto?: string }> || []).map((s, i: number) => (
        <div key={i}>
          <p className="font-semibold text-sm text-primary">{s.subtitulo}</p>
          <p className="text-sm text-muted-foreground">{s.texto}</p>
        </div>
      ))}
      {content.conclusao && (
        <div className="border-t pt-3">
          <p className="text-sm font-medium">{content.conclusao}</p>
        </div>
      )}
    </div>
  );
}

/* ── Fallback ── */
export function GenericVisual({ content }: { content: unknown }) {
  if (!content) return <p className="text-sm text-muted-foreground">Conteúdo não disponível</p>;
  if (typeof content === "string") return <p className="text-sm whitespace-pre-wrap">{content}</p>;
  return <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-3 rounded-lg overflow-auto max-h-48">{JSON.stringify(content, null, 2)}</pre>;
}

/** Renders correct visual based on format string */
export function ContentVisualRenderer({ formato, content: raw }: { formato: string; content: unknown }) {
  const f = (formato || "").toLowerCase();
  const content = parseConteudoPrincipal(raw);

  if (f.includes("carrossel")) return <CarrosselVisual content={content} />;
  if (f.includes("post")) return <PostVisual content={content} />;
  if (f.includes("video") || f.includes("vídeo") || f.includes("roteiro")) return <VideoVisual content={content} />;
  if (f.includes("story")) return <StoryVisual content={content} />;
  if (f.includes("artigo")) return <ArtigoVisual content={content} />;
  return <GenericVisual content={content} />;
}

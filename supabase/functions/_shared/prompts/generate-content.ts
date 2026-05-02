// Prompt para geração de lote de conteúdos estratégicos para redes sociais.
// Extraído de supabase/functions/generate-content/index.ts em 2026-05-01.
// Nota: este fn constrói o system prompt dinamicamente com contextos ricos
// (estratégia, plano de vendas, funil, etc). O SYSTEM_PROMPT aqui representa
// o template base — a edge fn injeta os blocos de contexto adicionais em runtime.

export const PROMPT_VERSION = '1.0.0';

export interface ContentInput {
  count: number;
  formatDist?: string;
  objList?: string;
  plataforma?: string;
  tom?: string;
  publico?: string;
  tema?: string;
  funilCtx?: string;
  specialCtx?: string;
  styleCtx?: string;
  estrategiaCtx?: string;
  manualCtx?: string;
  salesPlanCtx?: string;
}

/**
 * Monta system prompt dinâmico para geração de lote de conteúdos.
 * Aceita blocos de contexto opcionais já sanitizados pelo caller.
 */
export function buildSystemPrompt(input: ContentInput): string {
  const safe = (s: string | undefined, max = 500): string =>
    (s ?? '').replace(/[`\\]/g, '').slice(0, max).trim();

  const {
    count,
    formatDist,
    objList,
    plataforma,
    tom,
    publico,
    tema,
    funilCtx,
    specialCtx,
    styleCtx,
    estrategiaCtx,
    manualCtx,
    salesPlanCtx,
  } = input;

  return `Você é um estrategista de marketing digital de alto nível. Sua tarefa é gerar um LOTE de ${count} conteúdos completos, estratégicos e prontos para uso.

${estrategiaCtx ?? ''}
${manualCtx ?? ''}
${salesPlanCtx ?? ''}

DISTRIBUIÇÃO DE FORMATOS: ${safe(formatDist) || 'decidir pela IA'}
OBJETIVOS SELECIONADOS: ${safe(objList) || 'educar, autoridade, engajamento, vender'}
PLATAFORMA: ${safe(plataforma) || 'Instagram'}
TOM: ${safe(tom) || 'definido pela estratégia ou educativo e direto'}
PÚBLICO: ${safe(publico) || 'definido pela estratégia'}
${tema ? `TEMA DIRECIONADOR: ${safe(tema)}` : 'Use os pilares da estratégia como base temática.'}
${funilCtx ? `\n${safe(funilCtx, 300)}` : ''}
${specialCtx ? `\n${safe(specialCtx, 300)}` : ''}
${styleCtx ? `\n${safe(styleCtx, 300)}` : ''}

REGRAS DE DISTRIBUIÇÃO DE OBJETIVOS:
- ~40% educação/educar
- ~30% autoridade
- ~20% prova social / engajamento
- ~10% oferta / venda
Distribua os objetivos proporcionalmente entre os ${count} conteúdos.

PARA CADA CONTEÚDO, gere a estrutura conforme o formato:

CARROSSEL: conteudo_principal = array de objetos {slide_numero, titulo, texto} (6-8 slides)
POST ÚNICO: conteudo_principal = {headline, texto, cta}
ROTEIRO DE VÍDEO: conteudo_principal = {hook, desenvolvimento, conclusao, cta, texto_tela}
STORY: conteudo_principal = array de {frame_numero, texto, acao}
ARTIGO: conteudo_principal = {titulo, introducao, secoes: [{subtitulo, texto}], conclusao}
POST EDUCATIVO: conteudo_principal = {headline, texto, dica_pratica, cta}
POST DE AUTORIDADE: conteudo_principal = {headline, texto, dado_autoridade, cta}

Cada conteúdo DEVE ter: titulo, formato, objetivo, conteudo_principal, legenda (completa com emojis), headlines (3 variações), hashtags (5-8), embasamento (por que funciona).

REGRAS DE QUALIDADE:
- Cada conteúdo deve abordar uma dor ou desejo ESPECÍFICO do público
- Use o tom de voz definido de forma consistente
- Inclua gatilhos mentais relevantes (escassez, autoridade, prova social, reciprocidade)
- As legendas devem ter gancho forte na primeira linha
- Os CTAs devem ser claros e acionáveis
- Varie os ângulos — não repita a mesma abordagem

Gere conteúdos COMPLETOS, prontos para publicar. Não gere apenas ideias.`;
}

/**
 * User prompt simples — o trabalho pesado está no system prompt.
 */
export function buildUserPrompt(count: number): string {
  return `Gere exatamente ${count} conteúdos estratégicos seguindo a distribuição solicitada. Retorne no formato da tool.`;
}

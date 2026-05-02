// Prompts para extração estruturada de briefing para artes de redes sociais.
// Extraído de supabase/functions/generate-social-briefing/index.ts em 2026-05-02.

export const PROMPT_VERSION = '1.0.0';

export const SYSTEM_PROMPT = `Você é um diretor de arte e estrategista de marketing digital especializado em redes sociais.

Seu trabalho: Analisar o briefing do usuário (que pode ser um texto livre descrevendo a postagem desejada, OU um conteúdo já gerado pela ferramenta de conteúdos) e extrair os campos estruturados necessários para gerar uma arte de alta qualidade para redes sociais.

REGRAS:
1. Gere EXATAMENTE 3 opções de headline (curtas e impactantes, máx 6 palavras cada). Frases partidas funcionam bem (ex: "Investir não é sorte" / "É estratégia").
2. Gere EXATAMENTE 2 opções de subheadline (2-4 palavras cada).
3. O CTA deve ser uma chamada para ação curta e direta.
4. A descrição da cena deve ser VISUAL e ESPECÍFICA — descreva personagens, ambiente, iluminação, ação.
5. Os elementos visuais são objetos concretos que devem aparecer na imagem.
6. O supporting_text é um texto de apoio que contextualiza a mensagem (1-2 frases).
7. Bullet points são 2-4 palavras-chave separadas por vírgula.
8. Sugira o formato mais adequado (square=1:1, portrait=4:5, story=9:16) e o tipo de postagem.

IMPORTANTE: Pense como um designer que vai passar esse briefing para geração de imagem com IA. Cada campo deve contribuir para uma composição visual rica e profissional.

As 3 headlines devem ter abordagens DIFERENTES:
- Opção 1: Direta e impactante
- Opção 2: Provocativa / pergunta
- Opção 3: Emocional / aspiracional

As 2 subheadlines devem complementar as headlines de formas diferentes.

9. LEGENDA PARA REDES SOCIAIS: Gere uma legenda completa pronta para copiar e colar. Estrutura:
   - Linha 1: Hook forte com emoji (frase que prende atenção)
   - Linha 2-3: Valor/benefício principal
   - Linha 4: CTA direto (ex: "Comente 'EU QUERO'", "Salve para depois")
   - Linha 5: 3-5 hashtags relevantes
   A legenda deve ter tom profissional mas acessível, usar emojis estrategicamente, e ser otimizada para engajamento.`;

export interface SocialBriefingInput {
  briefing_text?: string;
  content_data?: {
    title?: string;
    body?: string;
    cta?: string;
    main_message?: string;
    objective?: string;
    result?: {
      titulo?: string;
      legenda?: string;
      conteudo_principal?: {
        headline?: string;
        texto?: string;
        cta?: string;
        dica_pratica?: string;
      };
    };
  };
  identidade_visual?: {
    palette?: unknown;
    style?: string;
    tone?: string;
    fonts?: unknown;
  };
  persona?: string | Record<string, unknown>;
}

/**
 * Monta o user prompt (contextBlock) para extração de briefing.
 * briefing_text e campos de content_data são truncados a 2000 chars.
 */
export function buildUserPrompt(input: SocialBriefingInput): string {
  let contextBlock = '';

  if (input.briefing_text) {
    contextBlock += `BRIEFING DO USUÁRIO:\n${input.briefing_text.slice(0, 2000)}\n\n`;
  }

  if (input.content_data) {
    const cd = input.content_data;
    contextBlock += `CONTEÚDO GERADO ANTERIORMENTE:\n`;
    if (cd.title) contextBlock += `Título: ${cd.title.slice(0, 300)}\n`;
    if (cd.body) contextBlock += `Corpo: ${cd.body.slice(0, 1000)}\n`;
    if (cd.cta) contextBlock += `CTA: ${cd.cta.slice(0, 200)}\n`;
    if (cd.main_message) contextBlock += `Mensagem principal: ${cd.main_message.slice(0, 500)}\n`;
    if (cd.objective) contextBlock += `Objetivo: ${cd.objective.slice(0, 300)}\n`;
    if (cd.result) {
      const r = cd.result;
      if (r.titulo) contextBlock += `Título resultado: ${r.titulo.slice(0, 300)}\n`;
      if (r.legenda) contextBlock += `Legenda: ${r.legenda.slice(0, 1000)}\n`;
      if (r.conteudo_principal) {
        const cp = r.conteudo_principal;
        if (cp.headline) contextBlock += `Headline: ${cp.headline.slice(0, 300)}\n`;
        if (cp.texto) contextBlock += `Texto: ${cp.texto.slice(0, 1000)}\n`;
        if (cp.cta) contextBlock += `CTA: ${cp.cta.slice(0, 200)}\n`;
        if (cp.dica_pratica) contextBlock += `Dica prática: ${cp.dica_pratica.slice(0, 500)}\n`;
      }
    }
    contextBlock += '\n';
  }

  if (input.identidade_visual) {
    const iv = input.identidade_visual;
    contextBlock += `IDENTIDADE VISUAL DA MARCA:\n`;
    if (iv.palette) contextBlock += `Paleta: ${JSON.stringify(iv.palette)}\n`;
    if (iv.style) contextBlock += `Estilo: ${iv.style}\n`;
    if (iv.tone) contextBlock += `Tom visual: ${iv.tone}\n`;
    if (iv.fonts) contextBlock += `Fontes: ${JSON.stringify(iv.fonts)}\n`;
    contextBlock += '\n';
  }

  if (input.persona) {
    contextBlock += `PERSONA/PÚBLICO-ALVO:\n`;
    if (typeof input.persona === 'string') contextBlock += input.persona.slice(0, 500) + '\n';
    else contextBlock += JSON.stringify(input.persona).slice(0, 500) + '\n';
    contextBlock += '\n';
  }

  return contextBlock;
}

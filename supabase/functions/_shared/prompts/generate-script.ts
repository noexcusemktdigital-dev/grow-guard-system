// Prompt para geração de scripts de vendas por etapa do funil.
// Extraído de supabase/functions/generate-script/index.ts em 2026-05-01.
// A fn usa um map de system prompts por etapa (stage) e monta o user prompt
// dinamicamente com contexto do Plano de Vendas + briefing do usuário.

export const PROMPT_VERSION = '1.0.0';

// System prompt base (role fixo para todos os stages)
export const SYSTEM_PROMPT = `Você é um consultor de vendas sênior brasileiro. Responda sempre em português brasileiro. Seja direto e prático. Personalize ao máximo com base no contexto do negócio fornecido.`;

// ── STAGE SYSTEM PROMPTS ─────────────────────────────────────────────

export type ScriptStage = 'prospeccao' | 'diagnostico' | 'negociacao' | 'fechamento' | 'objecoes';

export const STAGE_PROMPTS: Record<ScriptStage, string> = {
  prospeccao: `Você é um especialista em vendas B2B. Crie um script de PROSPECÇÃO profissional.

INSTRUÇÕES DE FORMATAÇÃO:
- Formate como um roteiro passo a passo numerado
- Inclua saudação inicial, qualificação rápida, gancho de valor e CTA
- Marque com [PAUSA] onde o vendedor deve esperar a resposta do prospect
- Inclua 2-3 variações para diferentes cenários (prospect receptivo, ocupado, resistente)
- Use linguagem adequada ao segmento do negócio
- Adapte o vocabulário e referências ao perfil do cliente ideal`,

  diagnostico: `Você é um especialista em vendas consultivas. Crie um script de DIAGNÓSTICO profissional.

INSTRUÇÕES DE FORMATAÇÃO:
- Formate como um roteiro de perguntas estratégicas numeradas
- Organize em blocos: Situação Atual, Desafios, Impacto, Solução Ideal
- Inclua perguntas de follow-up para cada resposta possível
- Marque com [ANOTAR] os pontos que o vendedor deve registrar
- Inclua transições suaves entre os blocos de perguntas
- Use exemplos e dados do segmento do negócio`,

  negociacao: `Você é um especialista em negociação comercial. Crie um script de NEGOCIAÇÃO profissional.

INSTRUÇÕES DE FORMATAÇÃO:
- Formate como um roteiro com seções: Apresentação de Valor, Proposta, Condições, Fechamento
- Inclua argumentos de valor antes de mencionar preço
- Adicione respostas para objeções de preço comuns
- Marque com [PAUSA] os momentos de escuta ativa
- Inclua técnicas de ancoragem e concessão estratégica
- Use os diferenciais competitivos da empresa como argumentos`,

  fechamento: `Você é um especialista em fechamento de vendas. Crie um script de FECHAMENTO profissional.

INSTRUÇÕES DE FORMATAÇÃO:
- Formate como um roteiro com gatilhos de fechamento
- Inclua técnicas: resumo de benefícios, urgência legítima, alternativa de escolha
- Adicione roteiros para diferentes sinais de compra
- Marque com [DECISÃO] os pontos onde pedir o fechamento
- Inclua script de próximos passos pós-aceite`,

  objecoes: `Você é um especialista em contorno de objeções. Crie um script de QUEBRA DE OBJEÇÕES profissional.

INSTRUÇÕES DE FORMATAÇÃO:
- Para cada objeção, use o framework: Empatia → Pergunta → Reframe → Evidência → Próximo passo
- Inclua variações de resposta (curta e detalhada)
- Marque com [EXEMPLO] onde incluir um caso real
- Adicione transições para retomar a negociação
- Organize por categoria: preço, timing, concorrência, autoridade`,
};

// ── INPUT / PROMPT BUILDERS ──────────────────────────────────────────

export interface ScriptContext {
  segment?: string;
  modeloNegocio?: string;
  produtosServicos?: string;
  products?: Array<{ name: string; price: number }>;
  diferenciais?: string;
  dorPrincipal?: string;
  ticketMedio?: string;
  channels?: string[];
  teamSize?: string;
  tempoFechamento?: string;
  etapasFunil?: string[];
}

export interface ScriptInput {
  stage: ScriptStage;
  briefing?: Record<string, unknown>;
  context?: ScriptContext;
  mode?: 'generate' | 'improve';
  existingScript?: string;
  referenceLinks?: string[];
  additionalContext?: string;
}

/**
 * Sanitiza input e monta o user prompt completo.
 * - Escapes markdown
 * - Trunca campos longos
 * - Suporta modo 'improve' (melhoria de script existente)
 */
export function buildUserPrompt(input: ScriptInput): string {
  const safe = (s: string | undefined, max = 300): string =>
    (s ?? '').replace(/[`\\]/g, '').slice(0, max).trim();

  const ctx = input.context ?? {};

  const productsStr = ctx.products?.length
    ? ctx.products.map(p => `${p.name} (R$${p.price})`).join(', ')
    : ctx.produtosServicos ?? 'Não cadastrados';

  const contextBlock = `
CONTEXTO DO NEGÓCIO (extraído automaticamente do Plano de Vendas):
- Segmento: ${safe(ctx.segment) || 'Não informado'}
- Modelo de Negócio: ${safe(ctx.modeloNegocio) || 'Não informado'}
- Produtos/Serviços: ${safe(productsStr)}
- Diferenciais Competitivos: ${safe(ctx.diferenciais) || 'Não informados'}
- Dor Principal do Cliente: ${safe(ctx.dorPrincipal) || 'Não informada'}
- Ticket Médio: ${safe(ctx.ticketMedio) || 'Não informado'}
- Canais de Aquisição: ${ctx.channels?.length ? ctx.channels.join(', ') : 'Não informados'}
- Tamanho da Equipe: ${safe(ctx.teamSize) || 'Não informado'}
- Tempo Médio de Fechamento: ${safe(ctx.tempoFechamento) || 'Não informado'}
- Etapas do Funil: ${ctx.etapasFunil?.length ? ctx.etapasFunil.join(', ') : 'Não definidas'}

INSTRUÇÕES IMPORTANTES:
- Use os dados acima para personalizar CADA parte do script
- O script deve refletir os produtos/serviços reais da empresa
- Os argumentos devem usar os diferenciais competitivos informados
- A linguagem deve ser adequada ao segmento e modelo de negócio
- Se a dor do cliente foi informada, construa o gancho em torno dela
`;

  const briefingBlock = Object.entries(input.briefing ?? {})
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${safe(String(v))}`)
    .join('\n');

  const linksBlock =
    Array.isArray(input.referenceLinks) && input.referenceLinks.length > 0
      ? `\n\nLINKS DE REFERÊNCIA fornecidos pelo usuário (use como inspiração para tom, abordagem e argumentos):\n${input.referenceLinks
          .slice(0, 10)
          .map((l, i) => `${i + 1}. ${safe(l, 200)}`)
          .join('\n')}`
      : '';

  const additionalBlock = input.additionalContext
    ? `\n\nCONTEXTO ADICIONAL fornecido pelo usuário (use para personalizar o script):\n${safe(input.additionalContext, 1000)}`
    : '';

  if (input.mode === 'improve' && input.existingScript) {
    return `Você é um especialista em vendas. Analise e MELHORE o script abaixo, mantendo a estrutura mas aprimorando linguagem, técnicas e efetividade.

SCRIPT ATUAL:
${safe(input.existingScript, 5000)}

${contextBlock}

INSTRUÇÕES:
- Mantenha o formato geral mas aprimore cada seção
- Adicione técnicas de vendas mais modernas
- Melhore as transições e CTAs
- Torne a linguagem mais natural e persuasiva
- Use os diferenciais e dados do negócio para personalizar
- Retorne APENAS o script melhorado, sem comentários${linksBlock}${additionalBlock}`;
  }

  return `${STAGE_PROMPTS[input.stage]}

${contextBlock}

BRIEFING DO USUÁRIO:
${briefingBlock || 'Nenhum briefing adicional fornecido.'}${linksBlock}${additionalBlock}

IMPORTANTE:
- Retorne APENAS o script, sem introduções ou comentários extras
- O script deve estar pronto para uso imediato pelo vendedor
- Adapte o tom e linguagem ao segmento do negócio
- Use os produtos, diferenciais e dores do cliente informados para personalizar`;
}

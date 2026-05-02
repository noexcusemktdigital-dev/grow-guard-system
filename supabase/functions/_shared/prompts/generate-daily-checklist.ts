// Prompts para geração de checklist diário personalizado por IA.
// Extraído de supabase/functions/generate-daily-checklist/index.ts em 2026-05-02.

export const PROMPT_VERSION = '1.0.0';

export const SYSTEM_PROMPT = `Você é um gestor de produtividade inteligente de uma plataforma SaaS de marketing e vendas.
Sua função é gerar um checklist diário personalizado com 5-8 tarefas ACIONÁVEIS e ESPECÍFICAS.

REGRAS:
- Use números reais dos dados (ex: "Fazer follow-up nos 3 leads quentes parados")
- Priorize: leads quentes sem contato > tarefas CRM vencidas > mensagens não respondidas > metas atrasadas > conteúdo pendente > rotina
- Categorias permitidas: "comercial", "marketing", "operacional", "estrategico"
- Prioridades: "alta", "media", "baixa"
- Se créditos estiverem baixos (<50), adicione tarefa para verificar plano
- Se não tem estratégia, sugira criar plano de marketing/vendas
- Títulos curtos e diretos (máx 60 caracteres)
- NÃO repita tarefas genéricas se não houver dados que justifiquem`;

export interface DailyChecklistContext {
  crm: {
    leads_sem_contato_24h: number;
    leads_quentes_parados_2d: number;
    tarefas_vencidas: number;
    propostas_pendentes: number;
    leads_novos_hoje: number;
  };
  comunicacao: {
    mensagens_nao_lidas: number;
    contatos_sem_resposta_24h: number;
  };
  conteudo: {
    roteiros_pendentes_aprovacao: number;
    postagens_rascunho: number;
  };
  metas: Array<{ titulo: string; atual: number; alvo: number; percentual: number }>;
  gamificacao: { streak: number; xp: number; nivel: number };
  creditos: number;
  tem_estrategia: boolean;
}

export interface DailyChecklistInput {
  today: string;
  context: DailyChecklistContext;
  templateTasks?: string[];
}

/**
 * Monta o user prompt para geração de checklist diário.
 * templateTasks (tarefas fixas do gestor) são incluídas se presentes.
 * Nenhuma sanitização adicional necessária — dados são numéricos/booleanos.
 */
export function buildUserPrompt(input: DailyChecklistInput): string {
  const templateBlock =
    input.templateTasks && input.templateTasks.length > 0
      ? `\nTarefas fixas do gestor (incluir obrigatoriamente):\n${input.templateTasks.slice(0, 20).map((t) => `- ${t.slice(0, 100)}`).join('\n')}`
      : '';

  return `Dados do usuário hoje (${input.today}):

${JSON.stringify(input.context, null, 2)}
${templateBlock}

Gere o checklist diário personalizado.`;
}

// Prompts para geração de tarefas diárias personalizadas por IA.
// Extraído de supabase/functions/generate-daily-tasks/index.ts em 2026-05-02.
// Nota: lógica quase idêntica a generate-daily-checklist mas persiste em client_tasks
// (não client_checklist_items) e suporta geração para outro usuário (target_user_id).

export const PROMPT_VERSION = '1.0.0';

export const SYSTEM_PROMPT = `Você é um gestor de produtividade inteligente de uma plataforma SaaS de marketing e vendas.
Gere um checklist diário personalizado com 5-8 tarefas ACIONÁVEIS e ESPECÍFICAS.

REGRAS:
- Use números reais dos dados (ex: "Fazer follow-up nos 3 leads quentes parados")
- Priorize: leads quentes sem contato > tarefas CRM vencidas > mensagens não respondidas > metas atrasadas > conteúdo pendente > rotina
- Categorias permitidas: "comercial", "marketing", "operacional", "estrategico"
- Prioridades: "alta", "media", "baixa"
- Se créditos estiverem baixos (<50), adicione tarefa para verificar plano
- Títulos curtos e diretos (máx 60 caracteres)
- NÃO repita tarefas genéricas se não houver dados que justifiquem`;

export interface DailyTasksContext {
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
  };
  metas: Array<{ titulo: string; atual: number; alvo: number; percentual: number }>;
  creditos: number;
}

export interface DailyTasksInput {
  today: string;
  context: DailyTasksContext;
}

/**
 * Monta o user prompt para geração de tarefas diárias.
 * Dados são numéricos/booleanos — sem sanitização adicional necessária.
 */
export function buildUserPrompt(input: DailyTasksInput): string {
  return `Dados do usuário hoje (${input.today}):\n\n${JSON.stringify(input.context, null, 2)}\n\nGere o checklist diário personalizado.`;
}

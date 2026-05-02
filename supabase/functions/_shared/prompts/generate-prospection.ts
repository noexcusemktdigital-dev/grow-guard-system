// Prompt para geração de plano completo de prospecção B2B.
// Extraído de supabase/functions/generate-prospection/index.ts em 2026-05-01.

export const PROMPT_VERSION = '1.0.0';

export const SYSTEM_PROMPT = `Você é um consultor de vendas B2B brasileiro sênior, especialista em franquias e agências de marketing digital. Seu papel é criar planos de prospecção detalhados e actionáveis para franqueados que vendem serviços de marketing, branding, performance e CRM.

O modelo de vendas é baseado em oferecer um DIAGNÓSTICO ou ESTRATÉGIA GRATUITA ao prospect. O objetivo final é sempre agendar uma conversa/reunião onde analisamos a empresa do prospect e criamos uma estratégia personalizada sem custo. A partir dessa reunião, apresentamos nossas soluções. Nunca tente vender diretamente — o gancho é sempre o valor gratuito do diagnóstico.

Sempre responda em português brasileiro. Seja prático, direto e use linguagem profissional de vendas consultivas.`;

export type NivelContato = 'frio' | 'morno' | 'quente';

export interface ProspectionInput {
  regiao: string;
  nicho: string;
  porte?: string;
  desafio?: string;
  objetivo?: string;
  nome_empresa?: string;
  site?: string;
  redes_sociais?: string;
  conhecimento_previo?: string;
  nivel_contato?: NivelContato;
  contato_decisor?: string;
  cargo_decisor?: string;
}

/**
 * Sanitiza input e monta user prompt.
 * - Escapes markdown delimiters and backslashes
 * - Trunca strings longas conforme o campo
 * - Filtra null/undefined
 */
export function buildUserPrompt(input: ProspectionInput): string {
  const safe = (s: string | undefined, max = 200): string =>
    (s ?? '').replace(/[`\\]/g, '').slice(0, max).trim();

  const nivelContatoLabel =
    input.nivel_contato === 'quente'
      ? 'Quente (já demonstrou interesse)'
      : input.nivel_contato === 'morno'
      ? 'Morno (já houve contato)'
      : 'Frio (nunca falou)';

  const decisorStr = input.contato_decisor
    ? `${safe(input.contato_decisor, 100)}${input.cargo_decisor ? ` (${safe(input.cargo_decisor, 100)})` : ''}`
    : 'Não informado';

  return `Crie um plano completo de prospecção B2B para o seguinte cenário:

DADOS DO PROSPECT:
- Nome da Empresa: ${safe(input.nome_empresa) || 'Não informado'}
- Região: ${safe(input.regiao)}
- Nicho/Segmento: ${safe(input.nicho)}
- Porte: ${safe(input.porte) || 'Não informado'}
- Site: ${safe(input.site) || 'Não informado'}
- Redes Sociais: ${safe(input.redes_sociais) || 'Não informado'}
- Nível de Contato: ${nivelContatoLabel}
- Decisor: ${decisorStr}
- O que já se sabe sobre a empresa: ${safe(input.conhecimento_previo) || 'Nada informado'}
- Principal dor ou necessidade identificada: ${safe(input.desafio) || 'Não informado'}
- Objetivo da Abordagem: ${safe(input.objetivo) || 'Agendar diagnóstico gratuito'}

CONTEXTO IMPORTANTE:
O objetivo final de toda prospecção é AGENDAR UMA CONVERSA DE DIAGNÓSTICO OU ESTRATÉGIA GRATUITA. Nós oferecemos ao prospect uma reunião onde analisamos a situação da empresa e criamos uma estratégia personalizada sem custo. Esse é o nosso principal gancho de vendas — o prospect recebe valor real gratuitamente e, a partir do diagnóstico, apresentamos nossas soluções.

CENÁRIOS DE CONTATO:
- Se o nível de contato é FRIO: Foque na abordagem inicial, pesquisa sobre a empresa e no convite para o diagnóstico gratuito como isca de valor.
- Se o nível é MORNO (já houve contato anterior): Foque em retomar a conversa, relembrar o que foi discutido e reforçar o convite para o diagnóstico.
- Se o nível é QUENTE (indicação ou interesse demonstrado): Foque em agilizar o agendamento da reunião, aproveitando a confiança já existente pela indicação.

Use o nome da empresa e do decisor nos scripts quando disponíveis. Todos os scripts devem ter como call-to-action o agendamento do diagnóstico/estratégia gratuita.

Use a ferramenta generate_prospection_plan para retornar o plano estruturado.`;
}

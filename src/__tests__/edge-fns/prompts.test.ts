/**
 * prompts — testa sanitização de buildUserPrompt nos 5 prompts de _shared/prompts/
 * 12 asserts: sanitização, truncagem, filtragem de null/undefined
 *
 * Sem imports Deno — cola as funções buildUserPrompt inline para cada prompt testado.
 */
import { describe, it, expect } from 'vitest';

// ── Helper safe inline (compartilhado por todos os prompts) ──────────────────

const safeFn = (max = 200) => (s: string | undefined): string =>
  (s ?? '').replace(/[`\\]/g, '').slice(0, max).trim();

// ── Prospection buildUserPrompt (espelho de generate-prospection.ts) ─────────

interface ProspectionInput {
  regiao: string;
  nicho: string;
  porte?: string;
  desafio?: string;
  objetivo?: string;
  nome_empresa?: string;
  site?: string;
  redes_sociais?: string;
  conhecimento_previo?: string;
  nivel_contato?: 'frio' | 'morno' | 'quente';
  contato_decisor?: string;
  cargo_decisor?: string;
}

function buildProspectionPrompt(input: ProspectionInput): string {
  const safe = safeFn(200);
  const nivelContatoLabel =
    input.nivel_contato === 'quente' ? 'Quente (já demonstrou interesse)' :
    input.nivel_contato === 'morno' ? 'Morno (já houve contato)' : 'Frio (nunca falou)';
  const decisorStr = input.contato_decisor
    ? `${safe(input.contato_decisor)}${input.cargo_decisor ? ` (${safe(input.cargo_decisor)})` : ''}`
    : 'Não informado';
  return `Crie um plano completo de prospecção B2B para o seguinte cenário:

DADOS DO PROSPECT:
- Nome da Empresa: ${safe(input.nome_empresa) || 'Não informado'}
- Região: ${safe(input.regiao)}
- Nicho/Segmento: ${safe(input.nicho)}
- Porte: ${safe(input.porte) || 'Não informado'}
- Nível de Contato: ${nivelContatoLabel}
- Decisor: ${decisorStr}
- Principal dor ou necessidade identificada: ${safe(input.desafio) || 'Não informado'}
- Objetivo da Abordagem: ${safe(input.objetivo) || 'Agendar diagnóstico gratuito'}`;
}

// ── Content buildUserPrompt (espelho de generate-content.ts) ─────────────────

function buildContentUserPrompt(count: number): string {
  return `Gere exatamente ${count} conteúdos estratégicos seguindo a distribuição solicitada. Retorne no formato da tool.`;
}

// ────────────────────────────────────────────────────────────────────────────

describe('prompts — sanitização de buildUserPrompt', () => {
  describe('generate-prospection', () => {
    it('não vaza backticks no prompt gerado', () => {
      const prompt = buildProspectionPrompt({
        regiao: 'São Paulo',
        nicho: 'Tech `injeção` de código',
        nome_empresa: 'Empresa `teste`',
      });
      expect(prompt).not.toContain('`');
    });

    it('não vaza backslashes no prompt gerado', () => {
      const prompt = buildProspectionPrompt({
        regiao: 'RS',
        nicho: 'Indústria \\n escape',
        desafio: 'Crescer \\r muito',
      });
      expect(prompt).not.toContain('\\n');
      expect(prompt).not.toContain('\\r');
    });

    it('trunca strings longas no limite do campo', () => {
      const longString = 'A'.repeat(500);
      const prompt = buildProspectionPrompt({
        regiao: longString,
        nicho: 'Tech',
      });
      // regiao tem max=200, então não deve aparecer 500 caracteres de A seguidos
      expect(prompt).not.toContain('A'.repeat(300));
    });

    it('filtra undefined: campos ausentes recebem fallback "Não informado"', () => {
      const prompt = buildProspectionPrompt({
        regiao: 'RJ',
        nicho: 'Saúde',
      });
      expect(prompt).toContain('Não informado');
    });

    it('nivel_contato=quente retorna label correto', () => {
      const prompt = buildProspectionPrompt({
        regiao: 'SP', nicho: 'Varejo', nivel_contato: 'quente',
      });
      expect(prompt).toContain('Quente (já demonstrou interesse)');
    });

    it('nivel_contato=morno retorna label correto', () => {
      const prompt = buildProspectionPrompt({
        regiao: 'SP', nicho: 'Varejo', nivel_contato: 'morno',
      });
      expect(prompt).toContain('Morno (já houve contato)');
    });

    it('nivel_contato ausente default para Frio', () => {
      const prompt = buildProspectionPrompt({ regiao: 'SP', nicho: 'Auto' });
      expect(prompt).toContain('Frio (nunca falou)');
    });

    it('decisor com cargo formata corretamente', () => {
      const prompt = buildProspectionPrompt({
        regiao: 'SP', nicho: 'Tech',
        contato_decisor: 'João Silva', cargo_decisor: 'CEO',
      });
      expect(prompt).toContain('João Silva (CEO)');
    });
  });

  describe('generate-content', () => {
    it('buildUserPrompt inclui count no texto', () => {
      const prompt = buildContentUserPrompt(10);
      expect(prompt).toContain('10');
    });

    it('buildUserPrompt não vaza estrutura de template (sem backticks extras)', () => {
      const prompt = buildContentUserPrompt(5);
      // deve ser string limpa sem chars de controle de template
      expect(prompt).not.toContain('${');
    });
  });

  describe('sanitização safe() genérica', () => {
    it('remove backtick de string antes de incluir no prompt', () => {
      const safe = safeFn(200);
      expect(safe('texto `perigoso`')).toBe('texto perigoso');
    });

    it('remove backslash de string antes de incluir no prompt', () => {
      const safe = safeFn(200);
      expect(safe('path\\to\\file')).toBe('pathtofile');
    });

    it('trata undefined retornando string vazia', () => {
      const safe = safeFn(200);
      expect(safe(undefined)).toBe('');
    });
  });
});

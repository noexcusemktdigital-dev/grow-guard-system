/**
 * T-REDACT-PATTERNS — Valida padrões de redactString para CPF, CNPJ, email, phone
 *
 * Verifica:
 * 1. redactString CPF formatado (com pontos e hífen)
 * 2. redactString CPF sem formatação (só dígitos)
 * 3. redactString CNPJ formatado
 * 4. redactString múltiplos emails no mesmo texto
 * 5. redactString telefone com 9 dígito inicial (celular BR)
 * 6. redactString texto sem PII retorna texto intacto
 *
 * 6 asserts
 */
import { describe, it, expect } from 'vitest';
import { redactString } from '../../../../supabase/functions/_shared/redact';

describe('redactString — padrões CPF/CNPJ/email/phone', () => {
  it('1. CPF formatado (000.000.000-00) é mascarado', () => {
    const result = redactString('CPF do cliente: 123.456.789-09');
    expect(result).not.toContain('123.456.789-09');
    expect(result).toContain('***');
  });

  it('2. CPF sem formatação (11 dígitos contíguos) é mascarado', () => {
    const result = redactString('CPF: 12345678909');
    expect(result).not.toContain('12345678909');
    expect(result).toContain('***');
  });

  it('3. CNPJ formatado (00.000.000/0000-00) é mascarado', () => {
    const result = redactString('CNPJ: 12.345.678/0001-90');
    expect(result).not.toContain('12.345.678/0001-90');
    expect(result).toContain('***');
  });

  it('4. Múltiplos emails no mesmo texto são todos mascarados', () => {
    const result = redactString('Emails: foo@bar.com e baz@qux.org');
    expect(result).not.toContain('foo@bar.com');
    expect(result).not.toContain('baz@qux.org');
    expect(result.match(/\*\*\*@\*\*\*/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('5. Telefone celular BR com 9 inicial (11 dígitos) é mascarado', () => {
    const result = redactString('Fone: 11987654321');
    expect(result).not.toContain('11987654321');
    expect(result).toContain('***');
  });

  it('6. Texto sem PII é retornado intacto', () => {
    const plain = 'Status do pedido: aprovado. Nenhuma informacao sensivel.';
    const result = redactString(plain);
    expect(result).toBe(plain);
  });
});

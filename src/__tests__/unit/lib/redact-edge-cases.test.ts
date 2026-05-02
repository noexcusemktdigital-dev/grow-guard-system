/**
 * T-REDACT-EDGE — Edge cases de redact, maskEmail e comportamento com tipos especiais
 *
 * Verifica:
 * 1. maskEmail com string vazia retorna '***'
 * 2. maskEmail sem '@' retorna '***'
 * 3. redact com valor Date object é preservado (Date não é chave PII)
 * 4. redact com null retorna null
 * 5. redact com undefined retorna undefined
 * 6. redact com número primitivo retorna o mesmo valor
 *
 * 6 asserts
 */
import { describe, it, expect } from 'vitest';
import {
  redact,
  maskEmail,
} from '../../../../supabase/functions/_shared/redact';

describe('maskEmail — edge cases', () => {
  it('string vazia retorna "***"', () => {
    expect(maskEmail('')).toBe('***');
  });

  it('string sem "@" retorna "***"', () => {
    expect(maskEmail('naotemarvoba')).toBe('***');
  });

  it('null retorna "***"', () => {
    expect(maskEmail(null)).toBe('***');
  });

  it('undefined retorna "***"', () => {
    expect(maskEmail(undefined)).toBe('***');
  });
});

describe('redact — tipos primitivos e especiais', () => {
  it('redact com null retorna null', () => {
    expect(redact(null)).toBeNull();
  });

  it('redact com undefined retorna undefined', () => {
    expect(redact(undefined)).toBeUndefined();
  });

  it('redact com número primitivo retorna o mesmo número', () => {
    expect(redact(42 as any)).toBe(42);
  });

  it('redact preserva objeto com Date dentro de campo não-PII', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const input = { created_at: now, name: 'Rafael' };
    const result = redact(input) as typeof input;
    // created_at não é chave PII — deve ser preservado como Date ou objeto
    expect(result.created_at).toBeTruthy();
    expect(result.name).toBe('Rafael');
  });

  it('redact em objeto vazio retorna objeto vazio', () => {
    const result = redact({});
    expect(result).toEqual({});
  });

  it('redact mascara campo "email" mas preserva campo "name"', () => {
    const input = { email: 'teste@teste.com', name: 'Fulano' };
    const result = redact(input) as typeof input;
    expect(result.email).toMatch(/^\*\*\*/);
    expect(result.name).toBe('Fulano');
  });
});

/**
 * T-EXTRA FORMATTERS — Cobertura adicional de formatadores
 *
 * Verifica:
 * 1. formatPhone com 9 dígitos (curto) retorna original
 * 2. formatBRL com NaN retorna R$ 0,00
 * 3. formatRelative no futuro retorna 'no futuro'
 * 4. formatRelative com diferença de 1 ano
 * 5. formatRelative com diferença de 2 meses
 * 6. formatRelative com diferença de 1 dia
 * 7. formatRelative com diferença de 1 hora
 * 8. formatRelative com diferença de 1 minuto (singular)
 *
 * 8 asserts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatPhone, formatBRL, formatRelative } from '../../../lib/formatters';

describe('formatPhone — edge cases', () => {
  it('retorna original quando número tem 9 dígitos (formato curto inválido)', () => {
    const short = '119999999'; // apenas 9 dígitos
    expect(formatPhone(short)).toBe(short);
  });

  it('retorna string vazia para undefined', () => {
    expect(formatPhone(undefined)).toBe('');
  });
});

describe('formatBRL — edge cases', () => {
  it('retorna R$ 0,00 para NaN', () => {
    expect(formatBRL(NaN)).toMatch(/R\$[\s ]0,00/);
  });

  it('retorna R$ 0,00 para undefined', () => {
    expect(formatBRL(undefined)).toMatch(/R\$[\s ]0,00/);
  });
});

describe('formatRelative — timeframes variados', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('data no futuro retorna "no futuro"', () => {
    const future = new Date('2026-06-15T13:00:00.000Z');
    expect(formatRelative(future)).toBe('no futuro');
  });

  it('diferença de ~1 ano retorna "há 1 ano"', () => {
    const oneYearAgo = new Date('2025-06-01T12:00:00.000Z'); // ~379 dias
    expect(formatRelative(oneYearAgo)).toBe('há 1 ano');
  });

  it('diferença de ~2 meses retorna "há 2 meses"', () => {
    const twoMonthsAgo = new Date('2026-04-15T12:00:00.000Z'); // ~60 dias
    expect(formatRelative(twoMonthsAgo)).toBe('há 2 meses');
  });

  it('diferença de 1 dia retorna "há 1 dia"', () => {
    const oneDayAgo = new Date('2026-06-14T12:00:00.000Z');
    expect(formatRelative(oneDayAgo)).toBe('há 1 dia');
  });

  it('diferença de 1 hora retorna "há 1 hora"', () => {
    const oneHourAgo = new Date('2026-06-15T11:00:00.000Z');
    expect(formatRelative(oneHourAgo)).toBe('há 1 hora');
  });

  it('diferença de 1 minuto retorna "há 1 minuto" (singular)', () => {
    const oneMinuteAgo = new Date('2026-06-15T11:59:00.000Z');
    expect(formatRelative(oneMinuteAgo)).toBe('há 1 minuto');
  });
});

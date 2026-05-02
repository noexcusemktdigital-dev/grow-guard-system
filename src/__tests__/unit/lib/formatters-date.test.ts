/**
 * T-DATE FORMATTERS — Cobertura de formatDate e formatDateTime
 *
 * Verifica:
 * 1. formatDate com ISO válido retorna data formatada BR
 * 2. formatDate com string inválida retorna ''
 * 3. formatDate com null retorna ''
 * 4. formatDate com undefined retorna ''
 * 5. formatDateTime com Date object retorna data+hora formatados BR
 * 6. formatDateTime com ISO válido inclui horas e minutos
 *
 * 6 asserts
 */
import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime } from '../../../lib/formatters';

describe('formatDate — ISO válido', () => {
  it('1. retorna data formatada pt-BR para ISO válido', () => {
    // 2026-01-15 → 15/01/2026
    const result = formatDate('2026-01-15T00:00:00.000Z');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result).toContain('2026');
  });

  it('2. retorna string vazia para string inválida', () => {
    expect(formatDate('nao-e-uma-data')).toBe('');
  });

  it('3. retorna string vazia para null', () => {
    expect(formatDate(null)).toBe('');
  });

  it('4. retorna string vazia para undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });
});

describe('formatDateTime — formatação com hora', () => {
  it('5. formata Date object com data e hora', () => {
    const d = new Date('2026-06-10T14:30:00.000Z');
    const result = formatDateTime(d);
    // deve conter separador de data e hora (/ e :)
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it('6. formata ISO string incluindo hora e minuto', () => {
    // qualquer ISO válido deve produzir padrão dd/mm/aaaa hh:mm
    const result = formatDateTime('2026-03-20T09:05:00.000Z');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result).toMatch(/\d{2}:\d{2}/);
    expect(result).toContain('2026');
  });
});

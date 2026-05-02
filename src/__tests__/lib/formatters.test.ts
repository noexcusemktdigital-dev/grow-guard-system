import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatBRL,
  formatPhone,
  formatCPF,
  formatCNPJ,
  formatDate,
  formatRelative,
} from '../../lib/formatters';

describe('formatBRL', () => {
  it('retorna R$ 0,00 para null', () => {
    // Intl.NumberFormat pode usar non-breaking space entre "R$" e o valor
    expect(formatBRL(null)).toMatch(/R\$[\s ]0,00/);
  });

  it('formata 1234.56 como R$ 1.234,56', () => {
    expect(formatBRL(1234.56)).toMatch(/R\$[\s ]1\.234,56/);
  });
});

describe('formatPhone', () => {
  it('formata numero com 11 digitos', () => {
    expect(formatPhone('11999999999')).toBe('(11) 9 9999-9999');
  });

  it('formata numero com 13 digitos comecando com 55', () => {
    expect(formatPhone('5511999999999')).toBe('+55 (11) 9 9999-9999');
  });

  it('retorna string vazia para null', () => {
    expect(formatPhone(null)).toBe('');
  });
});

describe('formatCPF', () => {
  it('formata CPF com 11 digitos', () => {
    expect(formatCPF('12345678901')).toBe('123.456.789-01');
  });

  it('retorna string vazia para null', () => {
    expect(formatCPF(null)).toBe('');
  });
});

describe('formatCNPJ', () => {
  it('formata CNPJ com 14 digitos', () => {
    expect(formatCNPJ('12345678000190')).toBe('12.345.678/0001-90');
  });
});

describe('formatDate', () => {
  it('formata ISO string em formato BR', () => {
    const result = formatDate('2026-01-15T12:00:00.000Z');
    expect(result).toMatch(/^\d{2}\/01\/2026$/);
  });

  it('retorna string vazia para null', () => {
    expect(formatDate(null)).toBe('');
  });
});

describe('formatRelative', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retorna "agora ha pouco" para menos de 60s', () => {
    const d = new Date('2026-01-15T11:59:30.000Z');
    expect(formatRelative(d)).toBe('agora há pouco');
  });

  it('retorna minutos corretamente', () => {
    const d = new Date('2026-01-15T11:57:00.000Z');
    expect(formatRelative(d)).toBe('há 3 minutos');
  });

  it('retorna horas corretamente', () => {
    const d = new Date('2026-01-15T09:00:00.000Z');
    expect(formatRelative(d)).toBe('há 3 horas');
  });

  it('retorna dias corretamente', () => {
    const d = new Date('2026-01-12T12:00:00.000Z');
    expect(formatRelative(d)).toBe('há 3 dias');
  });
});

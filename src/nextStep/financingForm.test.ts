import { describe, expect, it } from 'vitest';
import { formatCpf, formatWhatsapp, isValidCpf, isValidWhatsapp, validateFinancing } from './financingForm';

describe('formatting', () => {
  it('formats WhatsApp as it is typed', () => {
    expect(formatWhatsapp('3')).toBe('(3');
    expect(formatWhatsapp('319')).toBe('(31) 9');
    expect(formatWhatsapp('31999999999')).toBe('(31) 99999-9999');
    expect(formatWhatsapp('3133333333')).toBe('(31) 3333-3333');
    expect(formatWhatsapp('(31) 99999-99999')).toBe('(31) 99999-9999');
  });

  it('formats CPF as it is typed', () => {
    expect(formatCpf('123')).toBe('123');
    expect(formatCpf('1234')).toBe('123.4');
    expect(formatCpf('12345678909')).toBe('123.456.789-09');
    expect(formatCpf('123.456.789-0912')).toBe('123.456.789-09');
  });
});

describe('validation', () => {
  it('checks the CPF check digits, not only the length', () => {
    expect(isValidCpf('123.456.789-09')).toBe(true);
    expect(isValidCpf('123.456.789-00')).toBe(false);
    expect(isValidCpf('123')).toBe(false);
    expect(isValidCpf('111.111.111-11')).toBe(false);
  });

  it('accepts WhatsApp with area code', () => {
    expect(isValidWhatsapp('(31) 99999-9999')).toBe(true);
    expect(isValidWhatsapp('(31) 3333-3333')).toBe(true);
    expect(isValidWhatsapp('99999-9999')).toBe(false);
  });

  it('reports each invalid field and nothing for valid ones', () => {
    expect(validateFinancing({ name: 'Maycon', whatsapp: '(31) 99999-9999', cpf: '123' })).toEqual({
      cpf: 'Confira o CPF e digite os 11 números.',
    });
    expect(validateFinancing({ name: 'Maycon', whatsapp: '(31) 99999-9999', cpf: '123.456.789-09' })).toEqual({});
    expect(Object.keys(validateFinancing({ name: ' ', whatsapp: '', cpf: '' }))).toEqual(['name', 'whatsapp', 'cpf']);
  });
});

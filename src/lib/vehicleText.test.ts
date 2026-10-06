import { describe, expect, it } from 'vitest';
import type { Vehicle } from '../data/vehicles';
import { conditionSummary, fipeComparison, shownEvidence, trustItemText, trustSummary, vehicleEyebrow } from './vehicleText';

const base: Vehicle = {
  id: 'test',
  make: 'Honda',
  model: 'Civic',
  trim: 'Touring',
  version: '1.5 Turbo CVT',
  year: 2024,
  bodyType: 'sedan',
  price: 148990,
  storeId: 'centro',
  listedAt: '2026-09-01',
  media: [],
  evidence: [],
};

const withFipe = (value: number) => ({ ...base, fipe: { value, code: '000000-0', referenceMonth: 'outubro de 2026' } });

describe('fipeComparison', () => {
  it('says how far below, above or at the Tabela FIPE the price is', () => {
    expect(fipeComparison(withFipe(151200))).toBe('R$\u00a02.210 abaixo da Tabela FIPE');
    expect(fipeComparison(withFipe(140000))).toBe('R$\u00a08.990 acima da Tabela FIPE');
    expect(fipeComparison(withFipe(148990))).toBe('no valor da Tabela FIPE');
  });

  it('has nothing to say without FIPE', () => {
    expect(fipeComparison(base)).toBeUndefined();
  });
});

describe('evidence copy', () => {
  const evidence: Vehicle['evidence'] = [
    { type: 'cleanHistory' },
    { type: 'warranty', kind: 'factory', until: '2027-12' },
    { type: 'serviceHistory', services: 4 },
    { type: 'singleOwner' },
    { type: 'inspection', result: 'approved' },
  ];

  it('shows only evidence with copy, in the design order', () => {
    expect(shownEvidence({ ...base, evidence }).map((item) => item.type)).toEqual(['inspection', 'serviceHistory', 'warranty']);
  });

  it('writes the trust items like the design', () => {
    expect(shownEvidence({ ...base, evidence }).map(trustItemText)).toEqual([
      { title: 'Laudo cautelar aprovado', detail: 'documento disponível para consulta' },
      { title: 'Revisões registradas', detail: '4 revisões informadas no histórico' },
      { title: 'Garantia de fábrica', detail: 'vigente até dez/2027' },
    ]);
    expect(trustItemText({ type: 'serviceHistory', services: 1 }).detail).toBe('1 revisão informada no histórico');
  });

  it('summarizes what can be checked', () => {
    expect(trustSummary(shownEvidence({ ...base, evidence }))).toBe('laudo, revisões e garantia disponíveis para este carro.');
    expect(trustSummary([{ type: 'warranty', kind: 'factory', until: '2027-12' }])).toBe('garantia disponível para este carro.');
    expect(trustSummary([{ type: 'serviceHistory', services: 2 }])).toBe('revisões disponíveis para este carro.');
  });

  it('builds the condition text from data only', () => {
    expect(conditionSummary({ ...base, evidence, ipvaPaidYear: 2026 })).toBe(
      'Laudo cautelar aprovado · IPVA 2026 pago · revisões registradas.',
    );
    expect(conditionSummary({ ...base, ipvaPaidYear: 2026 })).toBe('IPVA 2026 pago.');
    expect(conditionSummary(base)).toBeUndefined();
  });
});

describe('vehicleEyebrow', () => {
  it('names the store without its own separator', () => {
    expect(vehicleEyebrow(base)).toBe('seminovo · Marés Centro');
  });
});

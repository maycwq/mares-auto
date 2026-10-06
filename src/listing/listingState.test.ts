import { describe, expect, it } from 'vitest';
import { vehicles } from '../data/vehicles';
import {
  DEFAULT_SORT,
  PAGE_SIZE,
  appliedFilters,
  countResults,
  emptyFilters,
  findResults,
  listingSearch,
  parseListingState,
  secondaryFilterCount,
  type ListingState,
} from './listingState';

const state = (patch: Partial<ListingState> = {}, filters: Partial<ListingState['filters']> = {}): ListingState => ({
  query: '',
  sort: DEFAULT_SORT,
  shown: PAGE_SIZE,
  ...patch,
  filters: { ...emptyFilters, ...filters },
});

describe('URL', () => {
  it('starts from the defaults with an empty search', () => {
    expect(parseListingState('')).toEqual(state());
    expect(listingSearch(state())).toBe('');
  });

  it('round-trips a full exploration', () => {
    const full = state(
      { query: 'civic touring', sort: 'menor-preco', shown: 36 },
      {
        brand: 'honda/civic',
        price: 'ate-150000',
        year: 'desde-2021',
        km: '50000',
        body: 'seda',
        transmission: ['automatico'],
        fuel: ['flex', 'hibrido-eletrico'],
        store: 'centro',
      },
    );
    expect(parseListingState(listingSearch(full))).toEqual(full);
  });

  it('ignores values it does not know', () => {
    const parsed = parseListingState('?preco=150000&tipo=tanque&cambio=automatico,voador&ordem=aleatoria&mostrar=-4');
    expect(parsed).toEqual(state({}, { transmission: ['automatico'] }));
  });
});

describe('results', () => {
  it('shows the whole stock without refinement', () => {
    expect(findResults(state())).toHaveLength(vehicles.length);
  });

  it('matches every searched word, ignoring case and accents', () => {
    const results = findResults(state({ query: 'CIVIC   touring' }));
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((v) => v.model === 'Civic' && v.trim === 'Touring')).toBe(true);
    expect(findResults(state({ query: 'citroen' })).every((v) => v.make === 'Citroën')).toBe(true);
  });

  it('applies every filter at once', () => {
    const results = findResults(state({}, { price: 'ate-150000', transmission: ['automatico'], body: 'suv' }));
    expect(results.length).toBeGreaterThan(0);
    for (const v of results) {
      expect(v.price).toBeLessThanOrEqual(150000);
      expect(v.transmission).toBe('automatic');
      expect(v.bodyType).toBe('suv');
    }
  });

  it('filters by a whole make or by one model', () => {
    const honda = findResults(state({}, { brand: 'honda' }));
    expect(new Set(honda.map((v) => v.make))).toEqual(new Set(['Honda']));
    expect(new Set(honda.map((v) => v.model)).size).toBeGreaterThan(1);
    const onix = findResults(state({}, { brand: 'chevrolet/onix' }));
    expect(new Set(onix.map((v) => v.model))).toEqual(new Set(['Onix']));
    expect(appliedFilters({ ...emptyFilters, brand: 'chevrolet' })).toEqual(['Chevrolet']);
    expect(appliedFilters({ ...emptyFilters, brand: 'chevrolet/onix-plus' })).toEqual(['Chevrolet Onix Plus']);
  });

  it('reads both ends of the price and year ranges', () => {
    const premium = findResults(state({}, { price: 'acima-200000' }));
    expect(premium.length).toBeGreaterThan(0);
    expect(premium.every((v) => v.price > 200000)).toBe(true);
    const older = findResults(state({}, { year: 'ate-2020' }));
    expect(older.length).toBeGreaterThan(0);
    expect(older.every((v) => v.year <= 2020)).toBe(true);
    expect(findResults(state({}, { year: 'desde-2024' })).every((v) => v.year >= 2024)).toBe(true);
  });

  it('gives each cut a different result', () => {
    for (const [field, values] of [
      ['price', ['ate-60000', 'ate-70000', 'ate-80000', 'ate-90000', 'ate-100000', 'ate-120000', 'ate-150000', 'ate-200000']],
      ['year', ['desde-2025', 'desde-2024', 'desde-2023', 'desde-2022', 'desde-2021']],
      ['km', ['10000', '20000', '30000', '50000', '80000', '100000']],
    ] as const) {
      const counts = values.map((value) => countResults('', { ...emptyFilters, [field]: value }));
      expect(counts.every((count, i) => count > 0 && (i === 0 || count > counts[i - 1]))).toBe(true);
      expect(counts.at(-1)).toBeLessThan(vehicles.length);
    }
  });

  it('groups hybrid and electric under one fuel option', () => {
    const results = findResults(state({}, { fuel: ['hibrido-eletrico'] }));
    expect(new Set(results.map((v) => v.fuel))).toEqual(new Set(['hybrid', 'electric']));
  });

  it("leaves out vehicles that don't have the data a filter checks", () => {
    const withoutKm = vehicles.filter((v) => v.km === undefined).map((v) => v.id);
    expect(withoutKm.length).toBeGreaterThan(0);
    expect(findResults(state({}, { km: '100000' })).some((v) => withoutKm.includes(v.id))).toBe(false);
  });

  it('can come back empty', () => {
    expect(countResults('', { ...emptyFilters, fuel: ['hibrido-eletrico'], transmission: ['manual'] })).toBe(0);
    expect(countResults('', { ...emptyFilters, price: 'acima-200000', body: 'hatch' })).toBe(0);
    expect(countResults('', { ...emptyFilters, year: 'ate-2020', fuel: ['hibrido-eletrico'] })).toBe(0);
  });

  it('sorts and keeps a stable order for ties', () => {
    const byPrice = findResults(state({ sort: 'menor-preco' }));
    expect(byPrice.map((v) => v.price)).toEqual([...byPrice.map((v) => v.price)].sort((a, b) => a - b));
    expect(findResults(state({ sort: 'menor-preco' }))).toEqual(byPrice);
    const byKm = findResults(state({ sort: 'menor-km' }));
    expect(byKm.at(-1)!.km).toBeUndefined();
  });

  it('counts the same results it finds', () => {
    const filters = { ...emptyFilters, price: 'ate-100000', fuel: ['flex'] };
    expect(countResults('', filters)).toBe(findResults(state({}, filters)).length);
  });
});

describe('applied filters', () => {
  it('lists one label per applied value', () => {
    const filters = { ...emptyFilters, price: 'ate-150000', transmission: ['automatico'], fuel: ['flex', 'diesel'] };
    expect(appliedFilters(filters)).toEqual(['Até R$ 150 mil', 'Automático', 'Flex', 'Diesel']);
    expect(secondaryFilterCount(filters)).toBe(3);
  });
});

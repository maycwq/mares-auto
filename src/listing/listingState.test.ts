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
        price: '150000',
        year: '2020',
        km: '60000',
        body: 'seda',
        transmission: ['automatico'],
        fuel: ['flex', 'hibrido-eletrico'],
        store: 'centro',
      },
    );
    expect(parseListingState(listingSearch(full))).toEqual(full);
  });

  it('ignores values it does not know', () => {
    const parsed = parseListingState('?preco=123&tipo=tanque&cambio=automatico,voador&ordem=aleatoria&mostrar=-4');
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
    const results = findResults(state({}, { price: '150000', transmission: ['automatico'], body: 'suv' }));
    expect(results.length).toBeGreaterThan(0);
    for (const v of results) {
      expect(v.price).toBeLessThanOrEqual(150000);
      expect(v.transmission).toBe('automatic');
      expect(v.bodyType).toBe('suv');
    }
  });

  it('filters by make or by make and model', () => {
    expect(findResults(state({}, { brand: 'honda' })).every((v) => v.make === 'Honda')).toBe(true);
    expect(findResults(state({}, { brand: 'chevrolet/onix' })).every((v) => v.model === 'Onix')).toBe(true);
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
  });

  it('sorts and keeps a stable order for ties', () => {
    const byPrice = findResults(state({ sort: 'menor-preco' }));
    expect(byPrice.map((v) => v.price)).toEqual([...byPrice.map((v) => v.price)].sort((a, b) => a - b));
    expect(findResults(state({ sort: 'menor-preco' }))).toEqual(byPrice);
    const byKm = findResults(state({ sort: 'menor-km' }));
    expect(byKm.at(-1)!.km).toBeUndefined();
  });

  it('counts the same results it finds', () => {
    const filters = { ...emptyFilters, price: '100000', fuel: ['flex'] };
    expect(countResults('', filters)).toBe(findResults(state({}, filters)).length);
  });
});

describe('applied filters', () => {
  it('lists one label per applied value', () => {
    const filters = { ...emptyFilters, price: '150000', transmission: ['automatico'], fuel: ['flex', 'diesel'] };
    expect(appliedFilters(filters)).toEqual(['Até R$ 150 mil', 'Automático', 'Flex', 'Diesel']);
    expect(secondaryFilterCount(filters)).toBe(3);
  });
});

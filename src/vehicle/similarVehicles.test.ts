import { describe, expect, it } from 'vitest';
import type { Vehicle } from '../data/vehicles';
import { findResults, parseListingState } from '../listing/listingState';
import { similarVehicles } from './similarVehicles';

const results = (search: string) => findResults(parseListingState(search));

const vehicle = (id: string, fields: Partial<Vehicle>): Vehicle => ({
  id,
  make: 'Honda',
  model: 'Civic',
  trim: 'Touring',
  version: '1.5 Turbo CVT',
  year: 2024,
  bodyType: 'sedan',
  price: 150000,
  storeId: 'centro',
  listedAt: '2026-09-01',
  media: [],
  evidence: [],
  ...fields,
});

describe('similarVehicles', () => {
  const current = vehicle('current', {});

  it('puts the same model first, then the same body type, then price, then year', () => {
    const candidates = [
      vehicle('suv-same-price', { make: 'Jeep', model: 'Compass', bodyType: 'suv', price: 150000 }),
      vehicle('sedan-far', { make: 'Toyota', model: 'Corolla', price: 120000 }),
      vehicle('sedan-near', { make: 'Toyota', model: 'Corolla', price: 145000 }),
      vehicle('civic-far', { price: 90000, year: 2019 }),
    ];
    expect(similarVehicles(current, candidates, 4).map((v) => v.id)).toEqual([
      'civic-far',
      'sedan-near',
      'sedan-far',
      'suv-same-price',
    ]);
  });

  it('breaks price ties by the closest year, then by listing order', () => {
    const candidates = [
      vehicle('older', { make: 'Toyota', model: 'Corolla', year: 2020 }),
      vehicle('first', { make: 'Toyota', model: 'Corolla', year: 2023 }),
      vehicle('second', { make: 'Toyota', model: 'Corolla', year: 2025 }),
    ];
    expect(similarVehicles(current, candidates).map((v) => v.id)).toEqual(['first', 'second', 'older']);
  });

  it('never includes the vehicle itself', () => {
    expect(similarVehicles(current, [current, vehicle('other', {})]).map((v) => v.id)).toEqual(['other']);
  });

  it('shows fewer, or none, instead of leaving the filters', () => {
    const list = results('?cambio=manual&preco=ate-100000');
    const similar = similarVehicles(list[0], list);
    expect(similar.every((other) => other.transmission === 'manual' && other.price <= 100000)).toBe(true);
    expect(similarVehicles(list[0], list.slice(0, 2))).toHaveLength(1);
    expect(similarVehicles(list[0], [list[0]])).toEqual([]);
  });

  it('uses the whole stock when there is no exploration behind the vehicle', () => {
    const stock = results('');
    const civic = stock.find((v) => v.model === 'Civic')!;
    const similar = similarVehicles(civic, stock);
    expect(similar).toHaveLength(3);
    const otherCivics = stock.filter((v) => v.model === 'Civic' && v.id !== civic.id).length;
    expect(similar.slice(0, Math.min(3, otherCivics)).every((v) => v.model === 'Civic')).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { vehicles } from '../data/vehicles';
import { findResults, parseListingState } from '../listing/listingState';
import { similarVehicles } from './similarVehicles';

const results = (search: string) => findResults(parseListingState(search));

describe('similarVehicles', () => {
  it('picks the results closest in price, without the vehicle itself', () => {
    const list = results('');
    const vehicle = list[40];
    const similar = similarVehicles(vehicle, list);
    expect(similar).toHaveLength(3);
    expect(similar).not.toContain(vehicle);
    const farthest = Math.max(...similar.map((other) => Math.abs(other.price - vehicle.price)));
    const rest = list.filter((other) => other !== vehicle && !similar.includes(other));
    expect(rest.every((other) => Math.abs(other.price - vehicle.price) >= farthest)).toBe(true);
  });

  it('stays inside the filters that led to the vehicle', () => {
    const list = results('?cambio=manual&preco=ate-100000');
    const similar = similarVehicles(list[0], list);
    expect(similar.length).toBeGreaterThan(0);
    expect(similar.every((other) => other.transmission === 'manual' && other.price <= 100000)).toBe(true);
  });

  it('returns fewer, or none, when the exploration has nothing else', () => {
    const list = results('');
    const vehicle = list[0];
    expect(similarVehicles(vehicle, [vehicle])).toEqual([]);
    expect(similarVehicles(vehicle, list.slice(0, 2))).toHaveLength(1);
  });

  it('is stable for the same exploration', () => {
    const vehicle = vehicles[10];
    expect(similarVehicles(vehicle, results('')).map((v) => v.id)).toEqual(
      similarVehicles(vehicle, results('')).map((v) => v.id),
    );
  });
});

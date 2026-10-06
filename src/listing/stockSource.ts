import type { Vehicle } from '../data/vehicles';
import { devTest } from '../lib/devTest';
import { findResults, PAGE_SIZE, type ListingState } from './listingState';

// Where result sets come from. Today it is the local dataset, so a set is ready the
// moment it's asked for and the page publishes it in the same frame: no wait, no status,
// no skeleton. A set that was already computed comes back from memory. The shape (a value
// or a promise, cancellable) is the one a real request will have, and the development
// test switches make it a promise to exercise waiting, out-of-order answers and failure.
export type StockCriteria = Pick<ListingState, 'query' | 'sort' | 'filters'>;

const sets = new Map<string, Vehicle[]>();

function compute(key: string, criteria: StockCriteria) {
  const results = findResults({ ...criteria, shown: PAGE_SIZE });
  sets.set(key, results);
  return results;
}

// The set for this key if it can be had right now, without waiting.
export function peekStock(key: string, criteria: StockCriteria): Vehicle[] | undefined {
  const known = sets.get(key);
  if (known) return known;
  const test = devTest();
  if (test.stockLatency === undefined && !test.stockFail) return compute(key, criteria);
  return undefined;
}

export function loadStock(key: string, criteria: StockCriteria, signal: AbortSignal): Vehicle[] | Promise<Vehicle[]> {
  const ready = peekStock(key, criteria);
  if (ready) return ready;
  const test = devTest();
  const latency = typeof test.stockLatency === 'function' ? test.stockLatency(criteria) : (test.stockLatency ?? 0);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (test.stockFail) reject(new Error('stock unavailable'));
      else resolve(compute(key, criteria));
    }, latency);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('aborted', 'AbortError'));
    });
  });
}

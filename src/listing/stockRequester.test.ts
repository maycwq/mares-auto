import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStockRequester, type StockStatus } from './stockRequester';

type Pending = { key: string; resolve: (value: string) => void; reject: () => void; signal: AbortSignal };

function setup(sync = false) {
  const pending: Pending[] = [];
  const published: string[] = [];
  const statuses: StockStatus[] = [];
  const requester = createStockRequester<string, string>(
    (key, _criteria, signal) => {
      if (sync) return `set:${key}`;
      return new Promise<string>((resolve, reject) => pending.push({ key, resolve, reject: () => reject(new Error()), signal }));
    },
    (key) => published.push(key),
    (status) => statuses.push(status),
  );
  return { requester, pending, published, statuses };
}

describe('stock requester', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('publishes a ready set right away, without a wait', () => {
    const { requester, published, statuses } = setup(true);
    requester.request('a', 'a');
    expect(published).toEqual(['a']);
    expect(statuses).toEqual(['idle']);
  });

  it('lets only the latest revision publish, even if an older answer arrives later', async () => {
    const { requester, pending, published } = setup();
    requester.request('corolla', 'corolla');
    requester.request('honda', 'honda');
    expect(pending[0].signal.aborted).toBe(true);
    pending[1].resolve('honda');
    pending[0].resolve('corolla');
    await vi.runAllTimersAsync();
    expect(published).toEqual(['honda']);
  });

  it('says it is slow only after the threshold, and never for answers before it', async () => {
    const { requester, pending, statuses } = setup();
    requester.request('a', 'a');
    vi.advanceTimersByTime(100);
    pending[0].resolve('a');
    await vi.runAllTimersAsync();
    expect(statuses).toEqual(['pending', 'idle']);

    requester.request('b', 'b');
    vi.advanceTimersByTime(200);
    expect(statuses.at(-1)).toBe('slow');
    pending[1].resolve('b');
    await vi.runAllTimersAsync();
    expect(statuses.at(-1)).toBe('idle');
  });

  it('keeps the published set on failure and reports it', async () => {
    const { requester, pending, published, statuses } = setup();
    requester.request('a', 'a');
    pending[0].reject();
    await vi.runAllTimersAsync();
    expect(published).toEqual([]);
    expect(statuses.at(-1)).toBe('failed');
  });

  it('drops pending work when cancelled (back/forward, leaving the page)', async () => {
    const { requester, pending, published } = setup();
    requester.request('a', 'a');
    requester.cancel();
    pending[0].resolve('a');
    await vi.runAllTimersAsync();
    expect(published).toEqual([]);
    expect(pending[0].signal.aborted).toBe(true);
  });
});

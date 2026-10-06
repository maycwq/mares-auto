import { describe, expect, it } from 'vitest';
import { planTransition } from './gridTransition';

const card = (id: string, top: number, left = 0) => ({ id, box: { top, left, width: 300, height: 400 } });
const options = { viewportHeight: 900, rowPitch: 424, limit: 9 };

describe('planTransition', () => {
  it('moves cards that stay within a row, fades new ones in and old ones out', () => {
    const before = [card('a', 100, 0), card('b', 100, 320), card('c', 100, 640)];
    const after = [card('b', 100, 0), card('d', 100, 320), card('a', 100, 640)];
    expect(planTransition(before, after, options)).toEqual({
      flip: [
        { id: 'b', dx: 320, dy: 0 },
        { id: 'a', dx: -640, dy: 0 },
      ],
      enter: ['d'],
      exit: ['c'],
    });
  });

  it('replaces far moves locally instead of sending a card across the page', () => {
    const before = [card('a', 100)];
    const after = [card('x', 100), card('a', 1300)];
    const plan = planTransition(before, [card('x', 100), card('a', 600)], { ...options, rowPitch: 424 });
    expect(plan.flip).toEqual([]);
    expect(plan.enter).toEqual(['x', 'a']);
    expect(plan.exit).toEqual(['a']);
    // Off screen after: final place directly, only the old slot clears.
    expect(planTransition(before, after, options)).toEqual({ flip: [], enter: ['x'], exit: ['a'] });
  });

  it('leaves off-screen cards alone and respects the limit', () => {
    const before = Array.from({ length: 12 }, (_, index) => card(`o${index}`, 100 + index * 10));
    const after = Array.from({ length: 12 }, (_, index) => card(`n${index}`, 100 + index * 10));
    const plan = planTransition(before, after, { ...options, limit: 4 });
    expect(plan.enter).toHaveLength(4);
    expect(plan.exit).toHaveLength(4);
    expect(planTransition([card('a', 2000)], [card('b', 2000)], options)).toEqual({ flip: [], enter: [], exit: [] });
  });

  it('puts a keyboard-focused card in its new place directly', () => {
    const plan = planTransition([card('a', 100, 0)], [card('a', 100, 320)], { ...options, pinned: new Set(['a']) });
    expect(plan).toEqual({ flip: [], enter: [], exit: [] });
  });
});

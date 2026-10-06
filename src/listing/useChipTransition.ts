import { useLayoutEffect, useRef, type RefObject } from 'react';
import { animate, animateHeight, duration, easing, inertCopy, placeCopy, prefersReducedMotion } from '../lib/motion';

type Snapshot = { chips: Map<string, { copy: HTMLElement; rect: DOMRect }>; height: number | undefined };

// The applied-filter chips change with the same commit as the results: a new chip fades
// in (160 ms), a removed one fades out where it was (80 ms, an inert copy) and the row
// follows a change in wrapping (160 ms). A chip that comes back while its copy is still
// leaving takes its place at once. Each chip's <li> carries its label in data-chip;
// copies are placed in `host`, which must be positioned.
export function useChipTransition(
  list: RefObject<HTMLUListElement | null>,
  host: RefObject<HTMLElement | null>,
  labels: string[],
  animateChanges: boolean,
) {
  const key = labels.join('\n');
  const lastKey = useRef(key);
  const snapshot = useRef<Snapshot>(undefined);
  const leaving = useRef(new Map<string, () => void>());

  // The chips on screen have to be read before React replaces them.
  if (key !== lastKey.current) {
    lastKey.current = key;
    const items = [...(list.current?.querySelectorAll<HTMLElement>(':scope > [data-chip]') ?? [])];
    snapshot.current =
      animateChanges && !prefersReducedMotion()
        ? {
            chips: new Map(items.map((item) => [item.dataset.chip!, { copy: inertCopy(item), rect: item.getBoundingClientRect() }])),
            height: list.current?.getBoundingClientRect().height,
          }
        : undefined;
  }

  useLayoutEffect(() => {
    const before = snapshot.current;
    snapshot.current = undefined;
    const container = host.current;
    if (!before || !container) return;
    const present = new Set(key ? key.split('\n') : []);

    for (const [label, { copy, rect }] of before.chips) {
      if (present.has(label)) continue;
      const remove = placeCopy(copy, rect, container);
      const out = animate(copy, [{ opacity: 1 }, { opacity: 0 }], { duration: duration.micro, easing: easing.exit, fill: 'forwards' });
      const done = () => {
        remove();
        if (leaving.current.get(label) === done) leaving.current.delete(label);
      };
      leaving.current.set(label, done);
      if (out) out.finished.then(done, done);
      else done();
    }

    const row = list.current;
    for (const item of row?.querySelectorAll<HTMLElement>(':scope > [data-chip]') ?? []) {
      const label = item.dataset.chip!;
      leaving.current.get(label)?.();
      if (!before.chips.has(label)) {
        animate(item, [{ opacity: 0 }, { opacity: 1 }], { duration: duration.short, easing: easing.enter });
      }
    }
    if (row && before.height !== undefined) {
      animateHeight(row, { from: before.height, duration: duration.short, easing: easing.layout });
    }
  }, [key, list, host]);
}

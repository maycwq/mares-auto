import { useLayoutEffect, useRef, type RefObject } from 'react';
import { animate, animateHeight, duration, easing, inertCopy, placeCopy, prefersReducedMotion } from '../lib/motion';

// What an in-app action asked for when it changed the region. Browser back/forward,
// reloads and links opened directly change the region without any of these, and land
// directly.
export type RegionMotion = 'forward' | 'back' | 'success';

type Snapshot = {
  panelHeight: number;
  regions: { copy: HTMLElement; rect: DOMRect }[];
  contextTop: number;
};

// The next step is one panel: the vehicle context stays, the region around it changes
// (N06–N08, F08). The outgoing region leaves as an inert copy (80 ms) while the new one
// comes in 12px from the side the person is going to (240 ms) and the panel follows the
// new height (240 ms). The confirmation instead fades its text in over the form's place
// while the context slides to where it now sits. Focus moves on the commit, never after
// the motion. Children of the panel marked data-region change; data-context stays.
export function useRegionTransition(
  panel: RefObject<HTMLElement | null>,
  regionKey: string,
  pending: RefObject<RegionMotion | undefined>,
) {
  const lastKey = useRef(regionKey);
  const snapshot = useRef<Snapshot>(undefined);
  const stop = useRef<() => void>(undefined);

  // The outgoing region has to be read before React replaces it.
  if (regionKey !== lastKey.current) {
    lastKey.current = regionKey;
    snapshot.current = panel.current && pending.current && !prefersReducedMotion() ? capture(panel.current) : undefined;
  }

  useLayoutEffect(() => {
    const kind = pending.current;
    const before = snapshot.current;
    pending.current = undefined;
    snapshot.current = undefined;
    const element = panel.current;
    if (!kind || !element) return;
    stop.current?.();
    stop.current = before && play(element, before, kind);
    if (kind === 'forward') element.querySelector<HTMLElement>('[data-region] h1')?.focus({ preventScroll: true });
    // Back at the choice, on the option that was chosen.
    if (kind === 'back') element.querySelector<HTMLElement>('input[type="radio"]:checked')?.focus({ preventScroll: true });
  }, [regionKey, panel, pending]);

  useLayoutEffect(() => () => stop.current?.(), []);
}

const regionsOf = (panel: HTMLElement) => [...panel.querySelectorAll<HTMLElement>(':scope > [data-region]')];
const contextOf = (panel: HTMLElement) => panel.querySelector<HTMLElement>(':scope > [data-context]');

function capture(panel: HTMLElement): Snapshot {
  return {
    panelHeight: panel.getBoundingClientRect().height,
    regions: regionsOf(panel).map((region) => {
      const copy = inertCopy(region);
      copy.removeAttribute('data-region');
      return { copy, rect: region.getBoundingClientRect() };
    }),
    contextTop: contextOf(panel)?.getBoundingClientRect().top ?? 0,
  };
}

function play(panel: HTMLElement, before: Snapshot, kind: RegionMotion) {
  const removers: (() => void)[] = [];
  const animations: Animation[] = [];
  const track = (animation: Animation | undefined) => animation && animations.push(animation);

  const incoming = regionsOf(panel);
  track(animateHeight(panel, { from: before.panelHeight, duration: duration.medium, easing: easing.layout }));

  for (const { copy, rect } of before.regions) {
    const remove = placeCopy(copy, rect, panel);
    removers.push(remove);
    const out = animate(copy, [{ opacity: 1 }, { opacity: 0 }], { duration: duration.micro, easing: easing.exit, fill: 'forwards' });
    if (out) out.finished.then(remove, remove);
    else remove();
  }

  if (kind === 'success') {
    const context = contextOf(panel);
    const shift = context ? before.contextTop - context.getBoundingClientRect().top : 0;
    if (context && Math.abs(shift) > 0.5) {
      track(
        animate(context, [{ transform: `translateY(${shift}px)` }, { transform: 'none' }], {
          duration: duration.medium,
          easing: easing.layout,
        }),
      );
    }
    // The check (the confirmation's icon) appears in 80 ms; the words follow, 80 ms
    // later, in 160 ms.
    for (const element of incoming.flatMap((region) => [...region.children])) {
      const check = element instanceof SVGElement;
      track(
        animate(element, [{ opacity: 0 }, { opacity: 1 }], {
          duration: check ? duration.micro : duration.short,
          delay: check ? 0 : duration.micro,
          easing: check ? easing.linear : easing.enter,
          fill: 'backwards',
        }),
      );
    }
  } else {
    const shift = kind === 'back' ? -12 : 12;
    for (const region of incoming) {
      track(
        animate(region, [{ transform: `translateX(${shift}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], {
          duration: duration.medium,
          easing: easing.enter,
        }),
      );
    }
  }

  // A newer change, or leaving the page, ends this one in its final state.
  return () => {
    for (const animation of animations) animation.finish();
    for (const remove of removers) remove();
  };
}

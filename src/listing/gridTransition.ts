import {
  animate,
  copyOrigin,
  duration,
  easing,
  inertCopy,
  isOverlayLeaving,
  placeCopy,
  prefersReducedMotion,
  trackCleanup,
} from '../lib/motion';

// The result-set transaction (L06–L09, L12–L14). When a new set is published, cards
// that stay move from where they were (if it's no more than a row away), cards that
// leave fade where they were as inert copies, and cards that arrive fade in where they
// land, all at once. Only what's on screen moves, and only up to a limit; everything
// else is simply in its final place. The state is already final underneath: this only
// paints the change.

export type Box = { top: number; left: number; width: number; height: number };
type Placed = { id: string; box: Box };

export type TransitionPlan = {
  flip: { id: string; dx: number; dy: number }[];
  enter: string[];
  exit: string[];
};

const isVisible = (box: Box, viewportHeight: number) => box.top < viewportHeight && box.top + box.height > 0;

// Pure: decides what each visible card does. `pinned` cards (keyboard focus inside) take
// their new place directly.
export function planTransition(
  before: Placed[],
  after: Placed[],
  options: { viewportHeight: number; rowPitch: number; limit: number; pinned?: Set<string> },
): TransitionPlan {
  const { viewportHeight, rowPitch, limit, pinned = new Set() } = options;
  const was = new Map(before.filter((card) => isVisible(card.box, viewportHeight)).map((card) => [card.id, card.box]));
  const staying = new Set(after.map((card) => card.id));
  const plan: TransitionPlan = { flip: [], enter: [], exit: [] };

  for (const card of after) {
    const previous = was.get(card.id);
    if (!isVisible(card.box, viewportHeight)) {
      // Gone from the screen to a place below or above it: only its old slot clears.
      if (previous && plan.exit.length < limit) plan.exit.push(card.id);
      continue;
    }
    if (plan.flip.length + plan.enter.length >= limit || pinned.has(card.id)) continue;
    if (previous && Math.abs(previous.top - card.box.top) <= rowPitch) {
      const dx = previous.left - card.box.left;
      const dy = previous.top - card.box.top;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) plan.flip.push({ id: card.id, dx, dy });
      continue;
    }
    // New here, or too far to travel: it appears in its slot while the old slot clears.
    plan.enter.push(card.id);
    if (previous && plan.exit.length < limit) plan.exit.push(card.id);
  }
  for (const [id] of was) {
    if (!staying.has(id) && plan.exit.length < limit) plan.exit.push(id);
  }
  return plan;
}

// --- DOM ---------------------------------------------------------------------------

export type GridSnapshot = { cards: (Placed & { copy: HTMLElement })[]; hostHeight: number };

const CARD = '[data-motion-id]';
const MAX_COPIES = 12;
const toBox = (rect: DOMRect): Box => ({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });

// Read-only: where the visible cards are right now (in-flight movement included), with an
// inert copy of each, taken before React replaces them.
export function captureGrid(host: HTMLElement): GridSnapshot {
  const viewportHeight = window.innerHeight;
  const cards: GridSnapshot['cards'] = [];
  for (const element of host.querySelectorAll<HTMLElement>(CARD)) {
    const box = toBox(element.getBoundingClientRect());
    if (!isVisible(box, viewportHeight)) continue;
    cards.push({ id: element.dataset.motionId!, box, copy: inertCopy(element) });
    if (cards.length >= MAX_COPIES) break;
  }
  return { cards, hostHeight: host.getBoundingClientRect().height };
}

const active = new WeakMap<HTMLElement, () => void>();

// Stops whatever the previous transaction on this host is still doing: animations end
// in their final state and copies go away. A late callback of an old transaction can't
// touch the new one, because everything it owns is already gone.
export function stopGridMotion(host: HTMLElement) {
  active.get(host)?.();
  active.delete(host);
}

export function playGridTransition(host: HTMLElement, before: GridSnapshot | undefined, kind: 'commit' | 'append') {
  stopGridMotion(host);
  if (!before || prefersReducedMotion()) return;
  // Results ready while an overlay is still leaving are published in their final layout.
  if (kind === 'commit' && isOverlayLeaving()) return;

  const viewportHeight = window.innerHeight;
  const elements = new Map<string, HTMLElement>();
  const after: Placed[] = [];
  for (const element of host.querySelectorAll<HTMLElement>(CARD)) {
    const id = element.dataset.motionId!;
    elements.set(id, element);
    after.push({ id, box: toBox(element.getBoundingClientRect()) });
  }
  const focused = document.activeElement;
  const pinned = new Set(
    [...elements].filter(([, element]) => element.contains(focused) && focused?.matches(':focus-visible')).map(([id]) => id),
  );
  const list = host.querySelector('ul');
  const gap = list ? parseFloat(getComputedStyle(list).rowGap) || 0 : 0;
  const rowPitch = (after[0]?.box.height ?? before.cards[0]?.box.height ?? 0) + gap;
  const limit = window.innerWidth < 1024 ? 4 : 9;

  const plan =
    kind === 'append'
      ? { flip: [], enter: after.filter((card) => !before.cards.some((old) => old.id === card.id) && isVisible(card.box, viewportHeight)).slice(0, limit).map((card) => card.id), exit: [] }
      : planTransition(before.cards, after, { viewportHeight, rowPitch, limit, pinned });

  // Every measure before the first write, so the new layout is computed once.
  const hostBox = host.getBoundingClientRect();
  const height = hostBox.height;
  const page = document.documentElement.scrollHeight;
  const shortest = Math.min(page, page + before.hostHeight - height);
  const origin = copyOrigin(host);

  const animations: Animation[] = [];
  const removers: (() => void)[] = [];

  for (const id of plan.exit) {
    const card = before.cards.find((old) => old.id === id);
    if (!card) continue;
    const remove = placeCopy(card.copy, DOMRect.fromRect({ x: card.box.left, y: card.box.top, width: card.box.width, height: card.box.height }), host, origin);
    removers.push(remove);
    const fade = animate(card.copy, [{ opacity: 1 }, { opacity: 0 }], { duration: duration.micro, easing: easing.exit });
    if (fade) {
      animations.push(fade);
      fade.finished.then(remove, remove);
    } else remove();
  }
  for (const { id, dx, dy } of plan.flip) {
    const move = animate(elements.get(id)!, [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
      duration: duration.medium,
      easing: easing.layout,
    });
    if (move) animations.push(move);
  }
  for (const id of plan.enter) {
    const fade = animate(elements.get(id)!, [{ opacity: 0 }, { opacity: 1 }], { duration: duration.short, easing: easing.enter });
    if (fade) animations.push(fade);
  }

  // One measured height for the whole set (measured above), only on commits that change
  // the mass on screen, and only if the page stays tall enough for where it's scrolled
  // from the first frame to the last. Otherwise the browser would pull the scroll position along with
  // the height; the set takes its final height at once and the scroll, if it must, moves
  // once.
  if (
    kind === 'commit' &&
    Math.abs(height - before.hostHeight) > 1 &&
    hostBox.top < viewportHeight &&
    hostBox.bottom > 0 &&
    window.scrollY + viewportHeight <= shortest
  ) {
    host.style.overflow = 'clip';
    host.style.overflowClipMargin = '8px';
    const resize = animate(host, [{ height: `${before.hostHeight}px` }, { height: `${height}px` }], {
      duration: duration.medium,
      easing: easing.layout,
    });
    const release = () => {
      host.style.overflow = '';
      host.style.overflowClipMargin = '';
    };
    if (resize) {
      animations.push(resize);
      removers.push(trackCleanup(release));
      resize.finished.then(release, release);
    } else release();
  }

  active.set(host, () => {
    for (const animation of animations) animation.cancel();
    for (const remove of removers) remove();
  });
}

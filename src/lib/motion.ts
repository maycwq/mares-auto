// The motion system. Motion only makes a change readable: state, focus, validation,
// availability and navigation never wait for it, and nothing here decides business
// state. Every animation started through this module can be settled at once, which is
// what happens when reduced motion is turned on in the middle of one.

export const duration = { instant: 0, micro: 80, short: 160, medium: 240, long: 320 } as const;

export const easing = {
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  layout: 'cubic-bezier(0.4, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  linear: 'linear',
} as const;

// Functional waits, not animation: search debounce and the threshold before a real wait
// shows a status or a skeleton. Neither imposes a minimum time on screen.
export const SEARCH_DEBOUNCE_MS = 160;
export const SLOW_THRESHOLD_MS = 160;

const reducedQuery = typeof window === 'undefined' ? null : window.matchMedia('(prefers-reduced-motion: reduce)');

export const prefersReducedMotion = () => reducedQuery?.matches ?? false;

const running = new Set<Animation>();
const cleanups = new Set<() => void>();

// Finish every animation (their end state is the real state) and remove every temporary
// layer. No event from the animations is needed for that.
export function settleAllMotion() {
  for (const animation of [...running]) animation.finish();
  for (const cleanup of [...cleanups]) cleanup();
}

reducedQuery?.addEventListener('change', () => {
  if (reducedQuery.matches) settleAllMotion();
});

type MotionOptions = KeyframeAnimationOptions & {
  // Opacity-only changes that may keep a short fade under reduced motion (image, backdrop,
  // status). Anything else is skipped under reduced motion.
  reducedFade?: boolean;
};

// Starts a Web Animation unless reduced motion asks for the final state directly, in
// which case nothing runs and the caller's final state already applies.
export function animate(element: Element, keyframes: Keyframe[], options: MotionOptions): Animation | undefined {
  const { reducedFade, ...timing } = options;
  let settings: KeyframeAnimationOptions = timing;
  if (prefersReducedMotion()) {
    if (!reducedFade) return undefined;
    settings = { ...timing, duration: Math.min(Number(timing.duration ?? 0), duration.micro), delay: 0, easing: easing.linear };
  }
  if (!settings.duration) return undefined;
  const animation = element.animate(keyframes, settings);
  running.add(animation);
  const forget = () => running.delete(animation);
  animation.addEventListener('finish', forget);
  animation.addEventListener('cancel', forget);
  return animation;
}

// Registers a cleanup that must run if motion is settled early (reduced motion turned on,
// navigation). Returns the function to call when the cleanup is no longer needed.
export function trackCleanup(cleanup: () => void) {
  const run = () => {
    cleanups.delete(run);
    cleanup();
  };
  cleanups.add(run);
  return run;
}

// An inert copy of an element, left where the element was while it fades or moves away.
// It takes no events or focus and is hidden from assistive technology, so the real page
// is already in its final state underneath. Form state that lives in properties (checked,
// value) is copied too, so the copy looks exactly like what was on screen.
export function inertCopy(source: Element) {
  const copy = source.cloneNode(true) as HTMLElement;
  const from = source.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select, textarea');
  const to = copy.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select, textarea');
  from.forEach((field, index) => {
    const target = to[index];
    if (field instanceof HTMLInputElement && target instanceof HTMLInputElement) target.checked = field.checked;
    target.value = field.value;
  });
  for (const element of [copy, ...copy.querySelectorAll('[id]')]) element.removeAttribute('id');
  copy.setAttribute('aria-hidden', 'true');
  copy.inert = true;
  copy.style.pointerEvents = 'none';
  return copy;
}

// Where a positioned host's absolutely placed children start, in viewport coordinates.
// Read it once before placing several copies, so placing them doesn't force a layout
// for each one.
export function copyOrigin(host: HTMLElement) {
  const rect = host.getBoundingClientRect();
  return { left: rect.left + host.clientLeft, top: rect.top + host.clientTop };
}

// Places an inert copy at a viewport rectangle, inside a positioned host, and returns a
// remover that is safe to call more than once.
export function placeCopy(copy: HTMLElement, rect: DOMRect, host: HTMLElement, origin = copyOrigin(host)) {
  Object.assign(copy.style, {
    position: 'absolute',
    left: `${rect.left - origin.left}px`,
    top: `${rect.top - origin.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
  });
  host.append(copy);
  return trackCleanup(() => copy.remove());
}

// While a modal is open, or its panel is still leaving, results are published in their
// final layout, without moving cards behind it: the panel already says what changed.
let overlayLeavingUntil = 0;
export const markOverlayLeaving = (ms: number) => {
  overlayLeavingUntil = performance.now() + ms;
};
export const isOverlayLeaving = () =>
  performance.now() < overlayLeavingUntil || document.querySelector('dialog:modal') !== null;

// Height and opacity changes that can be interrupted (inline errors, disclosures, regions).
// A new change starts from the value on screen, even halfway through an earlier one. An
// exit that ends with fill 'forwards' stays applied until its element is removed, so the
// caller can take the element out without a frame of the old value in between.
type Tracked = 'height' | 'opacity';
const tracked = new WeakMap<Element, Partial<Record<Tracked, Animation>>>();

function retarget(element: HTMLElement, property: Tracked, from: number, to: number | undefined, timing: MotionOptions) {
  const entry = tracked.get(element) ?? {};
  tracked.set(element, entry);
  const running = entry[property];
  // Under reduced motion the final value applies at once; nothing needs measuring.
  if (prefersReducedMotion()) {
    running?.cancel();
    return undefined;
  }
  const read = () =>
    property === 'height' ? element.getBoundingClientRect().height : Number(getComputedStyle(element).opacity);
  const start = running ? read() : from;
  running?.cancel();
  const end = to ?? read();
  if (Math.abs(end - start) < 0.01) return undefined;
  const unit = property === 'height' ? 'px' : '';
  const animation = animate(element, [{ [property]: `${start}${unit}` }, { [property]: `${end}${unit}` }], timing);
  if (!animation) return undefined;
  if (property === 'height') element.style.overflow = 'clip';
  entry[property] = animation;
  const release = () => {
    if (entry[property] !== animation) return;
    delete entry[property];
    if (property === 'height') element.style.overflow = '';
  };
  animation.addEventListener('cancel', release);
  if (timing.fill !== 'forwards') animation.addEventListener('finish', release);
  return animation;
}

// `to` defaults to the element's natural height.
export const animateHeight = (element: HTMLElement, { from, to, ...timing }: { from: number; to?: number } & MotionOptions) =>
  retarget(element, 'height', from, to, timing);

export const animateOpacity = (element: HTMLElement, { from, to, ...timing }: { from: number; to: number } & MotionOptions) =>
  retarget(element, 'opacity', from, to, timing);

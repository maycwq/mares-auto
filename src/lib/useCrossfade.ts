import { useLayoutEffect, useRef } from 'react';
import { animate, duration as durations, easing, prefersReducedMotion, trackCleanup } from './motion';

// A number that changes in place (a result count, the gallery counter) swaps through a
// local crossfade: the old text fades out on top while the new one fades in, both in
// the same spot, with no counting through the values in between. The new text is in
// the DOM, and announced, from the commit; the old one is an aria-hidden layer. While
// they swap the element keeps the wider of the two widths, so nothing beside it moves
// twice. A new value during a swap replaces it at once.
//
// The element's content must be the text itself (React renders `text` as its only
// child).
export function useCrossfade<T extends HTMLElement>(
  text: string,
  { duration = durations.short, ease = easing.enter }: { duration?: number; ease?: string } = {},
) {
  const ref = useRef<T>(null);
  const shown = useRef(text);
  const settle = useRef<() => void>(undefined);

  useLayoutEffect(() => {
    const previous = shown.current;
    shown.current = text;
    const element = ref.current;
    // Text that wasn't there before simply appears.
    if (previous === text || !previous || !element) return;
    settle.current?.();
    if (prefersReducedMotion()) return;

    const style = getComputedStyle(element);
    const layer = document.createElement('span');
    layer.setAttribute('aria-hidden', 'true');
    layer.textContent = previous;
    const flex = style.display.includes('flex');
    Object.assign(layer.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      display: flex ? 'flex' : 'block',
      alignItems: style.alignItems,
      justifyContent: style.justifyContent,
      padding: style.padding,
      boxSizing: 'border-box',
      color: style.color,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
    });

    // The new width alone, then the old one through the layer at its natural size.
    const after = element.getBoundingClientRect().width;
    const restore = { position: element.style.position, display: element.style.display, minWidth: element.style.minWidth };
    if (style.position === 'static') element.style.position = 'relative';
    if (style.display === 'inline') element.style.display = 'inline-block';
    element.append(layer);
    const before = layer.getBoundingClientRect().width + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
    Object.assign(layer.style, { right: '0', bottom: '0' });
    element.style.minWidth = `${Math.max(after, before)}px`;

    const timing = { duration, easing: ease, fill: 'forwards' as const };
    const out = animate(layer, [{ opacity: 1 }, { opacity: 0 }], timing);
    const into = animate(element, [{ color: 'transparent' }, { color: style.color }], { duration, easing: ease });

    const done = trackCleanup(() => {
      layer.remove();
      Object.assign(element.style, restore);
      into?.cancel();
      settle.current = undefined;
    });
    settle.current = done;
    if (out) out.finished.then(done, done);
    else done();
  }, [text, duration, ease]);

  useLayoutEffect(() => () => settle.current?.(), []);

  return ref;
}

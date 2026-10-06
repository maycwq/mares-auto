import { useEffect, useLayoutEffect, useRef } from 'react';
import { animate, duration, easing, inertCopy, markOverlayLeaving, trackCleanup } from './motion';

// How a dialog arrives from its edge and leaves toward it. Opening animates the dialog
// itself; closing is immediate for the page (focus, inertness, scroll) and an inert copy
// of the panel finishes the movement on top of it.
export type DialogMotion = {
  enter: Keyframe;
  enterDuration: number;
  exit: Keyframe;
  exitDuration: number;
};

export const drawerMotion: DialogMotion = {
  enter: { transform: 'translateX(100%)' },
  enterDuration: duration.long,
  exit: { transform: 'translateX(100%)' },
  exitDuration: duration.medium,
};

export const sheetMotion: DialogMotion = {
  enter: { transform: 'translateY(100%)' },
  enterDuration: duration.long,
  exit: { transform: 'translateY(100%)' },
  exitDuration: duration.medium,
};

export const overlayMotion: DialogMotion = {
  enter: { transform: 'translateY(24px)', opacity: 0 },
  enterDuration: duration.medium,
  exit: { transform: 'translateY(16px)', opacity: 0 },
  exitDuration: duration.short,
};

// Drives a native <dialog> as a modal: focus stays inside, the page behind is inert,
// Escape closes it and focus goes back to whatever opened it, without moving the page.
export function useModalDialog(open: boolean, onClose: () => void, motion?: DialogMotion) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const leaving = useRef<() => void>(undefined);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      // Reopening drops what was still leaving: one surface at a time.
      leaving.current?.();
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      if (motion) {
        animate(dialog, [motion.enter, { transform: 'none', opacity: 1 }], {
          duration: motion.enterDuration,
          easing: easing.enter,
        });
      }
    }
    if (!open && dialog.open) {
      const exit = motion && leaveFrom(dialog, motion);
      const scrollY = window.scrollY;
      dialog.close();
      leaving.current = exit;
      opener.current?.focus({ preventScroll: true });
      if (window.scrollY !== scrollY) window.scrollTo(window.scrollX, scrollY);
    }
  }, [open, motion]);

  useEffect(() => () => leaving.current?.(), []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Escape fires "cancel"; the parent decides what closing means.
    const onCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener('cancel', onCancel);
    return () => dialog.removeEventListener('cancel', onCancel);
  }, [onClose]);

  return ref;
}

// The closing panel and its backdrop as inert copies on top of the page, from where they
// are on screen (halfway through opening, if that's the case) to the edge. They take no
// events, no focus and are hidden from assistive technology. Under reduced motion the
// panel goes at once and only the backdrop may fade, in 80 ms at most.
function leaveFrom(dialog: HTMLDialogElement, motion: DialogMotion) {
  const rect = dialog.getBoundingClientRect();
  const style = getComputedStyle(dialog);
  const backdropColor = getComputedStyle(dialog, '::backdrop').backgroundColor;
  markOverlayLeaving(motion.exitDuration);

  const backdrop = document.createElement('div');
  backdrop.setAttribute('aria-hidden', 'true');
  Object.assign(backdrop.style, { position: 'fixed', inset: '0', background: backdropColor, pointerEvents: 'none' });
  const panel = inertCopy(dialog);
  Object.assign(panel.style, {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    maxWidth: 'none',
    maxHeight: 'none',
    margin: '0',
    transform: style.transform,
    opacity: style.opacity,
  });
  for (const layer of [backdrop, panel]) Object.assign(layer.style, { zIndex: '2147483000' });

  document.body.append(backdrop, panel);
  const remove = trackCleanup(() => {
    backdrop.remove();
    panel.remove();
  });

  const panelOut = animate(panel, [{ transform: style.transform, opacity: style.opacity }, motion.exit], {
    duration: motion.exitDuration,
    easing: easing.exit,
    fill: 'forwards',
  });
  const backdropOut = animate(backdrop, [{ opacity: 1 }, { opacity: 0 }], {
    duration: duration.short,
    easing: easing.exit,
    fill: 'forwards',
    reducedFade: true,
  });
  if (!panelOut) panel.remove();
  if (!backdropOut) backdrop.remove();
  if (!panelOut && !backdropOut) {
    remove();
    return undefined;
  }
  Promise.all([panelOut?.finished, backdropOut?.finished]).then(remove, remove);
  return remove;
}

import { useEffect, useId, useLayoutEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './InfoTip.module.css';

type InfoTipProps = {
  // Name of the button, e.g. "O que é a Tabela FIPE?"
  label: string;
  children: ReactNode;
};

// A short explanation behind an info button (a "toggletip"). It opens on click, tap,
// Enter or Space, never on hover alone, and is announced when it opens. Escape, a click
// elsewhere or moving focus away closes it. The visual system has no tooltip, so this
// only uses its tokens and Icon / Info.
export function InfoTip({ label, children }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const bubbleId = useId();

  // The bubble starts at the button; near the right edge of the screen it moves left
  // just enough to stay inside the page margin.
  useLayoutEffect(() => {
    const element = bubble.current;
    if (!open || !element) return;
    const margin = parseFloat(getComputedStyle(element).getPropertyValue('--grid-margin')) || 16;
    const overflow = element.getBoundingClientRect().right - (document.documentElement.clientWidth - margin);
    element.style.translate = overflow > 0 ? `${-overflow}px 0` : '';
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const closeOnBlur = (event: FocusEvent) => {
    if (!root.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
  };

  return (
    <span ref={root} className={styles.infoTip} onBlur={closeOnBlur}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={label}
        aria-expanded={open}
        aria-controls={bubbleId}
        onClick={() => setOpen(!open)}
      >
        <Icon name="info" mode="muted" />
      </button>
      <span id={bubbleId} role="status">
        {open && (
          <span ref={bubble} className={styles.bubble}>
            {children}
          </span>
        )}
      </span>
    </span>
  );
}

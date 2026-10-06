import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { cx } from '../../lib/cx';
import { animateHeight, animateOpacity, duration, easing } from '../../lib/motion';
import { Icon } from '../Icon/Icon';
import styles from './Disclosure.module.css';

type DisclosureProps = {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
};

// Accordion / Disclosure. The header is a button inside a heading that says whether the
// body is open; a closed body is hidden from reading too, not only from view.
//
// Motion: opening grows the body to its measured height (240 ms) while the text fades in
// (160 ms, 40 ms later); closing fades the text (80 ms) and shrinks the body (160 ms).
// aria-expanded changes on the gesture. A closing body is inert, and hidden once it is
// closed. Toggling halfway starts from the height on screen; nothing queues.
export function Disclosure({ title, children, defaultExpanded = false }: DisclosureProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [closing, setClosing] = useState(false);
  const header = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const toggled = useRef(false);
  const current = useRef(expanded);
  const bodyId = useId();

  const toggle = () => {
    // Focus inside a closing body would end up nowhere; it goes back to the header.
    if (expanded && panel.current?.contains(document.activeElement)) header.current?.focus();
    toggled.current = true;
    setExpanded(!expanded);
    setClosing(expanded);
  };

  useLayoutEffect(() => {
    current.current = expanded;
    const element = panel.current;
    if (!toggled.current || !element) return;
    toggled.current = false;
    const body = element.firstElementChild as HTMLElement;
    // The panel tucks 4px into the header's padding, so "closed" is that overlap: the
    // item's height then moves continuously from the closed header.
    const closed = -parseFloat(getComputedStyle(element).marginTop) || 0;
    if (expanded) {
      animateHeight(element, { from: closed, duration: duration.medium, easing: easing.layout });
      animateOpacity(body, { from: 0, to: 1, duration: duration.short, delay: 40, easing: easing.enter, fill: 'backwards' });
      return;
    }
    animateOpacity(body, { from: 1, to: 0, duration: duration.micro, easing: easing.exit, fill: 'forwards' });
    const shrinking = animateHeight(element, {
      from: element.getBoundingClientRect().height,
      to: closed,
      duration: duration.short,
      easing: easing.layout,
      fill: 'forwards',
    });
    const hide = () => {
      if (!current.current) flushSync(() => setClosing(false));
    };
    if (shrinking) shrinking.addEventListener('finish', hide);
    else setClosing(false);
  }, [expanded]);

  return (
    <div className={cx(styles.disclosure, expanded && styles.expanded)}>
      <h3 className={styles.heading}>
        <button
          ref={header}
          type="button"
          className={styles.header}
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={toggle}
        >
          <span className={styles.title}>{title}</span>
          <Icon name="chevron-down" className={styles.chevron} />
        </button>
      </h3>
      <div ref={panel} id={bodyId} className={styles.panel} hidden={!expanded && !closing} inert={closing}>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

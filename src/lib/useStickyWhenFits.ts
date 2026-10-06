import { useEffect, type RefObject } from 'react';

// Keeps an element in view while the page scrolls (position: sticky, set in CSS on
// [data-sticky]) only while it fits: its height plus `margin` above and below must not
// exceed the visible height. A shorter window, a larger font or browser zoom turn it
// off. It reacts to size changes only; nothing runs while scrolling.
export function useStickyWhenFits(element: RefObject<HTMLElement | null>, margin: number) {
  useEffect(() => {
    const target = element.current;
    if (!target) return;
    const update = () => {
      const visible = window.visualViewport?.height ?? window.innerHeight;
      target.toggleAttribute('data-sticky', target.offsetHeight > 0 && target.offsetHeight <= visible - 2 * margin);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(target);
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, [element, margin]);
}

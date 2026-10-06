import { useLayoutEffect, useRef, type RefObject } from 'react';
import { animate, duration, easing } from './motion';
import { useRouter } from './router';

// Content that tells which page this is (a vehicle's identification, the next-step
// options) settles in once, 8px and 240 ms, when the page was reached by an in-app push.
// Back/forward, a reload or a link opened directly show the page as it is. Everything
// selected moves together: there is no stagger.
export function useArrival(container: RefObject<HTMLElement | null>, selector: string) {
  const { navigation } = useRouter();
  const arrivedBy = useRef(navigation);

  useLayoutEffect(() => {
    if (arrivedBy.current !== 'push') return;
    for (const element of container.current?.querySelectorAll(selector) ?? []) {
      animate(element, [{ transform: 'translateY(8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], {
        duration: duration.medium,
        easing: easing.enter,
      });
    }
  }, [container, selector]);
}

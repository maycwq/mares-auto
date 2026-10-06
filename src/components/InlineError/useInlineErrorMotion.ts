import { useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { animateHeight, animateOpacity, duration, easing } from '../../lib/motion';

// An inline error opens its space (160 ms) and its text follows (80 ms, 40 ms later); an
// error that goes away leaves the other way. Validity, aria and focus change at once: the
// caller renders `shown` inside the element `slot` points at (its only child, which holds
// any spacing above the message, fades), hidden from reading while `message` is empty,
// and the text lingers only until its space has closed. The same
// message again replays nothing, and a change halfway starts from what is on screen.
// Without `canLeave` the message goes at once (something else takes its place).
export function useInlineErrorMotion(message: string | undefined, canLeave = true) {
  const slot = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(message);
  const current = useRef(message);
  const seen = useRef(message);
  if (message && message !== shown) setShown(message);
  if (!message && shown && !canLeave) setShown(undefined);

  useLayoutEffect(() => {
    current.current = message;
    const before = seen.current;
    seen.current = message;
    const element = slot.current;
    if (Boolean(before) === Boolean(message) || !element) return;
    const text = element.firstElementChild as HTMLElement;
    if (message) {
      animateHeight(element, { from: 0, duration: duration.short, easing: easing.layout });
      animateOpacity(text, { from: 0, to: 1, duration: duration.micro, delay: 40, easing: easing.enter, fill: 'backwards' });
      return;
    }
    animateOpacity(text, { from: 1, to: 0, duration: duration.micro, easing: easing.exit, fill: 'forwards' });
    const leaving = animateHeight(element, {
      from: element.getBoundingClientRect().height,
      to: 0,
      duration: duration.short,
      easing: easing.layout,
      fill: 'forwards',
    });
    // The space is closed when the text goes, without a frame of it at full height.
    const remove = () => {
      if (!current.current) flushSync(() => setShown(undefined));
    };
    if (leaving) leaving.addEventListener('finish', remove);
    else setShown(undefined);
  }, [message]);

  return { slot, shown };
}

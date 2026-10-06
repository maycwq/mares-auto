import { useLayoutEffect, useRef, useState } from 'react';
import { cx } from '../../lib/cx';
import { animate, duration, easing, prefersReducedMotion, trackCleanup } from '../../lib/motion';
import styles from './VehicleImage.module.css';

// How the frame goes from one photo to the next: a crossfade, or a slide one frame-width
// to either side for the photo right next to it. Never more than two photos at once.
export type PhotoChange = 'crossfade' | 'next' | 'prev';

type VehicleImageProps = {
  src?: string;
  alt: string;
  aspect: 'card' | 'gallery';
  // The main photo of a vehicle page is above the fold and shouldn't wait.
  loading?: 'lazy' | 'eager';
  // Only the gallery changes the photo of a mounted frame; it says how.
  change?: PhotoChange;
  className?: string;
};

// Vehicle / Image. Without a photo, or when it fails to load, it switches to the Missing
// state instead of letting the browser show a broken image; that state doesn't pulse. A
// photo that was already loaded shows at once; one that's still arriving fades in.
export function VehicleImage({ src, alt, aspect, loading = 'lazy', change = 'crossfade', className }: VehicleImageProps) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const missing = !src || failedSrc === src;
  const frame = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const painted = useRef<string | undefined>(undefined);

  useLayoutEffect(() => {
    const element = photo.current;
    const box = frame.current;
    const previous = painted.current;
    painted.current = missing ? undefined : src;
    if (!element || !box || missing || previous === src) return;

    if (previous === undefined) {
      // First photo in this frame. Ready already: nothing to show. Still loading: it
      // fades in once decoded, instead of drawing itself in line by line.
      if (element.complete && element.naturalWidth > 0) return;
      element.style.opacity = '0';
      const reveal = () => {
        element.style.opacity = '';
        animate(element, [{ opacity: 0 }, { opacity: 1 }], { duration: duration.short, easing: easing.enter, reducedFade: true });
      };
      const fail = () => {
        element.style.opacity = '';
      };
      element.addEventListener('load', reveal, { once: true });
      element.addEventListener('error', fail, { once: true });
      return () => {
        element.removeEventListener('load', reveal);
        element.removeEventListener('error', fail);
        element.style.opacity = '';
      };
    }

    // A new photo in the same frame (the gallery only asks once it's decoded): an inert
    // copy of the previous one leaves while the new one takes its place.
    const copy = document.createElement('img');
    copy.src = previous;
    copy.alt = '';
    copy.className = cx(styles.photo, styles.layer);
    copy.setAttribute('aria-hidden', 'true');
    box.append(copy);
    const remove = trackCleanup(() => copy.remove());
    const slide = change !== 'crossfade' && !prefersReducedMotion();
    const direction = change === 'prev' ? -1 : 1;
    const animations = slide
      ? [
          animate(copy, [{ transform: 'translateX(0)' }, { transform: `translateX(${-100 * direction}%)` }], {
            duration: duration.medium,
            easing: easing.layout,
          }),
          animate(element, [{ transform: `translateX(${100 * direction}%)` }, { transform: 'translateX(0)' }], {
            duration: duration.medium,
            easing: easing.layout,
          }),
        ]
      : [animate(copy, [{ opacity: 1 }, { opacity: 0 }], { duration: duration.short, easing: easing.enter, reducedFade: true })];
    const running = animations.filter((animation) => animation !== undefined);
    if (running.length) Promise.allSettled(running.map((animation) => animation.finished)).then(remove);
    else remove();
    return () => {
      for (const animation of running) animation.cancel();
      remove();
    };
  }, [src, missing, change]);

  return (
    <div ref={frame} className={cx(styles.image, styles[aspect], missing && styles.missing, className)}>
      {missing ? (
        'foto indisponível'
      ) : (
        <img
          ref={photo}
          src={src}
          alt={alt}
          className={styles.photo}
          loading={loading}
          decoding="async"
          onError={() => setFailedSrc(src)}
        />
      )}
    </div>
  );
}

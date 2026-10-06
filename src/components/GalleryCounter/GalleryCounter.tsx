import { cx } from '../../lib/cx';
import { duration, easing } from '../../lib/motion';
import { useCrossfade } from '../../lib/useCrossfade';
import styles from './GalleryCounter.module.css';

type GalleryCounterProps = { current: number; total: number; className?: string };

// Gallery / Counter. "1 / 12" is read out as "imagem 1 de 12". It follows the photo on
// screen, swapping in 80 ms.
export function GalleryCounter({ current, total, className }: GalleryCounterProps) {
  const visible = `${current} / ${total}`;
  const swap = useCrossfade<HTMLSpanElement>(visible, { duration: duration.micro, ease: easing.linear });
  return (
    <p className={cx(styles.counter, className)}>
      <span ref={swap} aria-hidden="true">
        {visible}
      </span>
      <span className="visually-hidden">
        imagem {current} de {total}
      </span>
    </p>
  );
}

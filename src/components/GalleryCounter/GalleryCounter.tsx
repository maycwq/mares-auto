import { cx } from '../../lib/cx';
import styles from './GalleryCounter.module.css';

type GalleryCounterProps = { current: number; total: number; className?: string };

// Gallery / Counter. "1 / 12" is read out as "imagem 1 de 12".
export function GalleryCounter({ current, total, className }: GalleryCounterProps) {
  return (
    <p className={cx(styles.counter, className)}>
      <span aria-hidden="true">
        {current} / {total}
      </span>
      <span className="visually-hidden">
        imagem {current} de {total}
      </span>
    </p>
  );
}

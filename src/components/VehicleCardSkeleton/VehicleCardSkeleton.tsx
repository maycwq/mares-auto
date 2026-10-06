import { cx } from '../../lib/cx';
import styles from './VehicleCardSkeleton.module.css';

// Vehicle / Card Skeleton. Purely visual: the loading state is announced by the list
// that shows it, and nothing here can take focus.
export function VehicleCardSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={cx(styles.block, styles.image)} />
      <div className={styles.content}>
        <div className={styles.block} style={{ width: 250, height: 22 }} />
        <div className={styles.block} style={{ width: 190, height: 16 }} />
        <div className={styles.row}>
          <div className={styles.block} style={{ width: 72, height: 34 }} />
          <div className={styles.block} style={{ width: 88, height: 34 }} />
          <div className={styles.block} style={{ width: 96, height: 34 }} />
        </div>
        <div className={styles.block} style={{ width: 160, height: 28 }} />
      </div>
    </div>
  );
}

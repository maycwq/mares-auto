import { Icon } from '../Icon/Icon';
import styles from './FilterChip.module.css';

// Filter / Chip in its Selected state. It only summarizes an applied filter: removing or
// toggling from the chip is not specified, so it isn't interactive.
export function FilterChip({ label }: { label: string }) {
  return (
    <span className={styles.chip}>
      <Icon name="check" />
      {label}
    </span>
  );
}

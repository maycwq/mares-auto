import { cx } from '../../lib/cx';
import styles from './StatusBadge.module.css';

type StatusBadgeProps = {
  label: string;
  tone?: 'neutral' | 'success' | 'warning';
  className?: string;
};

// Status / Badge. The label carries the meaning; the tone only reinforces it.
export function StatusBadge({ label, tone = 'neutral', className }: StatusBadgeProps) {
  return <span className={cx(styles.badge, styles[tone], className)}>{label}</span>;
}

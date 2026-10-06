import { cx } from '../../lib/cx';
import styles from './VehicleAttribute.module.css';

type VehicleAttributeProps = {
  label: string;
  value: string;
  layout?: 'stacked' | 'inline';
};

// Vehicle / Attribute, as a term/description pair. Use it inside a <dl>.
export function VehicleAttribute({ label, value, layout = 'stacked' }: VehicleAttributeProps) {
  return (
    <div className={cx(styles.attribute, layout === 'inline' && styles.inline)}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value}</dd>
    </div>
  );
}

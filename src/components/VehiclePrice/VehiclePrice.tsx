import { cx } from '../../lib/cx';
import { formatPrice } from '../../lib/format';
import styles from './VehiclePrice.module.css';

type VehiclePriceProps = {
  price: number;
  // FIPE value; the reference line only exists when there is one.
  reference?: number;
  context?: 'card' | 'detail';
};

// Vehicle / Price. Previous price and financing condition exist in the component but no
// screen uses them, so they aren't here yet.
export function VehiclePrice({ price, reference, context = 'card' }: VehiclePriceProps) {
  return (
    <div className={cx(styles.price, context === 'detail' && styles.detail)}>
      <p className={styles.value}>{formatPrice(price)}</p>
      {reference !== undefined && <p className={styles.reference}>FIPE · {formatPrice(reference)}</p>}
    </div>
  );
}

import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { formatPrice } from '../../lib/format';
import styles from './VehiclePrice.module.css';

type VehiclePriceProps = {
  price: number;
  // The reference line ("Tabela FIPE · R$ 151.200"), only when there is a reference
  // value. Its wording depends on where the price is shown, so the caller writes it.
  reference?: ReactNode;
  context?: 'card' | 'detail';
};

// Vehicle / Price. Previous price and financing condition exist in the component but no
// screen uses them, so they aren't here yet.
export function VehiclePrice({ price, reference, context = 'card' }: VehiclePriceProps) {
  return (
    <div className={cx(styles.price, context === 'detail' && styles.detail)}>
      <p className={styles.value}>{formatPrice(price)}</p>
      {reference && <p className={styles.reference}>{reference}</p>}
    </div>
  );
}

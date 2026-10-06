import { cx } from '../../lib/cx';
import { Icon } from '../Icon/Icon';
import styles from './TrustItem.module.css';

type TrustItemProps = {
  title: string;
  detail?: string;
  emphasis?: 'default' | 'highlighted';
  className?: string;
};

// Vehicle / Trust Item. The title and detail say what was verified; the green of the
// highlighted version only reinforces it.
export function TrustItem({ title, detail, emphasis = 'default', className }: TrustItemProps) {
  return (
    <div className={cx(styles.item, emphasis === 'highlighted' && styles.highlighted, className)}>
      <Icon name="check" />
      <div className={styles.copy}>
        <p className={styles.title}>{title}</p>
        {detail && <p className={styles.detail}>{detail}</p>}
      </div>
    </div>
  );
}

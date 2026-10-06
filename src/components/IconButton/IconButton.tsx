import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './IconButton.module.css';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: IconName;
  // The icon alone is not a name; every icon button needs one.
  label: string;
};

export function IconButton({ icon, label, className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} className={cx(styles.iconButton, className)} {...props}>
      <Icon name={icon} />
    </button>
  );
}

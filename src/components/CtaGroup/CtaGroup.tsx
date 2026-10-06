import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './CtaGroup.module.css';

type CtaGroupProps = {
  layout?: 'row' | 'stack';
  children: ReactNode;
  className?: string;
};

// CTA / Group: a primary action and the ones next to it. Stacked, each action takes the
// full width.
export function CtaGroup({ layout = 'row', children, className }: CtaGroupProps) {
  return <div className={cx(styles.group, styles[layout], className)}>{children}</div>;
}

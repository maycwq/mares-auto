import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

// Shared with controls that must look like a Button without being a <button>
// (the mobile sort select).
export const buttonClassName = (variant: Variant = 'primary', size: Size = 'md', className?: string) =>
  cx(styles.button, styles[variant], size === 'lg' && styles.lg, className);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName(variant, size, className)} {...props} />;
}

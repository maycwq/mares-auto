import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import styles from './TextLink.module.css';

// Text Link renders as a link when it navigates and as a button when it acts in place
// ("Limpar"). Same look either way.
type TextLinkProps =
  | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string })
  | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined });

export function TextLink({ className, ...props }: TextLinkProps) {
  if (props.href !== undefined) {
    return <a className={cx(styles.textLink, className)} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)} />;
  }
  const { type = 'button', ...buttonProps } = props as ButtonHTMLAttributes<HTMLButtonElement>;
  return <button type={type} className={cx(styles.textLink, className)} {...buttonProps} />;
}

import { Icon } from '../Icon/Icon';
import styles from './InlineError.module.css';

type InlineErrorProps = { id?: string; message: string };

// Feedback / Inline Error: what to fix, in words. The icon and the color only reinforce it.
export function InlineError({ id, message }: InlineErrorProps) {
  return (
    <p id={id} className={styles.inlineError}>
      <Icon name="info" />
      <span>{message}</span>
    </p>
  );
}

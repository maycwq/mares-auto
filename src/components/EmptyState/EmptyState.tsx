import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

type EmptyStateProps = {
  title: string;
  body: string;
  // Recovery action, a Button.
  action?: ReactNode;
};

// Feedback / Empty State
export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.body}>{body}</p>
      {action}
    </div>
  );
}

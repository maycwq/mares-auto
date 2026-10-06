import { useId, useState, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { Icon } from '../Icon/Icon';
import styles from './Disclosure.module.css';

type DisclosureProps = {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
};

// Accordion / Disclosure. The header is a button inside a heading that says whether the
// body is open; a closed body is hidden from reading too, not only from view.
export function Disclosure({ title, children, defaultExpanded = false }: DisclosureProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const bodyId = useId();

  return (
    <div className={cx(styles.disclosure, expanded && styles.expanded)}>
      <h3 className={styles.heading}>
        <button
          type="button"
          className={styles.header}
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => setExpanded(!expanded)}
        >
          <span className={styles.title}>{title}</span>
          <Icon name="chevron-down" className={styles.chevron} />
        </button>
      </h3>
      <div id={bodyId} className={styles.body} hidden={!expanded}>
        {children}
      </div>
    </div>
  );
}

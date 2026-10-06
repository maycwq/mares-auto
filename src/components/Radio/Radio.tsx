import { useId, type InputHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import styles from './Radio.module.css';

type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  // Supporting text. It becomes the option's description, read after its name.
  description?: string;
  className?: string;
};

// Radio. A native radio input, so radios sharing a name form a real group: Tab enters it,
// arrow keys move and select, Space selects. The input covers the whole label, so the
// whole option (description included) is the target.
export function Radio({ label, description, className, ...input }: RadioProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  return (
    <label className={cx(styles.radio, className)}>
      <span className={styles.row}>
        <input
          type="radio"
          className={styles.input}
          aria-labelledby={labelId}
          aria-describedby={description ? descriptionId : undefined}
          {...input}
        />
        <span className={styles.indicator} aria-hidden="true" />
        <span id={labelId} className={styles.label}>
          {label}
        </span>
      </span>
      {description && (
        <span id={descriptionId} className={styles.description}>
          {description}
        </span>
      )}
    </label>
  );
}

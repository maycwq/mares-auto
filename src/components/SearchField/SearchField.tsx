import { useRef } from 'react';
import { cx } from '../../lib/cx';
import { Icon } from '../Icon/Icon';
import styles from './SearchField.module.css';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  // Enter and the clear button ask for results right away, without waiting for typing
  // to settle.
  onSubmit?: (value: string) => void;
  onClear?: () => void;
  // Accessible name; the placeholder only helps visually.
  label: string;
  placeholder: string;
  clearLabel: string;
  className?: string;
};

// Input / Search. The clear action shows up once there is a query.
export function SearchField({ value, onChange, onSubmit, onClear, label, placeholder, clearLabel, className }: SearchFieldProps) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className={cx(styles.field, className)}>
      <Icon name="search" />
      <input
        ref={input}
        type="search"
        className={styles.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit?.(event.currentTarget.value);
        }}
        aria-label={label}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          aria-label={clearLabel}
          onClick={() => {
            if (onClear) onClear();
            else onChange('');
            input.current?.focus();
          }}
        >
          <Icon name="close" />
        </button>
      )}
    </div>
  );
}

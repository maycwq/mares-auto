import { cx } from '../../lib/cx';
import { Icon } from '../Icon/Icon';
import styles from './Select.module.css';

export type SelectOption = { value: string; label: string };

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  // Accessible name. The visible text inside the control is not enough.
  label: string;
  // Shown while nothing is chosen; picking it again clears the selection. Without one,
  // the select always holds one of the options (sorting).
  placeholder?: string;
  className?: string;
};

// Input / Select. The design only has the trigger, so the menu is the native one:
// keyboard, screen readers and mobile pickers come with it.
export function Select({ value, onChange, options, label, placeholder, className }: SelectProps) {
  return (
    <div className={cx(styles.select, className)}>
      <select
        className={cx(styles.control, placeholder !== undefined && value === '' && styles.empty)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon name="chevron-down" className={styles.chevron} />
    </div>
  );
}

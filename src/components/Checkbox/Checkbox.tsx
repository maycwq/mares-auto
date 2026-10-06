import { Icon } from '../Icon/Icon';
import styles from './Checkbox.module.css';

type CheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <label className={styles.checkbox}>
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.indicator}>
        <Icon name="check" className={styles.check} />
      </span>
      {label}
    </label>
  );
}

import { useId, type InputHTMLAttributes, type Ref } from 'react';
import { cx } from '../../lib/cx';
import { InlineError } from '../InlineError/InlineError';
import { useInlineErrorMotion } from '../InlineError/useInlineErrorMotion';
import styles from './InputText.module.css';

type InputTextProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  // Supporting text under the field. An error takes its place while there is one.
  hint?: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
};

// Input / Text. The label stays visible above the field; placeholder and formatting only
// help. An error shows as Feedback / Inline Error, marks the input invalid and is tied to
// it, so the red border is never the only signal. Without an error the field is back to
// its normal states; nothing of the error stays behind once its message has left.
export function InputText({ label, hint, error, className, ref, ...input }: InputTextProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const describedBy = error || hint ? messageId : undefined;
  const { slot, shown } = useInlineErrorMotion(error, !hint);

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        className={cx(styles.input, error && styles.invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...input}
      />
      {shown ? (
        // While it leaves, the message is already gone for assistive technology.
        <div ref={slot} aria-hidden={error ? undefined : true}>
          <div className={styles.message}>
            <InlineError id={error ? messageId : undefined} message={shown} />
          </div>
        </div>
      ) : (
        hint && (
          <p id={messageId} className={cx(styles.message, styles.hint)}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

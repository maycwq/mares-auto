// Joins class names, skipping the falsy ones: cx(styles.a, isOn && styles.on).
export function cx(...names: (string | false | null | undefined)[]) {
  return names.filter(Boolean).join(' ');
}

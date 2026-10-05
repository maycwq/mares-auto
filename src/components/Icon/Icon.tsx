import ArrowRight from '../../assets/icons/arrow-right.svg?react';
import Check from '../../assets/icons/check.svg?react';
import ChevronDown from '../../assets/icons/chevron-down.svg?react';
import ChevronLeft from '../../assets/icons/chevron-left.svg?react';
import ChevronRight from '../../assets/icons/chevron-right.svg?react';
import Close from '../../assets/icons/close.svg?react';
import Heart from '../../assets/icons/heart.svg?react';
import Info from '../../assets/icons/info.svg?react';
import Search from '../../assets/icons/search.svg?react';
import styles from './Icon.module.css';

const icons = {
  'arrow-right': ArrowRight,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  close: Close,
  heart: Heart,
  info: Info,
  search: Search,
};

export type IconName = keyof typeof icons;

type IconProps = {
  name: IconName;
  // Mode of the color/icon variable. Left out, the icon inherits the mode of its context,
  // like an instance without an explicit mode in Figma.
  mode?: 'default' | 'inverse' | 'muted';
  className?: string;
};

// Icons are always decorative here; the control that holds them carries the name.
export function Icon({ name, mode, className }: IconProps) {
  const Svg = icons[name];
  return (
    <Svg
      aria-hidden="true"
      focusable="false"
      data-icon-mode={mode}
      className={className ? `${styles.icon} ${className}` : styles.icon}
    />
  );
}

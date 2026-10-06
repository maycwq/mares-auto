import { useState, type ButtonHTMLAttributes, type Ref } from 'react';
import { cx } from '../../lib/cx';
import styles from './GalleryThumbnail.module.css';

type GalleryThumbnailProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  src?: string;
  // What the thumbnail opens, e.g. "Imagem 2 de 5". The photo itself is decorative.
  label: string;
  selected: boolean;
  ref?: Ref<HTMLButtonElement>;
};

// Gallery / Thumbnail. The gallery decides the semantics (it renders these as tabs);
// this only draws the media and the selected state.
export function GalleryThumbnail({ src, label, selected, className, ref, ...props }: GalleryThumbnailProps) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const missing = !src || failedSrc === src;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cx(styles.thumbnail, selected && styles.selected, missing && styles.missing, className)}
      {...props}
    >
      {missing ? (
        <span aria-hidden="true">sem foto</span>
      ) : (
        <img src={src} alt="" className={styles.photo} loading="lazy" decoding="async" onError={() => setFailedSrc(src)} />
      )}
    </button>
  );
}

import { useState } from 'react';
import { cx } from '../../lib/cx';
import styles from './VehicleImage.module.css';

type VehicleImageProps = {
  src?: string;
  alt: string;
  aspect: 'card' | 'gallery';
  className?: string;
};

// Vehicle / Image. Without a photo, or when it fails to load, it switches to the Missing
// state instead of letting the browser show a broken image.
export function VehicleImage({ src, alt, aspect, className }: VehicleImageProps) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const missing = !src || failedSrc === src;

  return (
    <div className={cx(styles.image, styles[aspect], missing && styles.missing, className)}>
      {missing ? (
        'foto indisponível'
      ) : (
        <img
          src={src}
          alt={alt}
          className={styles.photo}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src)}
        />
      )}
    </div>
  );
}

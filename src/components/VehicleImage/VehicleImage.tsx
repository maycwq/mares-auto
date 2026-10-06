import { useState } from 'react';
import { cx } from '../../lib/cx';
import styles from './VehicleImage.module.css';

type VehicleImageProps = {
  src?: string;
  alt: string;
  aspect: 'card' | 'gallery';
  // The main photo of a vehicle page is above the fold and shouldn't wait.
  loading?: 'lazy' | 'eager';
  className?: string;
};

// Vehicle / Image. Without a photo, or when it fails to load, it switches to the Missing
// state instead of letting the browser show a broken image.
export function VehicleImage({ src, alt, aspect, loading = 'lazy', className }: VehicleImageProps) {
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
          loading={loading}
          decoding="async"
          onError={() => setFailedSrc(src)}
        />
      )}
    </div>
  );
}

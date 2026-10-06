import { useId } from 'react';
import { GalleryCounter } from '../components/GalleryCounter/GalleryCounter';
import { IconButton } from '../components/IconButton/IconButton';
import { VehicleImage } from '../components/VehicleImage/VehicleImage';
import type { MediaItem } from '../data/vehicles';
import { useModalDialog } from '../lib/useModalDialog';
import styles from './Gallery.module.css';

type GalleryOverlayProps = {
  open: boolean;
  title: string;
  media: MediaItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

// V3 · galeria mobile. Opens on the photo that was selected and moves the same index, so
// closing it leaves the page on whatever photo the person ended on.
export function GalleryOverlay({ open, title, media, index, onIndexChange, onClose }: GalleryOverlayProps) {
  const ref = useModalDialog(open, onClose);
  const titleId = useId();
  const total = media.length;
  const first = index === 0;
  const last = index === total - 1;

  return (
    <dialog ref={ref} className={styles.overlay} aria-labelledby={titleId}>
      <div className={styles.overlayHeader}>
        <h2 id={titleId} className={styles.overlayTitle}>
          {title}
        </h2>
        <IconButton icon="close" label="Fechar galeria" onClick={onClose} />
      </div>
      <div className={styles.overlayBody}>
        <VehicleImage src={media[index]?.src} alt={title} aspect="card" loading="eager" />
        <GalleryCounter current={index + 1} total={total} />
        <div className={styles.overlayNav}>
          {/* At the ends the buttons stay focusable but do nothing, so focus isn't lost. */}
          <IconButton
            icon="chevron-left"
            label="Imagem anterior"
            aria-disabled={first}
            onClick={() => !first && onIndexChange(index - 1)}
          />
          <p className={styles.progress} aria-live="polite">
            imagem {index + 1} de {total}
          </p>
          <IconButton
            icon="chevron-right"
            label="Próxima imagem"
            aria-disabled={last}
            onClick={() => !last && onIndexChange(index + 1)}
          />
        </div>
      </div>
    </dialog>
  );
}

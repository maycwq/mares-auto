import { useId } from 'react';
import { GalleryCounter } from '../components/GalleryCounter/GalleryCounter';
import { IconButton } from '../components/IconButton/IconButton';
import { VehicleImage } from '../components/VehicleImage/VehicleImage';
import type { MediaItem } from '../data/vehicles';
import { overlayMotion, useModalDialog } from '../lib/useModalDialog';
import type { useGalleryIndex } from './useGalleryIndex';
import styles from './Gallery.module.css';

type GalleryOverlayProps = {
  open: boolean;
  title: string;
  media: MediaItem[];
  gallery: ReturnType<typeof useGalleryIndex>;
  onClose: () => void;
};

// V3 · galeria mobile. Opens on the photo that was selected and moves the same index, so
// closing it leaves the page on whatever photo the person ended on.
export function GalleryOverlay({ open, title, media, gallery, onClose }: GalleryOverlayProps) {
  const ref = useModalDialog(open, onClose, overlayMotion);
  const titleId = useId();
  const { requested, shown, status } = gallery;
  const total = media.length;
  const first = requested === 0;
  const last = requested === total - 1;

  return (
    <dialog ref={ref} className={styles.overlay} aria-labelledby={titleId}>
      <div className={styles.overlayHeader}>
        <h2 id={titleId} className={styles.overlayTitle}>
          {title}
        </h2>
        <IconButton icon="close" label="Fechar galeria" onClick={onClose} />
      </div>
      <div className={styles.overlayBody}>
        <VehicleImage src={media[shown.index]?.src} change={shown.change} alt={title} aspect="card" loading="eager" />
        <div className={styles.status}>
          <GalleryCounter current={shown.index + 1} total={total} />
          <p className={styles.photoStatus} role="status">
            {status === 'loading' ? 'carregando foto' : status === 'unavailable' ? 'foto indisponível' : ''}
          </p>
        </div>
        <div className={styles.overlayNav}>
          {/* At the ends the buttons stay focusable but do nothing, so focus isn't lost. */}
          <IconButton
            icon="chevron-left"
            label="Imagem anterior"
            aria-disabled={first}
            onClick={() => !first && gallery.request(requested - 1, true)}
          />
          {/* Announces the photo actually on screen, never a request that was replaced. */}
          <p className={styles.progress} aria-live="polite">
            imagem {shown.index + 1} de {total}
          </p>
          <IconButton
            icon="chevron-right"
            label="Próxima imagem"
            aria-disabled={last}
            onClick={() => !last && gallery.request(requested + 1, true)}
          />
        </div>
      </div>
    </dialog>
  );
}

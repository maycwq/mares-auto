import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useGalleryIndex } from './useGalleryIndex';
import { GalleryCounter } from '../components/GalleryCounter/GalleryCounter';
import { GalleryThumbnail } from '../components/GalleryThumbnail/GalleryThumbnail';
import { VehicleImage } from '../components/VehicleImage/VehicleImage';
import type { Vehicle } from '../data/vehicles';
import { useMediaQuery } from '../lib/useMediaQuery';
import { vehicleTitle } from '../lib/vehicleText';
import { GalleryOverlay } from './GalleryOverlay';
import styles from './Gallery.module.css';

// Main image, thumbnails, counter and the mobile overlay all read one media list and one
// index (requested vs shown, see useGalleryIndex). Thumbnails are tabs: arrow keys move
// between them, the selected one is announced.
export function Gallery({ vehicle }: { vehicle: Vehicle }) {
  const wide = useMediaQuery('(min-width: 1024px)');
  const gallery = useGalleryIndex(vehicle.media);
  const { requested, shown, status } = gallery;
  const [overlayOpen, setOverlayOpen] = useState(false);
  const thumbnails = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  const media = vehicle.media;
  const total = media.length;
  const title = vehicleTitle(vehicle);
  const tabId = (position: number) => `${id}-tab-${position}`;
  const panelId = `${id}-panel`;

  const selectFromKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    const targets: Record<string, number> = { ArrowRight: requested + 1, ArrowLeft: requested - 1, Home: 0, End: total - 1 };
    if (!(event.key in targets)) return;
    event.preventDefault();
    const next = Math.min(Math.max(targets[event.key], 0), total - 1);
    gallery.request(next, event.key === 'ArrowRight' || event.key === 'ArrowLeft');
    // Focus moves with the selection without moving the page; only the row scrolls.
    const thumbnail = thumbnails.current[next];
    thumbnail?.focus({ preventScroll: true });
    if (thumbnail) revealInRow(thumbnail);
  };

  const closeOverlay = useCallback(() => setOverlayOpen(false), []);

  // Turning a tablet to the wide layout takes the overlay away (the photo is large
  // there): it closes for good, on the same photo, and focus lands on that photo's
  // thumbnail instead of nowhere.
  useEffect(() => {
    if (!wide || !overlayOpen) return;
    setOverlayOpen(false);
    thumbnails.current[requested]?.focus({ preventScroll: true });
  }, [wide, overlayOpen, requested]);

  const image = (
    <VehicleImage src={media[shown.index]?.src} change={shown.change} alt={title} aspect={wide ? 'gallery' : 'card'} loading="eager" />
  );

  return (
    <div className={styles.gallery}>
      <div
        id={panelId}
        role={total > 1 ? 'tabpanel' : undefined}
        aria-labelledby={total > 1 ? tabId(requested) : undefined}
      >
        {/* Only the narrow layout has the overlay (V3); on desktop the photo is already large. */}
        {wide || total === 0 ? (
          image
        ) : (
          <button type="button" className={styles.expand} aria-label="Abrir galeria" onClick={() => setOverlayOpen(true)}>
            {image}
          </button>
        )}
      </div>

      {/* With a single photo there is nothing to choose between. */}
      {total > 1 && (
        <div role="tablist" aria-label="Fotos do veículo" className={styles.thumbnails}>
          {media.map((item, position) => (
            <GalleryThumbnail
              key={`${position}-${item.src}`}
              ref={(element) => {
                thumbnails.current[position] = element;
              }}
              role="tab"
              id={tabId(position)}
              aria-selected={position === requested}
              aria-controls={panelId}
              tabIndex={position === requested ? 0 : -1}
              label={`Imagem ${position + 1} de ${total}`}
              src={item.src}
              selected={position === requested}
              className={styles.thumbnail}
              onClick={() => gallery.request(position)}
              onKeyDown={selectFromKeyboard}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <div className={styles.status}>
          <GalleryCounter current={shown.index + 1} total={total} />
          {/* Said only after a real wait, or when a photo can't be shown. */}
          <p className={styles.photoStatus} role="status">
            {status === 'loading' ? 'carregando foto' : status === 'unavailable' ? 'foto indisponível' : ''}
          </p>
        </div>
      )}

      {!wide && total > 0 && (
        <GalleryOverlay
          open={overlayOpen}
          title={title}
          media={media}
          gallery={gallery}
          onClose={closeOverlay}
        />
      )}
    </div>
  );
}

// Scrolls the thumbnail row, and only the row, so a thumbnail reached by keyboard is seen.
function revealInRow(thumbnail: HTMLElement) {
  const row = thumbnail.parentElement;
  if (!row) return;
  const start = thumbnail.offsetLeft - row.offsetLeft;
  const end = start + thumbnail.offsetWidth;
  if (start < row.scrollLeft) row.scrollLeft = start;
  else if (end > row.scrollLeft + row.clientWidth) row.scrollLeft = end - row.clientWidth;
}

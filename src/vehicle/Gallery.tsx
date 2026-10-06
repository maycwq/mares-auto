import { useCallback, useId, useRef, useState, type KeyboardEvent } from 'react';
import { GalleryCounter } from '../components/GalleryCounter/GalleryCounter';
import { GalleryThumbnail } from '../components/GalleryThumbnail/GalleryThumbnail';
import { VehicleImage } from '../components/VehicleImage/VehicleImage';
import type { Vehicle } from '../data/vehicles';
import { useMediaQuery } from '../lib/useMediaQuery';
import { vehicleTitle } from '../lib/vehicleText';
import { GalleryOverlay } from './GalleryOverlay';
import styles from './Gallery.module.css';

// Main image, thumbnails, counter and the mobile overlay all read one media list and one
// index. Thumbnails are tabs: arrow keys move between them, the selected one is announced.
export function Gallery({ vehicle }: { vehicle: Vehicle }) {
  const wide = useMediaQuery('(min-width: 1024px)');
  const [index, setIndex] = useState(0);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const thumbnails = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  const media = vehicle.media;
  const total = media.length;
  const title = vehicleTitle(vehicle);
  const tabId = (position: number) => `${id}-tab-${position}`;
  const panelId = `${id}-panel`;

  const selectFromKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    const targets: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: total - 1 };
    if (!(event.key in targets)) return;
    event.preventDefault();
    const next = Math.min(Math.max(targets[event.key], 0), total - 1);
    setIndex(next);
    thumbnails.current[next]?.focus();
  };

  const closeOverlay = useCallback(() => setOverlayOpen(false), []);

  const image = <VehicleImage src={media[index]?.src} alt={title} aspect={wide ? 'gallery' : 'card'} loading="eager" />;

  return (
    <div className={styles.gallery}>
      <div
        id={panelId}
        role={total > 1 ? 'tabpanel' : undefined}
        aria-labelledby={total > 1 ? tabId(index) : undefined}
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
              aria-selected={position === index}
              aria-controls={panelId}
              tabIndex={position === index ? 0 : -1}
              label={`Imagem ${position + 1} de ${total}`}
              src={item.src}
              selected={position === index}
              className={styles.thumbnail}
              onClick={() => setIndex(position)}
              onKeyDown={selectFromKeyboard}
            />
          ))}
        </div>
      )}

      {total > 0 && <GalleryCounter current={index + 1} total={total} />}

      {!wide && total > 0 && (
        <GalleryOverlay
          open={overlayOpen}
          title={title}
          media={media}
          index={index}
          onIndexChange={setIndex}
          onClose={closeOverlay}
        />
      )}
    </div>
  );
}

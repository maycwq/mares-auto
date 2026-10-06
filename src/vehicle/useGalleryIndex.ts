import { useEffect, useRef, useState } from 'react';
import type { PhotoChange } from '../components/VehicleImage/VehicleImage';
import type { MediaItem } from '../data/vehicles';
import { devTest } from '../lib/devTest';
import { duration, SLOW_THRESHOLD_MS } from '../lib/motion';

// The photo asked for (selection and focus follow it at once) and the photo on screen
// (frame and counter follow it) are two things. The frame keeps showing a real photo
// until the requested one is decoded; only the latest request may take its place. A slow
// photo says so after a real wait; a photo that fails says so and leaves the previous
// one on screen.
export type PhotoStatus = 'idle' | 'loading' | 'unavailable';

function decodePhoto(src: string | undefined): Promise<void> {
  if (!src) return Promise.reject(new Error('no photo'));
  const image = new Image();
  image.src = src;
  const decoded = image.decode();
  const latency = devTest().photoLatency;
  return latency ? decoded.then(() => new Promise((resolve) => setTimeout(resolve, latency))) : decoded;
}

// How the frame moves from the photo on screen to the next one: the previous/next
// controls slide one photo along, in their direction. A thumbnail, a jump of more than
// one photo or several quick steps crossfade instead.
export function photoChange(from: number, to: number, sequential: boolean, quick: boolean): PhotoChange {
  if (!sequential || quick || Math.abs(to - from) !== 1) return 'crossfade';
  return to > from ? 'next' : 'prev';
}

export function useGalleryIndex(media: MediaItem[]) {
  const [requested, setRequested] = useState(0);
  const [shown, setShown] = useState<{ index: number; change: PhotoChange }>({ index: 0, change: 'crossfade' });
  const [status, setStatus] = useState<PhotoStatus>('idle');
  const shownIndex = useRef(0);
  const token = useRef(0);
  const slowTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastChange = useRef(0);

  useEffect(
    () => () => {
      token.current += 1;
      clearTimeout(slowTimer.current);
    },
    [],
  );

  // The neighbours of the photo on screen are fetched ahead, nothing more.
  useEffect(() => {
    for (const neighbour of [shown.index - 1, shown.index + 1]) {
      const src = media[neighbour]?.src;
      if (src) new Image().src = src;
    }
  }, [shown.index, media]);

  // `sequential`: the previous/next controls (arrow keys, overlay buttons).
  const request = (index: number, sequential = false) => {
    if (index < 0 || index >= media.length) return;
    setRequested(index);
    const mine = ++token.current;
    clearTimeout(slowTimer.current);
    setStatus('idle');
    if (index === shownIndex.current) return;
    slowTimer.current = setTimeout(() => mine === token.current && setStatus('loading'), SLOW_THRESHOLD_MS);
    decodePhoto(media[index]?.src).then(
      () => {
        if (mine !== token.current) return;
        clearTimeout(slowTimer.current);
        const quick = performance.now() - lastChange.current < duration.medium;
        const change = photoChange(shownIndex.current, index, sequential, quick);
        lastChange.current = performance.now();
        shownIndex.current = index;
        setShown({ index, change });
        setStatus('idle');
      },
      () => {
        if (mine !== token.current) return;
        clearTimeout(slowTimer.current);
        setStatus('unavailable');
      },
    );
  };

  return { requested, shown, status, request };
}

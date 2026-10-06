import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Vehicle } from '../data/vehicles';
import { loadStock, peekStock, type StockCriteria } from './stockSource';
import { createStockRequester, type StockStatus } from './stockRequester';

// What the page shows is the last published set, not the criteria being asked for. The
// controls and the URL follow the request right away; cards, counts, titles and chips
// change together when the matching set is published. With local data that is the same
// frame, before paint.
export type PublishedStock = { key: string; criteria: StockCriteria; results: Vehicle[] };

export function useStock(key: string, criteria: StockCriteria) {
  const [published, setPublished] = useState<PublishedStock | null>(() => {
    const ready = peekStock(key, criteria);
    return ready ? { key, criteria, results: ready } : null;
  });
  const [status, setStatus] = useState<StockStatus>(published ? 'idle' : 'pending');
  const publishedKey = useRef(published?.key);

  const requester = useMemo(
    () =>
      createStockRequester<StockCriteria, Vehicle[]>(
        loadStock,
        (publishedFor, publishedCriteria, results) => {
          publishedKey.current = publishedFor;
          setPublished({ key: publishedFor, criteria: publishedCriteria, results });
        },
        setStatus,
      ),
    [],
  );

  // Before paint, so a ready set replaces the old one in the same frame.
  useLayoutEffect(() => {
    if (publishedKey.current === key) requester.cancel();
    else requester.request(key, criteria);
    // `criteria` is fully described by `key`.
  }, [key, requester]);

  useEffect(() => () => requester.cancel(), [requester]);

  return { published, status };
}

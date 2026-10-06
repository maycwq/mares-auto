import { useEffect, useLayoutEffect, useRef, type ReactNode, type Ref } from 'react';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { VehicleCard } from '../components/VehicleCard/VehicleCard';
import { VehicleCardSkeleton } from '../components/VehicleCardSkeleton/VehicleCardSkeleton';
import type { Vehicle } from '../data/vehicles';
import { prefersReducedMotion } from '../lib/motion';
import { captureGrid, playGridTransition, stopGridMotion, type GridSnapshot } from './gridTransition';
import type { StockStatus } from './stockRequester';
import type { PublishedStock } from './useStock';
import styles from './ListingPage.module.css';

type ResultsGridProps = {
  published: PublishedStock | null;
  status: StockStatus;
  visible: Vehicle[];
  wide: boolean;
  // Off on back/forward: the listing lands in place, without motion.
  animateChanges: boolean;
  emptyAction: ReactNode;
  card: (vehicle: Vehicle) => { href: string; state: Record<string, unknown>; onOpen: () => void };
  listRef: Ref<HTMLUListElement>;
};

// The cards, the empty state or (only on a first load that really waits) the skeleton,
// inside one host. The host keeps the previous set on screen until the next one is
// published and paints the change between them (gridTransition).
export function ResultsGrid({ published, status, visible, wide, animateChanges, emptyAction, card, listRef }: ResultsGridProps) {
  const host = useRef<HTMLDivElement>(null);
  const commitKey = published?.key ?? (status === 'slow' ? 'skeleton' : 'waiting');
  const shown = useRef({ commitKey, count: visible.length });
  const snapshot = useRef<GridSnapshot | undefined>(undefined);

  // Read the old layout while it's still on screen, before React writes the new one.
  // Nothing is read when nothing will move.
  if (
    (shown.current.commitKey !== commitKey || shown.current.count !== visible.length) &&
    host.current &&
    animateChanges &&
    !prefersReducedMotion()
  ) {
    snapshot.current = captureGrid(host.current);
  }

  useLayoutEffect(() => {
    const before = snapshot.current;
    const previous = shown.current;
    snapshot.current = undefined;
    shown.current = { commitKey, count: visible.length };
    const element = host.current;
    if (!element || (previous.commitKey === commitKey && previous.count === visible.length)) return;
    const kind = previous.commitKey !== commitKey ? 'commit' : 'append';
    const skip =
      !before || !animateChanges || commitKey === 'skeleton' || (kind === 'append' && visible.length < previous.count);
    if (skip) stopGridMotion(element);
    else playGridTransition(element, before, kind);
  }, [commitKey, visible.length, animateChanges]);

  useEffect(() => {
    const element = host.current;
    return () => {
      if (element) stopGridMotion(element);
    };
  }, []);

  let content: ReactNode = null;
  if (!published) {
    if (status === 'slow') {
      content = (
        <div className={styles.grid}>
          {Array.from({ length: wide ? 6 : 2 }, (_, index) => (
            <div key={index} data-motion-id={`skeleton-${index}`} className={styles.gridItem}>
              <VehicleCardSkeleton />
            </div>
          ))}
        </div>
      );
    }
  } else if (published.results.length === 0) {
    content = (
      <div data-motion-id="empty">
        <EmptyState
          title="nenhum veículo com estes filtros"
          body="ajuste ou remova alguns filtros para ver mais veículos."
          action={emptyAction}
        />
      </div>
    );
  } else {
    content = (
      <ul ref={listRef} className={styles.grid}>
        {visible.map((vehicle) => {
          const link = card(vehicle);
          return (
            <li key={vehicle.id} data-motion-id={vehicle.id} className={styles.gridItem}>
              <VehicleCard vehicle={vehicle} href={link.href} linkState={link.state} onOpen={link.onOpen} />
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div ref={host} className={styles.resultsHost} aria-busy={status === 'pending' || status === 'slow' || undefined}>
      {content}
    </div>
  );
}

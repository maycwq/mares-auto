import { useEffect, type MouseEvent } from 'react';
import { NavigationHeader } from '../components/NavigationHeader/NavigationHeader';
import { StatusBadge } from '../components/StatusBadge/StatusBadge';
import { TextLink } from '../components/TextLink/TextLink';
import { vehicles } from '../data/vehicles';
import { cx } from '../lib/cx';
import { useRouter } from '../lib/router';
import { vehicleTitle } from '../lib/vehicleText';
import { appliedFilters, countResults, parseListingState, vehicleCount } from '../listing/listingState';
import styles from './VehiclePage.module.css';

// The vehicle page starts with what keeps the exploration going: the way back to the
// results it came from, with the filters still applied. The rest of the evaluation
// (gallery, summary, evidence, details, next step) builds on this.
export function VehiclePage({ id }: { id: string }) {
  const { navigate } = useRouter();
  const vehicle = vehicles.find((item) => item.id === id);

  // Set by the listing card. Without it (a link opened directly), "back" means the
  // whole stock.
  const fromListing: string | undefined = window.history.state?.listingSearch;
  const listing = parseListingState(fromListing ?? '');
  const resultsCount = countResults(listing.query, listing.filters);

  useEffect(() => {
    if (!vehicle) navigate('/', { replace: true });
  }, [vehicle, navigate]);

  const goBack = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    // Going back through history returns to the exact exploration, scroll included.
    if (fromListing !== undefined) window.history.back();
    else navigate('/');
  };

  if (!vehicle) return null;

  return (
    <>
      <NavigationHeader />
      <main className={cx('container', styles.main)}>
        <div className={styles.context}>
          <TextLink href={`/${fromListing ?? ''}`} onClick={goBack}>
            ← Voltar para {vehicleCount(resultsCount)}
          </TextLink>
          {appliedFilters(listing.filters).map((label) => (
            <StatusBadge key={label} label={label} />
          ))}
        </div>
        <h1 className={styles.title}>{vehicleTitle(vehicle)}</h1>
      </main>
    </>
  );
}

import { useEffect, useMemo, useReducer } from 'react';
import { useRouter } from '../lib/router';
import {
  PAGE_SIZE,
  emptyFilters,
  findResults,
  listingSearch,
  parseListingState,
  type Filters,
  type ListingState,
} from './listingState';

// There's no backend yet. Results are computed locally and shown after a short delay, so
// the loading state exists and behaves like it will with a real request. A result set
// that was already shown comes back immediately, which also lets the browser restore the
// scroll position when the person returns from a vehicle.
const LATENCY_MS = 350;
const loaded = new Set<string>();

export function useListing() {
  const { location, navigate } = useRouter();
  const state = useMemo(() => parseListingState(location.search), [location.search]);

  // Any change to what is searched starts again from the first page.
  const update = (patch: Partial<ListingState>) =>
    navigate(location.pathname + listingSearch({ ...state, shown: PAGE_SIZE, ...patch }), { replace: true });

  const resultsKey = listingSearch({ ...state, shown: PAGE_SIZE });
  const results = useMemo(() => findResults(state), [state]);

  const [, rerender] = useReducer((tick: number) => tick + 1, 0);
  useEffect(() => {
    if (loaded.has(resultsKey)) return;
    const timer = setTimeout(() => {
      loaded.add(resultsKey);
      rerender();
    }, LATENCY_MS);
    return () => clearTimeout(timer);
  }, [resultsKey]);

  return {
    state,
    results,
    loading: !loaded.has(resultsKey),
    setQuery: (query: string) => update({ query }),
    setSort: (sort: string) => update({ sort }),
    setFilters: (filters: Filters) => update({ filters }),
    clearFilters: () => update({ filters: emptyFilters }),
    showMore: () => update({ shown: state.shown + PAGE_SIZE }),
  };
}

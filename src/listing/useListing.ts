import { useMemo } from 'react';
import { useRouter } from '../lib/router';
import { PAGE_SIZE, emptyFilters, listingSearch, parseListingState, type Filters, type ListingState } from './listingState';
import { useStock } from './useStock';

// The exploration state lives in the URL. Refinements replace the current entry, so
// "back" leaves the listing instead of undoing filters. Results come from useStock.
export function useListing() {
  const { location, navigate, navigation } = useRouter();
  const state = useMemo(() => parseListingState(location.search), [location.search]);
  const criteriaKey = listingSearch({ ...state, shown: PAGE_SIZE });
  const { published, status } = useStock(criteriaKey, state);

  // Any change to what is searched starts again from the first page.
  const update = (patch: Partial<ListingState>) =>
    navigate(location.pathname + listingSearch({ ...state, shown: PAGE_SIZE, ...patch }), { replace: true });

  return {
    state,
    criteriaKey,
    published,
    status,
    navigation,
    setQuery: (query: string) => update({ query }),
    setSort: (sort: string) => update({ sort }),
    setFilters: (filters: Filters) => update({ filters }),
    clearFilters: () => update({ filters: emptyFilters }),
    showMore: () => update({ shown: state.shown + PAGE_SIZE }),
  };
}

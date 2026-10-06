// The listing a page was opened from travels in history state, so going back resumes
// that exact exploration (results, filters, scroll) instead of rebuilding it.
// listingSearch is the listing URL's query string; listingDistance is how many history
// entries this page is from that listing (a vehicle opened from a card is 1, a similar
// vehicle opened from it is 2, and so on).
export type Exploration = { listingSearch: string; listingDistance: number };

// Undefined when the page wasn't reached from the listing in this tab, e.g. a link opened
// directly.
export function currentExploration(): Exploration | undefined {
  const state = window.history.state;
  if (typeof state?.listingSearch !== 'string') return undefined;
  return { listingSearch: state.listingSearch, listingDistance: state.listingDistance ?? 1 };
}

// History state for a link that goes one page further from the same listing.
export const furtherExploration = (exploration: Exploration | undefined): Exploration | undefined =>
  exploration && { ...exploration, listingDistance: exploration.listingDistance + 1 };

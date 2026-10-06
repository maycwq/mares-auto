import { useCallback, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { Button, buttonClassName } from '../components/Button/Button';
import { FilterChip } from '../components/FilterChip/FilterChip';
import { NavigationHeader } from '../components/NavigationHeader/NavigationHeader';
import { SearchField } from '../components/SearchField/SearchField';
import { Select } from '../components/Select/Select';
import { TextLink } from '../components/TextLink/TextLink';
import { cx } from '../lib/cx';
import { useMediaQuery } from '../lib/useMediaQuery';
import { useCrossfade } from '../lib/useCrossfade';
import { useStickyWhenFits } from '../lib/useStickyWhenFits';
import { PrimaryFilters } from './FilterControls';
import { FilterSheet } from './FilterSheet';
import {
  PAGE_SIZE,
  appliedFilters,
  listingSearch,
  resultCount,
  secondaryFilterCount,
  sortOptions,
} from './listingState';
import { MoreFiltersDrawer } from './MoreFiltersDrawer';
import { ResultsGrid } from './ResultsGrid';
import { useListing } from './useListing';
import { useChipTransition } from './useChipTransition';
import { useSearchDraft } from './useSearchDraft';
import styles from './ListingPage.module.css';

// "Ver os N veículos" only when this click shows everything that's left, and N is what it
// shows. While there's more after it, the action is incremental.
const showMoreLabel = (remaining: number) => {
  if (remaining > PAGE_SIZE) return 'Ver mais veículos';
  return remaining === 1 ? 'Ver 1 veículo' : `Ver os ${remaining} veículos`;
};

export function ListingPage() {
  const listing = useListing();
  const { state, published, status, criteriaKey, navigation } = listing;
  const wide = useMediaQuery('(min-width: 1024px)');
  const [openPanel, setOpenPanel] = useState<'sheet' | 'drawer' | null>(null);
  const resultsList = useRef<HTMLUListElement>(null);
  // The filters rail stays in reach while the results scroll, when it fits the window.
  const rail = useRef<HTMLElement>(null);
  useStickyWhenFits(rail, 24);
  const search = useSearchDraft(state.query, listing.setQuery);

  // Everything that describes the result set (numbers, titles, chips) follows the
  // published set; the controls follow what was asked for.
  const results = published?.results ?? [];
  const shownCriteria = published?.criteria ?? state;
  const applied = appliedFilters(shownCriteria.filters);
  const filtered = applied.length > 0;
  const searched = shownCriteria.query.trim() !== '';
  const requestedFilters = appliedFilters(state.filters);
  const secondaryCount = secondaryFilterCount(state.filters);

  // While a new set is on its way, the old one keeps the size it had.
  const publishedShown = useRef(state.shown);
  const current = published?.key === criteriaKey;
  const shown = current ? state.shown : publishedShown.current;
  useLayoutEffect(() => {
    if (current) publishedShown.current = state.shown;
  });
  const visible = results.slice(0, shown);
  const remaining = results.length - visible.length;

  // Ver mais keeps focus where the reading continues (the first new card) without moving
  // the page for a pointer; from the keyboard, only as far as needed to see it.
  const appendFocus = useRef<{ index: number; keyboard: boolean } | null>(null);
  const showMore = (event: MouseEvent<HTMLButtonElement>) => {
    appendFocus.current = { index: visible.length, keyboard: event.detail === 0 };
    listing.showMore();
  };
  useLayoutEffect(() => {
    const target = appendFocus.current;
    if (!target || visible.length <= target.index) return;
    appendFocus.current = null;
    const link = resultsList.current?.querySelectorAll<HTMLAnchorElement>('[data-motion-id] a')[target.index];
    if (!link) return;
    link.focus({ preventScroll: true });
    if (target.keyboard) {
      const box = link.getBoundingClientRect();
      if (box.top < 0 || box.bottom > window.innerHeight) link.scrollIntoView({ block: 'nearest' });
    }
  }, [visible.length]);

  // Back from a vehicle: the router restores the scroll position; focus returns to the
  // card that was opened, without moving the page.
  useLayoutEffect(() => {
    if (navigation !== 'pop') return;
    const origin: unknown = window.history.state?.originCardId;
    if (typeof origin !== 'string') return;
    resultsList.current?.querySelector<HTMLAnchorElement>(`[data-motion-id="${origin}"] a`)?.focus({ preventScroll: true });
    // Only on arrival.
  }, []);

  // "Limpar filtros" in the empty state goes away with the results it brings back, so
  // focus continues at the results' title, without moving the page.
  const resultsTitle = useRef<HTMLHeadingElement>(null);
  const focusResults = useRef(false);
  const clearFromEmpty = () => {
    focusResults.current = true;
    listing.clearFilters();
  };
  useLayoutEffect(() => {
    if (!focusResults.current) return;
    focusResults.current = false;
    resultsTitle.current?.focus({ preventScroll: true });
  }, [published?.key]);

  const closePanel = useCallback(() => setOpenPanel(null), []);
  const count = published ? results.length : undefined;
  const main = useRef<HTMLElement>(null);
  const chips = useRef<HTMLUListElement>(null);
  useChipTransition(chips, main, applied, navigation !== 'pop');
  // Both counts swap in the same commit as the cards, through a short crossfade.
  const stockNumber = useCrossfade<HTMLSpanElement>(count === undefined ? '' : String(count));
  const resultsCount = useCrossfade<HTMLParagraphElement>(count === undefined ? '' : resultCount(count));

  return (
    <>
      <NavigationHeader />
      <main ref={main} className={cx('container', styles.main)}>
        <section className={styles.hero}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>estoque de seminovos</p>
            <h1 className={styles.title}>Encontre o carro que faz sentido para você</h1>
          </div>
          {/* The number is always the published set: search, filters or both. Only the
              words around it follow the state, as in D1, D2 and M3. */}
          {count !== undefined && (
          <p className={styles.stock}>
            <span ref={stockNumber} className={styles.stockNumber}>
              {String(count)}
            </span>{' '}
            {filtered ? (
              <>
                <span className={styles.wideOnly}>{count === 1 ? 'veículo com estes filtros' : 'veículos com estes filtros'}</span>
                <span className={styles.narrowOnly}>{count === 1 ? 'veículo encontrado' : 'veículos encontrados'}</span>
              </>
            ) : searched ? (
              count === 1 ? 'veículo encontrado' : 'veículos encontrados'
            ) : count === 1 ? (
              'veículo disponível'
            ) : (
              'veículos disponíveis'
            )}
          </p>
          )}
        </section>

        <div className={styles.toolbar}>
          <SearchField
            className={styles.search}
            label="Buscar por marca, modelo ou versão"
            placeholder={wide ? 'Buscar por marca, modelo ou versão' : 'Marca, modelo ou versão'}
            clearLabel="Limpar busca"
            value={search.text}
            onChange={search.change}
            onSubmit={search.submit}
            onClear={search.clear}
          />
          <Select
            className={styles.sort}
            label="Ordenar resultados"
            options={sortOptions}
            value={state.sort}
            onChange={listing.setSort}
          />
          <div className={styles.mobileActions}>
            <Button variant="secondary" onClick={() => setOpenPanel('sheet')}>
              {requestedFilters.length ? `Filtros · ${requestedFilters.length}` : 'Filtros'}
            </Button>
            {/* Same sort as desktop, with the native picker behind a Button-shaped control. */}
            <label className={buttonClassName('secondary', 'md', styles.mobileSort)}>
              Ordenar
              <select
                className={styles.mobileSortSelect}
                aria-label="Ordenar resultados"
                value={state.sort}
                onChange={(event) => listing.setSort(event.target.value)}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {applied.length > 0 && (
          <ul ref={chips} className={styles.chips} aria-label="Filtros aplicados">
            {applied.map((label) => (
              <li key={label} data-chip={label}>
                <FilterChip label={label} />
              </li>
            ))}
          </ul>
        )}

        <div className={styles.content}>
          <aside ref={rail} className={styles.rail} aria-labelledby="filters-title">
            <div className={styles.railHeader}>
              <h2 id="filters-title" className={styles.railTitle}>
                Filtros
              </h2>
              <TextLink onClick={listing.clearFilters}>Limpar</TextLink>
            </div>
            <PrimaryFilters short filters={state.filters} onChange={listing.setFilters} />
            <hr className={styles.divider} />
            <p className={styles.secondaryLabel}>mais filtros</p>
            <Button variant="secondary" onClick={() => setOpenPanel('drawer')}>
              {secondaryCount ? `Mais filtros · ${secondaryCount}` : 'Mais filtros'}
            </Button>
            <p className={styles.secondaryCaption}>câmbio · combustível · loja</p>
          </aside>

          <section className={styles.results} aria-labelledby="results-title">
            <div className={styles.resultsHeader}>
              <h2 id="results-title" ref={resultsTitle} tabIndex={-1} className={styles.resultsTitle}>
                {filtered ? (
                  'Seminovos com estes filtros'
                ) : (
                  <>
                    <span className={styles.wideOnly}>Todos os seminovos</span>
                    <span className={styles.narrowOnly}>Todos</span>
                  </>
                )}
              </h2>
              <div className={styles.resultsMeta}>
                {/* Outside the busy region, so the wait and the result can be announced. */}
                {(status === 'slow' || status === 'failed') && (
                  <p className={styles.resultsStatus} role="status">
                    {status === 'slow' ? 'atualizando veículos' : 'não foi possível atualizar os veículos'}
                  </p>
                )}
                {count !== undefined && (
                  <p ref={resultsCount} className={styles.resultsCount} aria-live="polite">
                    {resultCount(count)}
                  </p>
                )}
              </div>
            </div>

            <ResultsGrid
              published={published}
              status={status}
              visible={visible}
              wide={wide}
              animateChanges={navigation !== 'pop'}
              listRef={resultsList}
              emptyAction={
                applied.length > 0 && (
                  <Button variant="secondary" onClick={clearFromEmpty}>
                    Limpar filtros
                  </Button>
                )
              }
              card={(vehicle) => ({
                href: `/veiculos/${vehicle.id}`,
                state: { listingSearch: listingSearch(state) },
                onOpen: () => window.history.replaceState({ ...window.history.state, originCardId: vehicle.id }, ''),
              })}
            />

            {remaining > 0 && (
              <Button variant="secondary" className={styles.more} onClick={showMore}>
                {showMoreLabel(remaining)}
              </Button>
            )}
          </section>
        </div>
      </main>

      <MoreFiltersDrawer
        open={openPanel === 'drawer'}
        query={state.query}
        filters={state.filters}
        onApply={(filters) => {
          listing.setFilters(filters);
          closePanel();
        }}
        onClose={closePanel}
      />
      <FilterSheet
        open={openPanel === 'sheet'}
        query={state.query}
        filters={state.filters}
        onApply={(filters) => {
          listing.setFilters(filters);
          closePanel();
        }}
        onClose={closePanel}
      />
    </>
  );
}

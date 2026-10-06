import { useCallback, useRef, useState } from 'react';
import { Button, buttonClassName } from '../components/Button/Button';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { FilterChip } from '../components/FilterChip/FilterChip';
import { NavigationHeader } from '../components/NavigationHeader/NavigationHeader';
import { SearchField } from '../components/SearchField/SearchField';
import { Select } from '../components/Select/Select';
import { TextLink } from '../components/TextLink/TextLink';
import { VehicleCard } from '../components/VehicleCard/VehicleCard';
import { VehicleCardSkeleton } from '../components/VehicleCardSkeleton/VehicleCardSkeleton';
import { vehicles } from '../data/vehicles';
import { cx } from '../lib/cx';
import { useMediaQuery } from '../lib/useMediaQuery';
import { PrimaryFilters } from './FilterControls';
import { FilterSheet } from './FilterSheet';
import {
  PAGE_SIZE,
  appliedFilters,
  countResults,
  listingSearch,
  resultCount,
  secondaryFilterCount,
  sortOptions,
} from './listingState';
import { MoreFiltersDrawer } from './MoreFiltersDrawer';
import { useListing } from './useListing';
import styles from './ListingPage.module.css';

const SKELETON_COUNT = 6;

// "Ver os N veículos" only when this click shows everything that's left, and N is what it
// shows. While there's more after it, the action is incremental.
const showMoreLabel = (remaining: number) => {
  if (remaining > PAGE_SIZE) return 'Ver mais veículos';
  return remaining === 1 ? 'Ver o último veículo' : `Ver os ${remaining} veículos`;
};

export function ListingPage() {
  const listing = useListing();
  const { state, results, loading } = listing;
  const wide = useMediaQuery('(min-width: 1024px)');
  const [openPanel, setOpenPanel] = useState<'sheet' | 'drawer' | null>(null);
  const resultsList = useRef<HTMLUListElement>(null);

  const applied = appliedFilters(state.filters);
  // Only structured filters change the titles. Search text narrows the results (and their
  // count) but it isn't a filter, and the design has no separate copy for it.
  const filtered = applied.length > 0;
  const stock = filtered ? countResults('', state.filters) : vehicles.length;
  const visible = results.slice(0, state.shown);
  const remaining = results.length - visible.length;
  const secondaryCount = secondaryFilterCount(state.filters);

  const showMore = () => {
    const firstNew = visible.length;
    listing.showMore();
    // Keyboard and screen reader users continue from the first card that just appeared.
    requestAnimationFrame(() => resultsList.current?.querySelectorAll('a')[firstNew]?.focus());
  };

  const closePanel = useCallback(() => setOpenPanel(null), []);

  return (
    <>
      <NavigationHeader />
      <main className={cx('container', styles.main)}>
        <section className={styles.hero}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>estoque de seminovos</p>
            <h1 className={styles.title}>Encontre o carro que faz sentido para você</h1>
          </div>
          <p className={styles.stock}>
            <span className={styles.stockNumber}>{stock}</span>{' '}
            {filtered ? (
              <>
                <span className={styles.wideOnly}>{stock === 1 ? 'veículo com estes filtros' : 'veículos com estes filtros'}</span>
                <span className={styles.narrowOnly}>{stock === 1 ? 'veículo encontrado' : 'veículos encontrados'}</span>
              </>
            ) : stock === 1 ? (
              'veículo disponível'
            ) : (
              'veículos disponíveis'
            )}
          </p>
        </section>

        <div className={styles.toolbar}>
          <SearchField
            className={styles.search}
            label="Buscar por marca, modelo ou versão"
            placeholder={wide ? 'Buscar por marca, modelo ou versão' : 'Marca, modelo ou versão'}
            clearLabel="Limpar busca"
            value={state.query}
            onChange={listing.setQuery}
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
              {applied.length ? `Filtros · ${applied.length}` : 'Filtros'}
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
          <ul className={styles.chips} aria-label="Filtros aplicados">
            {applied.map((label) => (
              <li key={label}>
                <FilterChip label={label} />
              </li>
            ))}
          </ul>
        )}

        <div className={styles.content}>
          <aside className={styles.rail} aria-labelledby="filters-title">
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

          <section className={styles.results} aria-labelledby="results-title" aria-busy={loading}>
            <div className={styles.resultsHeader}>
              <h2 id="results-title" className={styles.resultsTitle}>
                {filtered ? (
                  'Seminovos com estes filtros'
                ) : (
                  <>
                    <span className={styles.wideOnly}>Todos os seminovos</span>
                    <span className={styles.narrowOnly}>Todos</span>
                  </>
                )}
              </h2>
              <p className={styles.resultsCount} aria-live="polite">
                {loading ? <span className="visually-hidden">Carregando resultados</span> : resultCount(results.length)}
              </p>
            </div>

            {loading ? (
              <div className={styles.grid}>
                {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                  <VehicleCardSkeleton key={index} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <EmptyState
                title="nenhum veículo com estes filtros"
                body="ajuste ou remova alguns filtros para ver mais veículos."
                action={
                  applied.length > 0 && (
                    <Button variant="secondary" onClick={listing.clearFilters}>
                      Limpar filtros
                    </Button>
                  )
                }
              />
            ) : (
              <ul ref={resultsList} className={styles.grid}>
                {visible.map((vehicle) => (
                  <li key={vehicle.id} className={styles.gridItem}>
                    <VehicleCard
                      vehicle={vehicle}
                      href={`/veiculos/${vehicle.id}`}
                      linkState={{ listingSearch: listingSearch(state) }}
                    />
                  </li>
                ))}
              </ul>
            )}

            {!loading && remaining > 0 && (
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

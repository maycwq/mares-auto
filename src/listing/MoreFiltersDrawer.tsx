import { useEffect, useState } from 'react';
import { Button } from '../components/Button/Button';
import { useModalDialog } from '../lib/useModalDialog';
import { CheckboxFilter, StoreFilter } from './FilterControls';
import { countResults, vehicleCount, type Filters } from './listingState';
import styles from './MoreFiltersDrawer.module.css';

type MoreFiltersDrawerProps = {
  open: boolean;
  query: string;
  filters: Filters;
  onApply: (filters: Filters) => void;
  onClose: () => void;
};

// Second layer of filters on desktop: câmbio, combustível e loja. Edits stay a draft
// until "Ver N veículos"; closing keeps the filters that were applied before.
export function MoreFiltersDrawer({ open, query, filters, onApply, onClose }: MoreFiltersDrawerProps) {
  const dialog = useModalDialog(open, onClose);
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  return (
    <dialog ref={dialog} className={styles.drawer} aria-labelledby="more-filters-title">
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 id="more-filters-title" className={styles.title}>
            Mais filtros
          </h2>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
        <p className={styles.help}>Use estes critérios para refinar ainda mais a busca.</p>
        <CheckboxFilter field="transmission" filters={draft} onChange={setDraft} />
        <CheckboxFilter field="fuel" layout="row" filters={draft} onChange={setDraft} />
        <p className={styles.storeLabel} aria-hidden="true">
          Loja
        </p>
        <StoreFilter placeholder="Qualquer loja" filters={draft} onChange={setDraft} />
        <Button onClick={() => onApply(draft)}>Ver {vehicleCount(countResults(query, draft))}</Button>
      </div>
    </dialog>
  );
}

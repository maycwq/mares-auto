import { useEffect, useState } from 'react';
import { Button } from '../components/Button/Button';
import { IconButton } from '../components/IconButton/IconButton';
import { useCrossfade } from '../lib/useCrossfade';
import { sheetMotion, useModalDialog } from '../lib/useModalDialog';
import { CheckboxFilter, PrimaryFilters, StoreFilter } from './FilterControls';
import { countResults, emptyFilters, vehicleCount, type Filters } from './listingState';
import styles from './FilterSheet.module.css';

type FilterSheetProps = {
  open: boolean;
  query: string;
  filters: Filters;
  onApply: (filters: Filters) => void;
  onClose: () => void;
};

// The same filters as the desktop rail and drawer, as one focused task on small screens.
// Edits are a draft with a live count; "Ver N veículos" applies them, closing discards.
export function FilterSheet({ open, query, filters, onApply, onClose }: FilterSheetProps) {
  const dialog = useModalDialog(open, onClose, sheetMotion);
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const count = countResults(query, draft);
  // The draft's count swaps as the draft changes; the grid behind doesn't move.
  const foundLabel = useCrossfade<HTMLParagraphElement>(vehicleCount(count));
  const apply = `Ver ${vehicleCount(count)}`;
  const applyLabel = useCrossfade<HTMLButtonElement>(apply);

  return (
    <dialog ref={dialog} className={styles.sheet} aria-labelledby="filter-sheet-title">
      <div className={styles.header}>
        <h2 id="filter-sheet-title" className={styles.title}>
          Filtros
        </h2>
        <IconButton icon="close" label="Fechar filtros" onClick={onClose} />
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          <p ref={foundLabel} className={styles.found} aria-live="polite">
            {vehicleCount(count)}
          </p>
          <Button variant="ghost" onClick={() => setDraft(emptyFilters)}>
            Limpar tudo
          </Button>
        </div>
        <PrimaryFilters filters={draft} onChange={setDraft} />
        <p className={styles.groupLabel}>mais filtros</p>
        <StoreFilter placeholder="Loja" filters={draft} onChange={setDraft} />
        <CheckboxFilter field="transmission" filters={draft} onChange={setDraft} />
        <CheckboxFilter field="fuel" filters={draft} onChange={setDraft} />
      </div>
      <div className={styles.footer}>
        <Button ref={applyLabel} onClick={() => onApply(draft)}>
          {apply}
        </Button>
      </div>
    </dialog>
  );
}

// The filter fields, shared by the desktop rail, the "mais filtros" drawer and the mobile
// sheet. Each place composes them in its own order; the fields and their options are the
// same everywhere.
import { Checkbox } from '../components/Checkbox/Checkbox';
import { Select } from '../components/Select/Select';
import { cx } from '../lib/cx';
import styles from './FilterControls.module.css';
import {
  bodyOptions,
  brandOptions,
  fuelOptions,
  kmOptions,
  priceOptions,
  storeOptions,
  transmissionOptions,
  yearOptions,
  type Filters,
} from './listingState';

type FieldsProps = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

// Marca/modelo, preço, ano, quilometragem e tipo de carro. The rail uses the short
// labels; the accessible names are always the full ones.
export function PrimaryFilters({ filters, onChange, short = false }: FieldsProps & { short?: boolean }) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  return (
    <>
      <Select
        label="Marca e modelo"
        placeholder={short ? 'Marca/modelo' : 'Marca e modelo'}
        options={brandOptions}
        value={filters.brand}
        onChange={(brand) => set({ brand })}
      />
      <Select
        label="Faixa de preço"
        placeholder="Faixa de preço"
        options={priceOptions}
        value={filters.price}
        onChange={(price) => set({ price })}
      />
      <Select label="Ano" placeholder="Ano" options={yearOptions} value={filters.year} onChange={(year) => set({ year })} />
      <Select
        label="Quilometragem"
        placeholder={short ? 'Km' : 'Quilometragem'}
        options={kmOptions}
        value={filters.km}
        onChange={(km) => set({ km })}
      />
      <Select
        label="Tipo de carro"
        placeholder="Tipo de carro"
        options={bodyOptions}
        value={filters.body}
        onChange={(body) => set({ body })}
      />
    </>
  );
}

type CheckboxGroupProps = FieldsProps & {
  field: 'transmission' | 'fuel';
  layout?: 'column' | 'row';
};

// Câmbio and combustível accept independent choices, so they are checkboxes.
export function CheckboxFilter({ filters, onChange, field, layout = 'column' }: CheckboxGroupProps) {
  const options = field === 'transmission' ? transmissionOptions : fuelOptions;
  const selected = filters[field];
  const toggle = (value: string, checked: boolean) =>
    onChange({
      ...filters,
      [field]: checked
        ? options.map((option) => option.value).filter((v) => v === value || selected.includes(v))
        : selected.filter((v) => v !== value),
    });

  return (
    <fieldset className={cx(styles.group, layout === 'row' && styles.row)}>
      <legend className={styles.legend}>{field === 'transmission' ? 'Câmbio' : 'Combustível'}</legend>
      {options.map((option) => (
        <Checkbox
          key={option.value}
          label={option.label}
          checked={selected.includes(option.value)}
          onChange={(checked) => toggle(option.value, checked)}
        />
      ))}
    </fieldset>
  );
}

export function StoreFilter({ filters, onChange, placeholder }: FieldsProps & { placeholder: string }) {
  return (
    <Select
      label="Loja"
      placeholder={placeholder}
      options={storeOptions}
      value={filters.store}
      onChange={(store) => onChange({ ...filters, store })}
    />
  );
}

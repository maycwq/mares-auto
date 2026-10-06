// The exploration state of the listing: search text, filters, sort and how many results
// are showing. It lives in the URL, so opening a vehicle and coming back (or reloading)
// finds the same exploration. Everything that shows the state (fields, chips, counts,
// cards) reads it from here.
import { stores, vehicles, type BodyType, type Fuel, type Transmission, type Vehicle } from '../data/vehicles';
import { formatKm, plural } from '../lib/format';

export const PAGE_SIZE = 12;

export type Filters = {
  brand: string; // make slug, or "make/model"
  price: string; // maximum price
  year: string; // minimum year
  km: string; // maximum mileage
  body: string;
  transmission: string[];
  fuel: string[];
  store: string;
};

export type ListingState = {
  query: string;
  sort: string;
  filters: Filters;
  shown: number;
};

export const emptyFilters: Filters = {
  brand: '',
  price: '',
  year: '',
  km: '',
  body: '',
  transmission: [],
  fuel: [],
  store: '',
};

// --- options -------------------------------------------------------------------

const slug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

type Option = { value: string; label: string };

function brandOptionsFrom(stock: Vehicle[]): Option[] {
  const makes = new Map<string, Set<string>>();
  for (const vehicle of stock) {
    if (!makes.has(vehicle.make)) makes.set(vehicle.make, new Set());
    makes.get(vehicle.make)!.add(vehicle.model);
  }
  return [...makes.keys()]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .flatMap((make) => [
      { value: slug(make), label: make },
      ...[...makes.get(make)!]
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .map((model) => ({ value: `${slug(make)}/${slug(model)}`, label: `${make} ${model}` })),
    ]);
}

export const brandOptions = brandOptionsFrom(vehicles);

export const priceOptions: Option[] = [60, 80, 100, 120, 150, 200, 250, 300].map((thousands) => ({
  value: String(thousands * 1000),
  label: `Até R$ ${thousands} mil`,
}));

const years = [...new Set(vehicles.map((vehicle) => vehicle.year))].sort((a, b) => b - a);
export const yearOptions: Option[] = years.map((year) => ({ value: String(year), label: `A partir de ${year}` }));

export const kmOptions: Option[] = [10, 20, 40, 60, 80, 100].map((thousands) => ({
  value: String(thousands * 1000),
  label: `Até ${formatKm(thousands * 1000)}`,
}));

const bodyTypes: { value: string; label: string; types: BodyType[] }[] = [
  { value: 'hatch', label: 'Hatch', types: ['hatch'] },
  { value: 'seda', label: 'Sedã', types: ['sedan'] },
  { value: 'suv', label: 'SUV', types: ['suv'] },
  { value: 'picape', label: 'Picape', types: ['pickup'] },
  { value: 'minivan', label: 'Minivan', types: ['minivan'] },
  { value: 'cupe', label: 'Cupê', types: ['coupe'] },
];
export const bodyOptions: Option[] = bodyTypes.filter((body) => vehicles.some((v) => body.types.includes(v.bodyType)));

const transmissions: { value: string; label: string; types: Transmission[] }[] = [
  { value: 'automatico', label: 'Automático', types: ['automatic'] },
  { value: 'manual', label: 'Manual', types: ['manual'] },
];
export const transmissionOptions: Option[] = transmissions;

const fuels: { value: string; label: string; types: Fuel[] }[] = [
  { value: 'flex', label: 'Flex', types: ['flex'] },
  { value: 'gasolina', label: 'Gasolina', types: ['gasoline'] },
  { value: 'diesel', label: 'Diesel', types: ['diesel'] },
  { value: 'hibrido-eletrico', label: 'Híbrido / elétrico', types: ['hybrid', 'electric'] },
];
export const fuelOptions: Option[] = fuels;

export const storeOptions: Option[] = stores.map((store) => ({ value: store.id, label: store.name }));

const sorts: { value: string; label: string; compare: (a: Vehicle, b: Vehicle) => number }[] = [
  { value: 'recentes', label: 'Mais recentes', compare: (a, b) => b.listedAt.localeCompare(a.listedAt) },
  { value: 'menor-preco', label: 'Menor preço', compare: (a, b) => a.price - b.price },
  { value: 'maior-preco', label: 'Maior preço', compare: (a, b) => b.price - a.price },
  {
    value: 'menor-km',
    label: 'Menor quilometragem',
    compare: (a, b) => (a.km ?? Infinity) - (b.km ?? Infinity),
  },
  { value: 'mais-novos', label: 'Mais novos', compare: (a, b) => b.year - a.year },
];
export const sortOptions: Option[] = sorts;
export const DEFAULT_SORT = sorts[0].value;

// --- URL -----------------------------------------------------------------------

const known = (options: Option[], value: string | null) =>
  value !== null && options.some((option) => option.value === value) ? value : '';

const knownList = (options: Option[], value: string | null) =>
  (value ?? '').split(',').filter((item) => options.some((option) => option.value === item));

export function parseListingState(search: string): ListingState {
  const params = new URLSearchParams(search);
  const shown = Number(params.get('mostrar'));
  return {
    query: params.get('busca') ?? '',
    sort: known(sortOptions, params.get('ordem')) || DEFAULT_SORT,
    filters: {
      brand: known(brandOptions, params.get('marca')),
      price: known(priceOptions, params.get('preco')),
      year: known(yearOptions, params.get('ano')),
      km: known(kmOptions, params.get('km')),
      body: known(bodyOptions, params.get('tipo')),
      transmission: knownList(transmissionOptions, params.get('cambio')),
      fuel: knownList(fuelOptions, params.get('combustivel')),
      store: known(storeOptions, params.get('loja')),
    },
    shown: Number.isInteger(shown) && shown > PAGE_SIZE ? shown : PAGE_SIZE,
  };
}

// Only what differs from the defaults goes into the URL.
export function listingSearch(state: ListingState) {
  const { filters } = state;
  const entries: [string, string][] = [
    ['busca', state.query],
    ['ordem', state.sort === DEFAULT_SORT ? '' : state.sort],
    ['marca', filters.brand],
    ['preco', filters.price],
    ['ano', filters.year],
    ['km', filters.km],
    ['tipo', filters.body],
    ['cambio', filters.transmission.join(',')],
    ['combustivel', filters.fuel.join(',')],
    ['loja', filters.store],
    ['mostrar', state.shown > PAGE_SIZE ? String(state.shown) : ''],
  ];
  const params = new URLSearchParams(entries.filter(([, value]) => value));
  const search = params.toString();
  return search ? `?${search}` : '';
}

// --- results -------------------------------------------------------------------

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const searchText = new Map(
  vehicles.map((v) => [v.id, normalize(`${v.make} ${v.model} ${v.trim} ${v.version} ${v.year}`)]),
);

// A vehicle without the data a filter checks (no mileage, no fuel…) can't be shown as
// matching it.
function matches(vehicle: Vehicle, query: string, filters: Filters) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.some((word) => !searchText.get(vehicle.id)!.includes(word))) return false;

  if (filters.brand) {
    const [make, model] = filters.brand.split('/');
    if (slug(vehicle.make) !== make || (model && slug(vehicle.model) !== model)) return false;
  }
  if (filters.price && vehicle.price > Number(filters.price)) return false;
  if (filters.year && vehicle.year < Number(filters.year)) return false;
  if (filters.km && (vehicle.km === undefined || vehicle.km > Number(filters.km))) return false;
  if (filters.body && !bodyTypes.find((b) => b.value === filters.body)!.types.includes(vehicle.bodyType)) return false;
  if (filters.transmission.length) {
    const accepted = transmissions.filter((t) => filters.transmission.includes(t.value)).flatMap((t) => t.types);
    if (!vehicle.transmission || !accepted.includes(vehicle.transmission)) return false;
  }
  if (filters.fuel.length) {
    const accepted = fuels.filter((f) => filters.fuel.includes(f.value)).flatMap((f) => f.types);
    if (!vehicle.fuel || !accepted.includes(vehicle.fuel)) return false;
  }
  if (filters.store && vehicle.storeId !== filters.store) return false;
  return true;
}

export function countResults(query: string, filters: Filters) {
  return vehicles.filter((vehicle) => matches(vehicle, query, filters)).length;
}

// Sorted results for the state. Ties keep a stable order (listing date, then id), so the
// same exploration always shows the same sequence.
export function findResults(state: ListingState) {
  const compare = sorts.find((sort) => sort.value === state.sort)!.compare;
  return vehicles
    .filter((vehicle) => matches(vehicle, state.query, state.filters))
    .sort((a, b) => compare(a, b) || b.listedAt.localeCompare(a.listedAt) || a.id.localeCompare(b.id));
}

// --- applied filters -------------------------------------------------------------

const labelOf = (options: Option[], value: string) => options.find((option) => option.value === value)!.label;

// One entry per applied value, in the order the filters appear. Chips and counts use it.
export function appliedFilters(filters: Filters) {
  return [
    filters.brand && labelOf(brandOptions, filters.brand),
    filters.price && labelOf(priceOptions, filters.price),
    filters.year && labelOf(yearOptions, filters.year),
    filters.km && labelOf(kmOptions, filters.km),
    filters.body && labelOf(bodyOptions, filters.body),
    ...filters.transmission.map((value) => labelOf(transmissionOptions, value)),
    ...filters.fuel.map((value) => labelOf(fuelOptions, value)),
    filters.store && labelOf(storeOptions, filters.store),
  ].filter((label): label is string => !!label);
}

// Filters that live in the second layer ("mais filtros").
export const secondaryFilterCount = (filters: Filters) =>
  filters.transmission.length + filters.fuel.length + (filters.store ? 1 : 0);

export const vehicleCount = (count: number) => plural(count, 'veículo', 'veículos');
export const resultCount = (count: number) => plural(count, 'resultado', 'resultados');

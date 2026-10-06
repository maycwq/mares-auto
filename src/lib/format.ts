const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat('pt-BR');

// "R$ 148.990"
export const formatPrice = (value: number) => currency.format(value);

// "48.320"
export const formatNumber = (value: number) => integer.format(value);

// "48.320 km"
export const formatKm = (value: number) => `${integer.format(value)} km`;

// "2026-12" → "12/2026"
export const formatMonthYear = (isoMonth: string) => {
  const [year, month] = isoMonth.split('-');
  return `${month}/${year}`;
};

const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// "2027-12" → "dez/2027"
export const formatMonthName = (isoMonth: string) => {
  const [year, month] = isoMonth.split('-');
  return `${monthNames[Number(month) - 1]}/${year}`;
};

// "laudo, revisões e garantia"
const conjunction = new Intl.ListFormat('pt-BR', { type: 'conjunction' });
export const formatList = (items: string[]) => conjunction.format(items);

// Picks the singular or plural form: plural(1, 'veículo', 'veículos') → "1 veículo"
export const plural = (count: number, one: string, many: string) =>
  `${integer.format(count)} ${count === 1 ? one : many}`;

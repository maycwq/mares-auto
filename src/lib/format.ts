const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat('pt-BR');

// "R$ 148.990"
export const formatPrice = (value: number) => currency.format(value);

// "48.320 km"
export const formatKm = (value: number) => `${integer.format(value)} km`;

// "2026-12" → "12/2026"
export const formatMonthYear = (isoMonth: string) => {
  const [year, month] = isoMonth.split('-');
  return `${month}/${year}`;
};

// Picks the singular or plural form: plural(1, 'veículo', 'veículos') → "1 veículo"
export const plural = (count: number, one: string, many: string) =>
  `${integer.format(count)} ${count === 1 ? one : many}`;

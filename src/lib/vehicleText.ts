// How vehicle data reads in the interface. Copy follows the Figma file.
import { stores, type Color, type Evidence, type Fuel, type Transmission, type Vehicle } from '../data/vehicles';
import { formatList, formatMonthName, formatMonthYear, formatPrice, plural } from './format';

export const fuelLabel: Record<Fuel, string> = {
  flex: 'flex',
  gasoline: 'gasolina',
  diesel: 'diesel',
  hybrid: 'híbrido',
  electric: 'elétrico',
};

export const colorLabel: Record<Color, string> = {
  white: 'branco',
  silver: 'prata',
  gray: 'cinza',
  black: 'preto',
  red: 'vermelho',
  blue: 'azul',
  brown: 'marrom',
  green: 'verde',
  beige: 'bege',
};

export const transmissionLabel: Record<Transmission, string> = {
  automatic: 'automático',
  manual: 'manual',
};

// "Honda Civic Touring 2024"
export const vehicleTitle = (vehicle: Vehicle) => `${vehicle.make} ${vehicle.model} ${vehicle.trim} ${vehicle.year}`;

// "1.5 Turbo CVT · gasolina"
export const vehicleVersion = (vehicle: Vehicle) =>
  vehicle.fuel ? `${vehicle.version} · ${fuelLabel[vehicle.fuel]}` : vehicle.version;

export const storeName = (storeId: string) => stores.find((store) => store.id === storeId)?.name ?? '';

// "seminovo · Marés Centro": the store name loses its own separator inside the eyebrow.
export const vehicleEyebrow = (vehicle: Vehicle) => `seminovo · ${storeName(vehicle.storeId).replace(' · ', ' ')}`;

// "R$ 2.210 abaixo da FIPE de R$ 151.200". Undefined without a FIPE value.
export function fipeComparison(vehicle: Vehicle) {
  if (!vehicle.fipe) return undefined;
  const reference = formatPrice(vehicle.fipe.value);
  const difference = vehicle.price - vehicle.fipe.value;
  if (difference === 0) return `na média da FIPE de ${reference}`;
  return `${formatPrice(Math.abs(difference))} ${difference < 0 ? 'abaixo' : 'acima'} da FIPE de ${reference}`;
}

// Badge text for the evidence a listing card features, when there is one.
export function featuredEvidenceLabel(vehicle: Vehicle) {
  const evidence = vehicle.evidence.find((item) => item.type === vehicle.featuredEvidence);
  switch (evidence?.type) {
    case 'warranty':
      return `Garantia até ${formatMonthYear(evidence.until)}`;
    case 'inspection':
      return 'Laudo cautelar disponível';
    case 'serviceHistory':
      return 'Revisões registradas';
    default:
      return undefined;
  }
}

// --- evidence on the vehicle page --------------------------------------------------

export type ShownEvidence = Extract<Evidence, { type: 'inspection' | 'serviceHistory' | 'warranty' }>;

// The design always lists them in this order: laudo, revisões, garantia. Single owner and
// clean history stay out until they have copy of their own.
const evidenceOrder: ShownEvidence['type'][] = ['inspection', 'serviceHistory', 'warranty'];

export const shownEvidence = (vehicle: Vehicle) =>
  evidenceOrder
    .map((type) => vehicle.evidence.find((item): item is ShownEvidence => item.type === type))
    .filter((item) => item !== undefined);

// Vehicle / Trust Item copy.
export function trustItemText(evidence: ShownEvidence) {
  switch (evidence.type) {
    case 'inspection':
      return { title: 'Laudo cautelar aprovado', detail: 'documento disponível para consulta' };
    case 'serviceHistory':
      return {
        title: 'Revisões registradas',
        detail: plural(evidence.services, 'revisão informada no histórico', 'revisões informadas no histórico'),
      };
    case 'warranty':
      return { title: 'Garantia de fábrica', detail: `vigente até ${formatMonthName(evidence.until)}` };
  }
}

// "laudo, revisões e garantia disponíveis para este carro."
export function trustSummary(evidence: ShownEvidence[]) {
  const names = { inspection: 'laudo', serviceHistory: 'revisões', warranty: 'garantia' };
  const singular = evidence.length === 1 && evidence[0].type !== 'serviceHistory';
  return `${formatList(evidence.map((item) => names[item.type]))} ${singular ? 'disponível' : 'disponíveis'} para este carro.`;
}

// "Laudo cautelar aprovado · IPVA 2026 pago · revisões registradas." Only what the data
// says; undefined when it says nothing.
export function conditionSummary(vehicle: Vehicle) {
  const parts = [
    vehicle.evidence.some((item) => item.type === 'inspection') && 'laudo cautelar aprovado',
    vehicle.ipvaPaidYear && `IPVA ${vehicle.ipvaPaidYear} pago`,
    vehicle.evidence.some((item) => item.type === 'serviceHistory') && 'revisões registradas',
  ].filter((part) => typeof part === 'string');
  if (parts.length === 0) return undefined;
  const text = `${parts.join(' · ')}.`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

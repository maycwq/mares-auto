// How vehicle data reads in the interface. Copy follows the Figma file.
import { stores, type Fuel, type Transmission, type Vehicle } from '../data/vehicles';
import { formatMonthYear } from './format';

export const fuelLabel: Record<Fuel, string> = {
  flex: 'flex',
  gasoline: 'gasolina',
  diesel: 'diesel',
  hybrid: 'híbrido',
  electric: 'elétrico',
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

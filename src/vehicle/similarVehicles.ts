import type { Vehicle } from '../data/vehicles';

export const SIMILAR_COUNT = 3;

// "Ainda comparando?" stays inside the exploration that led here: the other results of
// the same search and filters, closest in price first. Ties keep the listing order.
export function similarVehicles(vehicle: Vehicle, results: Vehicle[], count = SIMILAR_COUNT) {
  return results
    .filter((other) => other.id !== vehicle.id)
    .map((other, order) => ({ other, order, distance: Math.abs(other.price - vehicle.price) }))
    .sort((a, b) => a.distance - b.distance || a.order - b.order)
    .slice(0, count)
    .map(({ other }) => other);
}

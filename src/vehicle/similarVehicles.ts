import type { Vehicle } from '../data/vehicles';

export const SIMILAR_COUNT = 3;

// "Ainda comparando?" stays inside the exploration that led here: the other results of
// the same search and filters, or the whole stock when the vehicle was opened directly.
// Inside that set, a few plain criteria in turn: the same model, then the same body
// type, then the closest price, then the closest year. Ties keep the listing order. When
// the set has fewer candidates, fewer are shown; it never leaves the person's filters.
export function similarVehicles(vehicle: Vehicle, candidates: Vehicle[], count = SIMILAR_COUNT) {
  const rank = (other: Vehicle) => [
    other.make === vehicle.make && other.model === vehicle.model ? 0 : 1,
    other.bodyType === vehicle.bodyType ? 0 : 1,
    Math.abs(other.price - vehicle.price),
    Math.abs(other.year - vehicle.year),
  ];

  return candidates
    .filter((other) => other.id !== vehicle.id)
    .map((other, order) => ({ other, key: [...rank(other), order] }))
    .sort((a, b) => {
      const index = a.key.findIndex((value, position) => value !== b.key[position]);
      return index === -1 ? 0 : a.key[index] - b.key[index];
    })
    .slice(0, count)
    .map(({ other }) => other);
}

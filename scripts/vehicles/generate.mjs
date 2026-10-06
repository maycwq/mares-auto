#!/usr/bin/env node
// Builds src/data/vehicles.json from the catalog, the curated photos, the FIPE snapshot
// and the photo credits in data/vehicles. Running it twice gives the same file.
//
// Usage: npm run data:generate

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fipeKey, planDataset, readJson, root } from './plan.mjs';

const { catalog, vehicles: plan } = planDataset();
const fipe = readJson('fipe.json', { entries: {} });
const credits = readJson('photo-credits.json', {});

const referenceYear = Number(catalog.referenceDate.slice(0, 4));

// Prices are synthetic. With a FIPE reference they stay around it; without one they come
// from an approximate new price, depreciated by age (curve fitted to the FIPE values in
// the snapshot) and adjusted by mileage.
function price(vehicle, fipeValue) {
  const age = Math.max(1, referenceYear - vehicle.year);
  const expectedKm = age * 13000;
  const mileageFactor =
    vehicle.km === undefined ? 1 : Math.min(1.08, Math.max(0.92, 1 + ((expectedKm - vehicle.km) / expectedKm) * 0.06));
  const base = fipeValue ?? vehicle.trim.priceNew * 0.88 * 0.93 ** age;
  const value = base * mileageFactor * vehicle.priceNoise;
  return vehicle.roundTo990 ? Math.round(value / 1000) * 1000 - 10 : Math.round(value / 500) * 500;
}

function media(file) {
  const credit = credits[file];
  if (!credit) throw new Error(`no credit for ${file}; run npm run data:photos first`);
  const { author, license, licenseUrl, source } = credit;
  return { src: `/media/vehicles/${credit.image}`, credit: { author, license, licenseUrl, source } };
}

const vehicles = plan.map((vehicle, index) => {
  const reference = vehicle.wantsFipe ? fipe.entries[fipeKey(vehicle.trim.fipe, vehicle.year)] : undefined;
  const record = {
    id: `v${String(index + 1).padStart(3, '0')}`,
    make: vehicle.model.make,
    model: vehicle.model.model,
    trim: vehicle.trim.trim,
    version: vehicle.trim.version,
    year: vehicle.year,
    bodyType: vehicle.model.bodyType,
    fuel: vehicle.fuel,
    transmission: vehicle.transmission,
    km: vehicle.km,
    color: vehicle.color,
    doors: vehicle.doors,
    price: price(vehicle, reference?.value),
    fipe: reference ? { value: reference.value, code: reference.code, referenceMonth: fipe.referenceMonth } : undefined,
    storeId: vehicle.storeId,
    listedAt: vehicle.listedAt,
    media: vehicle.photos.map(media),
    evidence: vehicle.evidence,
    featuredEvidence: vehicle.featuredEvidence,
    summaryEvidence: vehicle.summaryEvidence.length > 0 ? vehicle.summaryEvidence : undefined,
    ipvaPaidYear: vehicle.ipvaPaidYear,
    features: vehicle.features,
  };
  return record;
});

// Two vehicles keep a gallery entry whose file does not exist, so the per-image
// fallback (Gallery / Thumbnail · Missing) has real data to run against.
for (const vehicle of vehicles.filter((v) => v.media.length >= 2).slice(3, 5)) {
  vehicle.media.splice(1, 0, { src: '/media/vehicles/missing-on-purpose.jpg' });
}

const output = {
  referenceDate: catalog.referenceDate,
  stores: catalog.stores.map(({ id, name }) => ({ id, name })),
  vehicles,
};

writeFileSync(join(root, 'src/data/vehicles.json'), JSON.stringify(output, null, 2) + '\n');

const count = (predicate) => vehicles.filter(predicate).length;
console.log(
  `${vehicles.length} vehicles · ${count((v) => v.fipe)} with FIPE · ${count((v) => v.media.length === 0)} without photos`,
);

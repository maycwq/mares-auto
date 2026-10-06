// Deterministic plan for the development dataset. Everything that does not depend on
// external data (FIPE values, photo credits) is decided here, so fetch-fipe and
// generate see exactly the same vehicles.
//
// Each vehicle draws from its own random stream, seeded by `${model.id}#${index}`.
// Editing one model in the catalog doesn't reshuffle the others.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const dataDir = join(root, 'data/vehicles');

export function readJson(file, fallback) {
  try {
    return JSON.parse(readFileSync(join(dataDir, file), 'utf8'));
  } catch (error) {
    if (fallback !== undefined && error.code === 'ENOENT') return fallback;
    throw error;
  }
}

// --- random -------------------------------------------------------------------

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function random(seed) {
  let a = hash(seed);
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    chance: (p) => next() < p,
    between: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    pick: (items) => items[Math.floor(next() * items.length)],
    weighted: (entries) => {
      const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
      let roll = next() * total;
      for (const [value, weight] of entries) if ((roll -= weight) < 0) return value;
      return entries.at(-1)[0];
    },
  };
}

// --- dataset rules --------------------------------------------------------------

// Share of the stock without any photo, to exercise Vehicle / Image · Missing.
const MISSING_PHOTO_RATE = 0.045;
// FIPE only shows up on part of the ads, even when a reference exists.
const FIPE_RATE = 0.7;

const COLOR_WEIGHTS = [
  ['white', 30], ['silver', 20], ['gray', 20], ['black', 18], ['red', 6], ['blue', 4], ['brown', 1], ['green', 1],
];

const FEATURES = [
  ['Ar-condicionado', 'Direção elétrica', 'Vidros e travas elétricos', 'Central multimídia'],
  ['Câmera de ré', 'Sensor de estacionamento', 'Piloto automático', 'Rodas de liga leve'],
  ['Bancos de couro', 'Ar-condicionado digital', 'Carregador por indução', 'Faróis full LED'],
];

const pad = (n) => String(n).padStart(2, '0');

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function planVehicle(model, index, catalog, photoSets) {
  const r = random(`${model.id}#${index}`);
  const referenceYear = Number(catalog.referenceDate.slice(0, 4));
  const referenceMonth = catalog.referenceDate.slice(0, 7);

  // Both draws happen even when they end up unused, so editing photos.json never shifts
  // the rest of this vehicle's stream.
  const withoutPhotos = r.chance(MISSING_PHOTO_RATE);
  const randomColor = r.weighted(COLOR_WEIGHTS);
  const photoSet = withoutPhotos ? undefined : photoSets[index];
  const color = photoSet?.color ?? randomColor;

  const trim = r.pick(model.trims);
  // A photo set can narrow the years when the pictured generation only covers part of
  // the model's range. Newer years are more common in the stock.
  const [firstYear, lastYear] = photoSet?.years ?? model.years;
  const year = Math.min(lastYear, firstYear + Math.floor(Math.sqrt(r.next()) * (lastYear - firstYear + 1)));

  const age = Math.max(0.4, referenceYear + 0.75 - year - r.next());
  let km = age * r.between(7000, 19000);
  if (r.chance(0.08)) km *= 0.35;
  else if (r.chance(0.06)) km *= 1.6;
  km = Math.round(km / 10) * 10;

  const evidence = [];
  const warrantyUntil = `${year + 3}-${pad(r.int(1, 12))}`;
  if (warrantyUntil > referenceMonth && r.chance(0.85)) {
    evidence.push({ type: 'warranty', kind: 'factory', until: warrantyUntil });
  }
  if (r.chance(0.42)) evidence.push({ type: 'inspection', result: 'approved' });
  if (age >= 1 && r.chance(0.5)) {
    evidence.push({ type: 'serviceHistory', services: Math.max(1, Math.round(age * r.between(0.7, 1.05))) });
  }
  if (r.chance(age < 3 ? 0.4 : 0.2)) evidence.push({ type: 'singleOwner' });
  // No auction, total loss or theft record.
  if (r.chance(0.3)) evidence.push({ type: 'cleanHistory' });
  const featuredEvidence = evidence.length > 0 && r.chance(0.8) ? r.pick(evidence).type : undefined;

  const features = r.chance(0.1)
    ? undefined
    : FEATURES.slice(0, trim.tier)
        .flat()
        .filter(() => r.chance(0.85))
        .concat(/4x4|AWD/.test(trim.version) ? ['Tração 4x4'] : []);

  return {
    model,
    trim,
    year,
    km: r.chance(0.006) ? undefined : km,
    fuel: r.chance(0.008) ? undefined : trim.fuel,
    transmission: r.chance(0.008) ? undefined : trim.transmission,
    color: r.chance(0.04) ? undefined : color,
    doors: r.chance(0.05) ? undefined : trim.doors ?? model.doors,
    storeId: r.weighted(catalog.stores.map((store) => [store.id, store.weight])),
    listedAt: addDays(catalog.referenceDate, -Math.floor(r.next() ** 1.4 * 150)),
    photos: photoSet?.files ?? [],
    evidence,
    featuredEvidence,
    ipvaPaidYear: r.chance(0.65) ? referenceYear : undefined,
    features: features?.length ? features : undefined,
    wantsFipe: Boolean(model.fipeBrand && trim.fipe) && r.chance(FIPE_RATE),
    priceNoise: r.between(0.95, 1.05),
    roundTo990: r.chance(0.6),
  };
}

export function planDataset() {
  const catalog = readJson('catalog.json');
  const photos = readJson('photos.json', {});
  const vehicles = catalog.models.flatMap((model) =>
    Array.from({ length: model.count }, (_, index) => planVehicle(model, index, catalog, photos[model.id] ?? [])),
  );
  return { catalog, vehicles };
}

export const fipeKey = (name, year) => `${name.replace(/\s+/g, ' ').trim()}|${year}`;

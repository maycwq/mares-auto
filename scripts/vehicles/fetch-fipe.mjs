#!/usr/bin/env node
// Fetches FIPE reference values for the (version, year) pairs the dataset plan asks for
// and stores them in data/vehicles/fipe.json. Values come from the public FIPE table
// mirror at parallelum.com.br (the official site has no public API). Nothing here is
// estimated: a pair without a published value is stored as null and the ad shows no FIPE.
//
// Usage: npm run data:fipe          (only fetches pairs missing from the snapshot)
//        npm run data:fipe -- --refresh

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dataDir, fipeKey, planDataset, readJson } from './plan.mjs';

const API = 'https://parallelum.com.br/fipe/api/v1/carros';
const refresh = process.argv.includes('--refresh');

async function get(path) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(API + path);
    if (response.ok) return response.json();
    if (attempt === 3) throw new Error(`${response.status} ${API + path}`);
    await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
  }
}

const normalize = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const parseValue = (text) => Number(text.replace(/[^\d,]/g, '').replace(',', '.'));

const { vehicles } = planDataset();
const snapshot = refresh ? { entries: {} } : readJson('fipe.json', { entries: {} });

const needed = new Map();
for (const vehicle of vehicles.filter((v) => v.wantsFipe)) {
  needed.set(fipeKey(vehicle.trim.fipe, vehicle.year), { brand: vehicle.model.fipeBrand, name: vehicle.trim.fipe, year: vehicle.year });
}
const pairs = new Map([...needed].filter(([key]) => !(key in snapshot.entries)));
console.log(`${pairs.size} pairs to fetch`);

const modelLists = new Map();
const yearLists = new Map();

for (const [key, { brand, name, year }] of pairs) {
  if (!modelLists.has(brand)) modelLists.set(brand, (await get(`/marcas/${brand}/modelos`)).modelos);
  const model = modelLists.get(brand).find((m) => normalize(m.nome) === normalize(name));
  if (!model) throw new Error(`FIPE model not found: ${name}`);

  const yearsPath = `/marcas/${brand}/modelos/${model.codigo}/anos`;
  if (!yearLists.has(yearsPath)) yearLists.set(yearsPath, await get(yearsPath));
  const yearEntry = yearLists.get(yearsPath).find((y) => y.codigo.startsWith(`${year}-`));
  if (!yearEntry) {
    snapshot.entries[key] = null;
    console.log('no value', key);
    continue;
  }

  const result = await get(`${yearsPath}/${yearEntry.codigo}`);
  snapshot.entries[key] = { code: result.CodigoFipe, value: parseValue(result.Valor) };
  snapshot.referenceMonth = result.MesReferencia;
  console.log(key, result.Valor);
}

snapshot.source = 'Tabela FIPE, via parallelum.com.br';
// Pairs the plan no longer uses are dropped, so the snapshot always matches the dataset.
snapshot.entries = Object.fromEntries(
  Object.entries(snapshot.entries)
    .filter(([key]) => needed.has(key))
    .sort(([a], [b]) => a.localeCompare(b)),
);
writeFileSync(join(dataDir, 'fipe.json'), JSON.stringify(snapshot, null, 2) + '\n');

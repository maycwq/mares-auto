#!/usr/bin/env node
// Downloads the curated Wikimedia Commons photos used by the dataset into
// public/media/vehicles, re-encoded as JPEG at 960 px wide so the repository stays
// light, and records author, license and source for each one in
// data/vehicles/photo-credits.json. Only free licenses that allow reuse are accepted
// (public domain, CC0, CC BY, CC BY-SA); anything else stops the script.
//
// Usage: npm run data:photos

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { dataDir, planDataset, readJson, root } from './plan.mjs';

const USER_AGENT = 'mares-auto-dev-dataset (https://github.com/maycwq/mares-auto)';
const WIDTH = 960;
const imageDir = join(root, 'public/media/vehicles');
const ACCEPTED = /^(cc0|public domain|pd|cc by(-sa)? \d(\.\d)?)/i;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Wikimedia rate-limits aggressively; back off on 429 instead of hammering it.
async function request(url, acceptedFailures = []) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (response.ok) return response;
    if (acceptedFailures.includes(response.status)) return null;
    if (attempt === 7) throw new Error(`${response.status} ${url}`);
    await wait(Math.min(90_000, 5000 * 2 ** attempt));
  }
}

const decode = (text) =>
  text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

function field(page, className) {
  const match = page.match(new RegExp(`class="${className}"[^>]*>(.*?)</span>`));
  return match ? decode(match[1]) : '';
}

function cell(page, id) {
  const match = page.match(new RegExp(`id="${id}"[^>]*>.*?</td>\\s*<td[^>]*>(.*?)</td>`, 's'));
  return match ? decode(match[1]) : '';
}

const slug = (file) =>
  file
    .replace(/^File:/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\.(jpe?g|png)$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '.jpg';

const { vehicles } = planDataset();
const files = [...new Set(vehicles.flatMap((vehicle) => vehicle.photos))];
const credits = readJson('photo-credits.json', {});
mkdirSync(imageDir, { recursive: true });

// Author cells often carry a talk-page signature ("Name ( talk ) 22:29, 19 February
// 2017 (UTC)"); only the name is kept.
const cleanAuthor = (author) =>
  author
    .replace(/\(\s*talk\s*\)/gi, '')
    .replace(/\d{1,2}:\d{2}, \d{1,2} \w+ \d{4} \(UTC\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function saveCredits() {
  for (const credit of Object.values(credits)) credit.author = cleanAuthor(credit.author);
  const sorted = Object.fromEntries(Object.entries(credits).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(join(dataDir, 'photo-credits.json'), JSON.stringify(sorted, null, 2) + '\n');
}

for (const file of files) {
  const image = slug(file);
  if (credits[file] && existsSync(join(imageDir, image))) continue;

  const pageUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(file.replace(/ /g, '_'))}`;
  const page = (await (await request(pageUrl)).text()).replaceAll('&#95;', '_');

  const license = field(page, 'licensetpl_short');
  if (!ACCEPTED.test(license) || /\b(nc|nd)\b/i.test(license)) throw new Error(`${file}: license not accepted (${license})`);
  const author = field(page, 'licensetpl_attr') || cell(page, 'fileinfotpl_aut') || 'unknown';

  const original = page.match(/href="(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/(\w)\/(\w\w)\/([^"?]+))/);
  if (!original) throw new Error(`${file}: original file URL not found`);
  const [, originalUrl, a, ab, name] = original;
  // Thumbnail at a fixed width; Commons answers 400 when the original is narrower than
  // that, and then the original is used as is.
  const thumbUrl = `https://upload.wikimedia.org/wikipedia/commons/thumb/${a}/${ab}/${name}/${WIDTH}px-${name}`;
  const response = (await request(thumbUrl, [400])) ?? (await request(originalUrl));
  const bytes = await sharp(Buffer.from(await response.arrayBuffer()))
    .rotate()
    .resize({ width: WIDTH, withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  writeFileSync(join(imageDir, image), bytes);
  credits[file] = { image, author, license, licenseUrl: field(page, 'licensetpl_link'), source: pageUrl };
  // Saved after every download so an interrupted run picks up where it stopped.
  saveCredits();
  console.log(image, `${Math.round(bytes.length / 1024)} KB`, license, '·', author);
  await wait(1500);
}

saveCredits();
console.log(`${files.length} photos`);

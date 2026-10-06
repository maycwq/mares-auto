# vehicle dataset

180 vehicles for development, so search, filters, sorting, counts, chips, empty states and loading can run on stock that actually varies. These are **not Marés ads and not real listings**. Makes, models and versions are real; prices, mileage, stock, stores and evidence are synthetic.

The app reads the generated file, `src/data/vehicles.json`, through `src/data/vehicles.ts`. Everything in this folder is the source for that file.

## files

| file | what it is | edited by |
| --- | --- | --- |
| `catalog.json` | makes, models, versions, year ranges, how many of each, stores | hand |
| `photos.json` | curated Wikimedia Commons photos per model, one entry per vehicle | hand |
| `fipe.json` | FIPE reference values for the version/year pairs in the plan | `npm run data:fipe` |
| `photo-credits.json` | author, license and source of every downloaded photo | `npm run data:photos` |

Photos live in `public/media/vehicles`.

## regenerating

```sh
npm run data:fipe       # fetch FIPE values the plan needs and aren't in fipe.json yet
npm run data:photos     # download photos listed in photos.json and record credits
npm run data:generate   # write src/data/vehicles.json
```

`data:generate` works offline and gives the same output every time. Each vehicle draws from its own random stream seeded by model and position (`chevrolet-onix#2`), so changing one model in the catalog does not reshuffle the others. Behind an HTTP proxy, Node's `fetch` needs `NODE_USE_ENV_PROXY=1` for the two fetch scripts.

## how the data behaves

- **Required:** make, model, trim, version, year, body type, price, store, listing date.
- **Sometimes missing on purpose:** km, fuel, transmission, color, doors, features, IPVA. A few records leave these out so cards and the vehicle page can be checked without them.
- **Evidence** (warranty, inspection report, service history, single owner, clean history) is drawn per vehicle with different rates, and some vehicles have none. Factory warranty only appears while it would still be valid at the reference date (2026-10-01). `featuredEvidence` is the one evidence a listing card shows (and the badge of the vehicle page summary), and `summaryEvidence` is what the summary lists below it, in order. Both are chosen per vehicle in the data, not ranked by the UI, and only among warranty, inspection and service history, the types with copy in the design. `summaryEvidence` draws from a separate random stream, so adding it changed no other field. Single owner and clean history stay in the data but aren't shown until they get content and presentation of their own.
- **FIPE** comes from the FIPE table through the public mirror at parallelum.com.br, with its code and reference month. It's never estimated: when a version/year has no published value, or the vehicle didn't draw one (about 30% don't), the field is absent. Prices stay around FIPE when there is one; otherwise they come from an approximate new price, depreciated by age and adjusted by mileage.
- **Photos** are real cars of the same model, picked by hand so each gallery shows one car (front, rear, sometimes interior). Galleries go from 1 to 8 photos, most have 1 or 2. Seven vehicles have no photo at all, and two galleries contain an entry pointing to `missing-on-purpose.jpg`, which doesn't exist, to exercise the per-image fallback. The photo often isn't the exact trim, year or market, and a few show the same car sold under another name (Toyota Fortuner for the SW4, Nissan Navara for the Frontier, Dacia Duster for the Duster). A photo set can narrow a vehicle's years when it only fits one generation, and its color becomes the vehicle's color.
- **Fuel** includes diesel and electric, and body types include minivan and coupe, so some filter combinations come back empty.

## photos and licenses

Every photo comes from Wikimedia Commons under a license that allows reuse: public domain, CC0, CC BY or CC BY-SA. `data:photos` downloads each one once and re-encodes it as a 960 px wide JPEG. `photo-credits.json` and the `credit` field on each media item keep author, license and source. The interface doesn't show these credits: this is a private, non-commercial exercise. If the project is ever published, CC BY and CC BY-SA require the credit wherever the photo appears, and that needs a solution in the UI first. No photo comes from dealer sites, ads or image search.

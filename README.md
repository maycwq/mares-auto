# marés auto

A responsive used-car discovery and evaluation experience for **Marés Automóveis**, a fictional dealership identity.

The product connects browsing, refinement, vehicle evaluation, value and risk signals, and commercial next steps without dropping context along the way.

The experience originally started as a product design case and is now being developed here as a working product. From this point on, the repository is about implementing the final experience rather than documenting the exercise that started it.

> **status:** the listing and the vehicle page work on desktop and mobile over a local dataset: search, filters, sorting, load more, then gallery, price against FIPE, evidence, details, similar vehicles and the way back to the same results. The next step only has a placeholder page so far.

## product baseline

The current product and design decisions are the baseline for implementation, not a loose set of suggestions.

A few principles matter enough to keep explicit here:

- **Listing and vehicle detail are part of the same exploration.** Opening a vehicle does not end the search.
- **Returning to the listing preserves context.** Search, filters, and sorting should still be there instead of being rebuilt from scratch.
- **Filters are for refinement, not for turning discovery into a form.** The experience should stay easy to browse before it becomes precise.
- **Vehicles need to be distinguishable by more than image, price, year, and mileage.** Condition, history, provenance, inspection, warranty, and similar evidence appear when real data supports them.
- **Price is not the only evaluation axis.** Value and risk should be understandable together rather than scattered across unrelated parts of the experience.
- **Commercial next steps continue the evaluation.** Contact, visit, trade-in, and financing should inherit the vehicle the person was already considering.
- **Vehicle + intent remain part of the context.** Advancing should not force someone to explain which car they were evaluating or what they wanted to do with it.
- **Desktop and mobile are one responsive product.** They may reorganize under space constraints, but they should not drift into independent experiences.

These principles should survive implementation unless there is a concrete product or technical reason to change them.

## visual system

The implementation starts from an existing Figma visual system with foundations, tokens, reusable components, component states, responsive behavior, and handoff notes.

The visual language uses a few clear roles:

- navy as the main structural anchor;
- blue for action and interactive state;
- white for primary content surfaces;
- neutral tones as the canvas;
- green for positive evidence and success.

The Marés identity is a graphic asset. The wordmark and signatures should be used from the source artwork rather than reconstructed as text in code.

Reusable UI should follow the same source-of-truth logic as the design system: one component for one reusable role, with states and variations handled intentionally instead of creating near-duplicate implementations.

## responsive reference

These are the composition references used in the design:

| | desktop | mobile |
| --- | ---: | ---: |
| reference width | 1440 px | 390 px |
| columns | 12 | 4 |
| gutter | 24 px | 16 px |
| outer margin | 96 px | 16 px |

They are **reference layouts, not the only supported viewport sizes**. The implementation should behave responsively between and beyond them instead of hardcoding the product to two fixed canvases.

## design source

The Figma file is the visual and behavioral source for the current experience:

[Marés Automóveis · design source](https://www.figma.com/design/PORVUjlL3WfuGI7kxW9JgJ/AutoForce-%7C-desafio-de-Product-Design?node-id=214-116)

Use it for:

- final desktop and mobile interfaces;
- foundations and design tokens;
- reusable components and their states;
- responsive composition;
- interaction and implementation details documented in the handoff notes.

Screenshots are useful for visual comparison, but they are not the specification on their own.

## implementation baseline

Implementation should move the product forward without casually redesigning it on every pass.

The working order is simple:

1. start from the current product and design decisions;
2. preserve what is already intentional;
3. solve implementation constraints without silently changing behavior;
4. change product behavior only when there is a concrete reason;
5. reflect meaningful changes back into the relevant source of truth.

This is especially important while the codebase is still small: technical decisions can evolve quickly without requiring the product itself to be reinterpreted each time.

## development

The app is a static single-page build: **Vite + React + TypeScript**, styled with plain CSS (custom properties for tokens, CSS Modules for components), with **Vitest** for unit tests. There is no routing library, state library or form library; each one comes in when a feature actually needs it, and gets documented here when it does.

Requires Node 20.19+ or 22.12+.

```sh
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
npm run typecheck  # TypeScript only
npm test           # unit tests (Vitest)
```

The vehicle dataset has its own commands; see [data/vehicles/README.md](data/vehicles/README.md).

### structure

```
src/
  main.tsx                  entry: fonts and global styles
  App.tsx
  styles/
    tokens.css              Figma variables and text styles as CSS custom properties
    layout.css              grid and container
    base.css                minimal reset and page defaults
  components/               one folder per visual system component (Button, Select,
                            Vehicle / Card…), named after it
  listing/                  the listing page, its filters and its state
  vehicle/                  the vehicle page, its gallery and similar vehicles
  nextStep/                 the next step (a placeholder for now)
  lib/                      router, formatting, small hooks
  assets/
    brand/                  Marés lockups, extracted from the Figma file
    icons/                  system icons, extracted from the Figma file
  data/
    vehicles.ts             types and access to the development dataset
    vehicles.json           generated, don't edit by hand
data/vehicles/              sources for the dataset (catalog, photos, FIPE, credits)
public/media/vehicles/      vehicle photos from Wikimedia Commons
scripts/
  extract-figma-assets.mjs  regenerates src/assets from a .fig export
  vehicles/                 dataset generation
```

### data

There is no backend yet. The app reads a local dataset of 180 vehicles generated from structured sources with a fixed seed, so filters, sorting and counts run on stock that actually varies and stays the same between runs. Makes, models and versions are real; prices, mileage, stock and evidence are synthetic, and FIPE values are real or absent. Photos come from Wikimedia Commons under free licenses, with author and license kept per photo. How it's built and how to change it is in [data/vehicles/README.md](data/vehicles/README.md).

### routing and state

`src/lib/router.tsx` is a small history router: two kinds of pages don't need a library. Going to a new page starts at the top; going back returns to where the page was scrolled.

The listing keeps its whole exploration state in the URL: search text, filters, sort and how many results are showing (`/?busca=civic&preco=ate-150000&cambio=automatico&mostrar=24`). Fields, chips, counts and cards all read that one state, so opening a vehicle and coming back, or reloading, finds the same exploration. Refining the listing replaces the current history entry instead of adding one, so "back" leaves the listing instead of undoing filters. The mobile sheet and the desktop "mais filtros" drawer edit a draft that only becomes state when applied.

Results are computed locally and shown after a short delay (`useListing.ts`), so the loading state exists before there's a backend. A result set that was already shown comes back immediately.

A vehicle page (`/veiculos/v014`) knows which exploration it came from through history state (`src/vehicle/exploration.ts`): the listing's query string and how many pages away it is. "Voltar para N veículos" goes back that many entries, so the listing returns exactly as it was, scroll included, even after opening a few similar vehicles. Opened directly, with no listing behind it, the link offers the whole stock instead ("Ver todos os 180 veículos") and goes to `/`. The similar vehicles come from that same exploration (or the whole stock), ranked by a few plain criteria in turn: same model, same body type, closest price, closest year (`similarVehicles.ts`).

The next step is a page of its own, `/veiculos/v014/proximo-passo`, with the intent in the query when a shortcut picked one (`?intencao=troca`, `?intencao=financiamento`). As a route, it keeps the vehicle and intent on reload and works with the browser's back button.

### tokens

`src/styles/tokens.css` mirrors the Figma variables one to one. Names follow the variable path, so `color/foreground/primary` becomes `--color-foreground-primary` and `space/4` becomes `--space-4`. Primitives (`--brand-600`, `--neutral-900`…) only feed the semantic aliases; components use the semantic tokens.

Text styles are a `font` shorthand plus a tracking value:

```css
font: var(--type-heading-md);
letter-spacing: var(--type-heading-md-tracking);
```

`color/icon` keeps its three Figma modes. An icon inherits the mode of its context, which can be switched with `data-icon-mode="inverse"` or `"muted"` on any element, or with the `mode` prop of `Icon`.

### layout

`layout.css` provides `.container` and `.grid`. At 390 px they match the mobile reference (4 columns, 16 gutter, 16 margin) and at 1440 px the desktop one (12 columns, 24 gutter, 96 margin). In between, the outer margin grows linearly from 16 to 96 px, and columns and gutter switch at 1024 px. Above 1440 the content stays 1248 px wide and centered. Composition changes for specific screens, like the filter rail becoming a sheet, are decided per feature.

### brand and icons

The SVGs in `src/assets` are generated from the vector geometry stored in the Figma file. Nothing is redrawn: brand paths are the exact fill geometry of the `Brand / Marés` variants (including the counter of the "é", which the source paints in the opposite tone instead of leaving open), and icons are the original vector networks with their stroke settings. Don't edit them by hand. When the source changes, export the file from Figma (File → Save local copy) and run:

```sh
npm run assets:extract -- path/to/file.fig
```

`Brand` renders a lockup (`signature` or `wordmark`) in a tone (`dark` for light surfaces, `light` for navy) and keeps the asset's proportion; size it by height in the consumer's CSS. `Brand / Marés / Compact / Dark` is extracted but has no component until a screen uses it.

`Icon` renders one of the nine system icons at 20 px, colored by `color/icon`. Icons are decorative; the control around them carries the accessible name.

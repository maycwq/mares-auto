# product decisions

Decisions taken during implementation that complement the Figma file. The design and its handoff notes stay the main source; this file covers what they leave open or contradict, so it doesn't have to be settled again in every session.

When one of the open points below is decided, move it to the decided list. When a decision changes, edit it here instead of leaving the old version around.

## decided

### filters

- **Car type is a primary filter on mobile too.** The M2 sheet shows it under "mais filtros", but the rail, the C01 decision and the handoff note all treat it as primary. The sheet layout is the inconsistency, not the filter architecture.
- **Filter options come from the stock.** The 180-vehicle dataset sets the cuts, so each one returns a different set and some combinations come back empty:
  - price: "Até R$ 60 mil" to "Até R$ 200 mil", plus "Acima de R$ 200 mil";
  - year: "A partir de 2025" to "A partir de 2021", plus "Até 2020";
  - mileage: "Até 10.000 km" to "Até 100.000 km".
- **Fuel includes Diesel**, because a relevant part of the stock uses it.
- **Marca/modelo stays one list, grouped by make.** Each make comes first as a whole ("Volkswagen · todos os modelos"), then its models. The chip names what was picked: "Volkswagen" or "Volkswagen Polo".
- **Sort options:** "Mais recentes", "Menor preço", "Maior preço", "Menor quilometragem", "Mais novos".
- **Selects use the native menu.** The design only has the `Input / Select` trigger. On mobile, "Ordenar" opens the native picker for the same sort state.

### copy across breakpoints

- **Mobile can use shorter copy when space requires it.** Meaning and product state have to match; the literal text doesn't.
- **The rail keeps "Marca/modelo" and "Km"**, with full accessible names ("Marca e modelo", "Quilometragem").
- **With filters applied, mobile has to say that a refinement is active.** "Todos" must not suggest there's no filter.
- **Only structured filters change the titles.** With filters, the results title is "Seminovos com estes filtros" on desktop and mobile alike. Search text narrows the results and their count, but it isn't a filter, and the design has no separate copy for it, so the initial titles stay ("Todos os seminovos", "Todos").
- **The big number in the hero is always the current result set.** Search, filters and both narrow it, and with no refinement it's the whole stock. Only the words around it follow the state, as in D1, D2 and M3:
  - no refinement: "180 veículos disponíveis";
  - with filters (with or without search): "N veículos com estes filtros" on desktop, "N veículos encontrados" on mobile;
  - search only: "N veículos encontrados" on both.
- **Composition can differ between breakpoints, the vehicle's information can't.** Desktop and mobile may place things differently (evidence is split differently between the summary and the trust section, the active filters sit next to "voltar" on desktop only), but every piece of data about the vehicle is available on both, and nothing is repeated just for symmetry.

### load more

- **"Ver mais veículos" while the action is still incremental.**
- **"Ver os N veículos" only when the click reveals everything that's left.** N is what it reveals, not the total of results. With one left, it's "Ver 1 veículo".

### price and FIPE

- **The first relevant mention on a page says "Tabela FIPE"**, since not everyone knows the acronym. Once it's established, small spaces can say just "FIPE". It's never replaced by something generic like "preço médio de mercado": it's a specific reference.
- **On the vehicle page:** "Tabela FIPE: R$ 151.200" under the price, then the comparison: **"R$ X abaixo da Tabela FIPE"**, **"R$ X acima da Tabela FIPE"**, or **"no valor da Tabela FIPE"** when they match exactly. Not "na média": it's a comparison with one specific value.
- **A short explanation sits next to that first mention**, behind an info button: "referência de preço médio de veículos no Brasil". It opens on click, tap or keyboard, never on hover alone, and doesn't take space when closed.
- **Same content on every breakpoint.** If a vehicle has FIPE, the reference, the comparison and the explanation show on desktop and mobile.
- The lines only disappear when there is no FIPE value.

### evidence

- **Only evidence with copy in the design is shown:** "Garantia até…", "Laudo cautelar aprovado" and "Revisões registradas".
- **Single owner and clean history stay in the data only.** Clean history means no auction, total loss or theft record. Neither appears in the interface until it has content and presentation of its own.

### typography

- **Off-scale sizes in the screens map to the nearest type token.** The screens use sizes outside the type scale (11, 13, 15, 17, 18, 22, 52 px and a 135% line height). The mapping holds as long as the visual hierarchy of the screen doesn't change noticeably.

### components

- **Next step panels (N1–N7):** reuse `Contact / Panel` and `CTA / Group` only where role and behavior really match the component. If the match is only visual, keep the composition without forcing a component.
- **Explanations go behind an info button (a toggletip).** The visual system has no tooltip or popover, so it's built from its tokens and `Icon / Info`. Used for the Tabela FIPE for now.
- **The skeleton gets a subtle shimmer or pulse.** The design leaves motion undefined. It keeps the real `Vehicle / Card Skeleton` structure, causes no layout shift when data arrives, and becomes static or nearly static under `prefers-reduced-motion`.

### commercial shortcuts

- **"Usar seu carro na troca" and "Entender o financiamento" keep the current vehicle.** They open the next step with the matching intent already selected (`?intencao=troca`, `?intencao=financiamento`). They don't start a separate journey.
- **"Escolher próximo passo" arrives without an intent:** N1 with the four options and the button disabled until one is chosen.

### photos

- **Photo credits are kept in the data but not shown in the interface.** The project is a private, non-commercial exercise. If it's ever published, CC BY and CC BY-SA photos need visible attribution first.

### not reproduced

- **Two artifacts in the file are ignored:** the shifted header navigation in D3 and the centered radio labels in N5.

### vehicle page

- **"Voltar para N veículos" only when there is a listing to go back to**, and it restores that listing exactly, scroll included. Opened directly, the person was never there, so the same link says **"Ver todos os N veículos"** (N is the whole stock) and goes to the listing without filters. "Ainda comparando?" then has no text, since there are no results to go back to.
- **Similar vehicles stay in the exploration that led to the vehicle:** the other results of the same search and filters, or the whole stock when it was opened directly. Inside that set: same model first, then same body type, then the closest price, then the closest year. Three on desktop, two on narrow screens (V1, V2). With fewer candidates, fewer are shown; the person's filters are never dropped to fill the row.
- **"Seus filtros continuam aplicados." only appears when filters are applied**, and "ou veja opções semelhantes" only when there are similar vehicles.
- **What gets featured is decided in the data, not by the interface.** `featuredEvidence` is the listing card's badge and the badge of the vehicle summary. `summaryEvidence` lists, in order, what the summary shows below it: the first one highlighted, the second only in the desktop summary. Both are chosen when the dataset is generated; the UI never ranks evidence by its position.
- **Evidence is split, not dropped.** On narrow screens the summary keeps only the highlighted item, and "O que já dá para conferir" lists everything else; on desktop it lists everything (V1 vs V2). Both breakpoints carry the same evidence. With no evidence, the section goes away.
- **The condition text only says what the data supports:** laudo, IPVA and revisões. "Sem pendências informadas no anúncio" isn't shown, because the dataset has nothing that backs it. The text is the same on every breakpoint and wraps.
- **"Itens e conforto" lists the vehicle's items separated by "·".**
- **Thumbnails stay in one row and scroll sideways** when there are more photos than fit. Every photo stays reachable and the row keeps the design's geometry.
- **One photo: no thumbnails**, since there's nothing to choose; the counter stays ("1 / 1"). **No photo:** "foto indisponível", no counter and no overlay.
- **The gallery overlay is for narrow screens only (V3).** Tapping the photo opens it. On desktop the photo is already large and the design shows no overlay.
- **The next step is its own page:** `/veiculos/:id/proximo-passo`, with the intent in the query when a shortcut picked one. It keeps vehicle and intent on reload and works with the browser's back button.
- **The footer appears on the desktop vehicle page only**, as in V1.

## still open

Each one gets decided when the feature that needs it is built, starting from the simplest option that keeps the specified product.

- **Removing a filter from its chip.** It isn't specified, and it shouldn't be added just because other products do it.
- **Contact, visit and trade-in intents.** Financing is the only detailed flow. The other three keep vehicle + intent, and no form is invented for them.
- **"Lojas" and "Atendimento" in the header**, and a footer on mobile screens.

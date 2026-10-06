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
- **Composition can differ between breakpoints, the vehicle's information can't.** Desktop and mobile may place things differently (evidence is split differently between the summary and the trust section), but every piece of data about the vehicle is available on both, and nothing is repeated just for symmetry.
- **The active filters next to "voltar" are desktop only.** Same content doesn't mean every contextual element at every width; what can't change is the exploration itself. On mobile the filters stay applied, the way back restores the same listing, and "Seus filtros continuam aplicados." says so.

### load more

- **"Ver mais veículos" while the action is still incremental.**
- **"Ver os N veículos" only when the click reveals everything that's left.** N is what it reveals, not the total of results. With one left, it's "Ver 1 veículo".

### price and FIPE

- **The first relevant mention on a page says "Tabela FIPE"**, since not everyone knows the acronym. Once it's established, small spaces can say just "FIPE". It's never replaced by something generic like "preço médio de mercado": it's a specific reference.
- **Listing cards say "Tabela FIPE · R$ X".** A card can be where someone first meets the reference. No info button on cards; the explanation lives on the vehicle page, where there's room for it.
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
  - The N1–N7 panels stay a composition. `Contact / Panel` has no place for the vehicle context above the eyebrow, and its title and padding are smaller; using it would mean new variants nobody asked for.
  - The financing form's two actions are a `CTA / Group` (stacked): it's exactly its role.
- **Field errors use the full `Feedback / Inline Error`** (icon and message) under `Input / Text` in its error state, for every field. N3 draws the CPF error without the icon; the root component of the visual system wins over that inconsistency. Behavior is the same for all fields: the error is tied to its field, the message says what to fix, focus goes to the first error on submit, and fixing a field clears only its own error.
- **`Accordion / Disclosure` surfaces are inverted from the visual system.** In the component, Default is `surface/default` (white) and Hover is `surface/subtle`, which made each item look like a separate card on the section. Here the resting state is `surface/subtle`, the same as the section, so only the dividers give structure, and hover lifts the item to `surface/default`. Focus keeps the resting surface with the focus ring. Spacing, type, chevron and behavior are the component's.
- **Explanations go behind an info button (a toggletip).** The visual system has no tooltip or popover, so it's built from its tokens and `Icon / Info`. Used for the Tabela FIPE for now.
- **The skeleton is static and rare.** It keeps the real `Vehicle / Card Skeleton` structure, but it only appears when there is nothing on screen yet and the first results really take more than 160 ms. It never covers a set that's already showing, and it has no shimmer or pulse (this replaces the earlier shimmer decision; see motion).

### next step

- **The page around the panels:** the site header, then the panel, at most 720px wide and centered. On narrow screens the panel spans the screen, like the 390px frames.
- **N1 has no "Voltar ao veículo".** It follows the design; the browser's back button returns to the vehicle as it was. Reopen this only if people reach the next step without history behind it, or tests show trouble getting back.
- **The enabled button in N1 says "Continuar"**, the primary action of `CTA / Group`. Disabled, it keeps "Escolha uma opção".
- **"Tirar uma dúvida", "Agendar visita" and "Avaliar meu carro" stop at a short state.** "Continuar" opens it with vehicle and intent kept. It says only "Essa opção ainda não está disponível por aqui" (a title, so no final period), with "Voltar e escolher outra opção" as its primary action. No sentence explaining the prototype's limits, no form and no new flow.
- **`Vehicle / Next-step Context` shows the chosen intent as content, not as variants.** Anatomy, hierarchy and behavior stay the same; only the intent value changes: the design's "simulação de financiamento", or exactly the N1 label for the others ("Agendar visita").
- **Error messages, specific and actionable like the CPF one:** "Informe seu nome." and "Confira o WhatsApp e digite o DDD e o número." The CPF is checked by its check digits too, not only by length; WhatsApp needs the area code (10 or 11 digits).
- **The request is simulated** until there's a backend: one call with form, vehicle and intent. Nothing is stored. The confirmation stays after a reload or when coming back through history, and the form can't be sent twice.

### motion

The direction comes from the motion audit and its matrix (interactions L01–H02, QA Q01–Q18). Motion only makes a change readable; state, focus, validation and navigation never wait for it. The rules that shape the code are in the README ("motion"); these are the product decisions behind them.

- **No artificial waits.** The listing used to show results after a simulated 350 ms delay, so the skeleton covered every refinement. The data is local, so a new result set now arrives in the same frame as the filter, search or sort that asked for it. Waits and failures that the local data never produces can be simulated in development only.
- **Requested and published are two states.** Controls and the URL follow what was asked at once; titles, chips, both counts and the cards follow the set actually on screen, and change together. A slow set shows "atualizando veículos" after 160 ms; one that fails keeps the previous set and says "não foi possível atualizar os veículos". Only the latest request can publish.
- **Search asks once typing pauses for 160 ms.** Enter, the clear button and an empty field ask right away.
- **Motion runs on in-app moves only.** Back/forward, a reload or a link opened directly land without motion, restoring scroll and the card that was opened.
- **The selected intent card takes the accent border.** A small, approved extension of the design (N02): the card's existing border turns `action/primary`, nothing else. No new background, shadow, scale or glow; thickness and size stay, so nothing shifts. The radio is still what says which option is chosen; the border only reinforces it.
- **Sending says so: "Enviando solicitação"**, exactly, without an ellipsis. The button keeps its size and crossfades to that label while the request is out, stays blocked against a second send and keeps its accessible behavior. The request itself still waits as long as the simulated network call (700 ms), with no minimum added.
- **A failed send keeps everything and says "Não foi possível enviar sua solicitação. Tente de novo."** Values stay, the button is back at once and nothing retries alone. The simulated request never fails today; the state stays as a defensive fallback, and nothing makes it appear for people just to show it (only the development switches reach it).
- **The desktop filter rail stays in reach while scrolling, when it fits** the window with 24 px to spare. A short window, a larger font or zoom turn that off.
- **The mobile filter bar is not sticky.** The direction allowed it only after checking the existing bar: "Filtros" and "Ordenar" sit inside the search toolbar with no surface of their own, so keeping them on screen would mean a new bar with its own background over the results. They stay in the toolbar; no floating bar.
- **Card hover only on a fine pointer.** It recolors the existing outline; a tap doesn't leave it behind. Pressing shows the same color on any pointer. Focus shows at once.
- **No new gestures or controls.** The gallery has no swipe, and none was added; its photos move with the thumbnails and the previous/next buttons that exist.
- **After "Limpar filtros" in the empty state, focus continues at the results' title**, since the button leaves with the empty state.
- **Turning a tablet to the wide layout closes the gallery overlay** (the wide layout has none) on the same photo, with focus on its thumbnail.
- **The two Inter files of the first screen are preloaded.** With results on the first paint, text set in the fallback font reflowed when Inter arrived.

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

### deploy

- **The app stays static and client-side.** No SSR, no backend and no framework change just for hosting. `npm run build` produces `dist/` with everything, photos and dataset included.
- **Prepared for importing on Vercel, not deployed.** No Vercel project, account link or deployment was made, and `main` wasn't touched. Vercel detects Vite, `npm run build` and `dist` on its own, so `vercel.json` only adds what it can't infer: the SPA fallback.
- **SPA fallback:** every path without a file extension gets `index.html`, so a reload or a direct link to a vehicle, the next step (with or without `?intencao=`) or the confirmation works. Files always win, and a missing file keeps a real 404 instead of receiving the page.
- **No environment variables or secrets.** The project doesn't need any, so none were created. The Node version Vite requires is declared in `engines`, and `.vercel` (the CLI's local link) stays out of git.
- **Personal data never leaves the form.** Name, WhatsApp and CPF don't go to the URL, storage, history or the build; after sending, only the simulated request id is kept with the history entry.

## still open

Each one gets decided when the feature that needs it is built, starting from the simplest option that keeps the specified product.

- **Removing a filter from its chip.** It isn't specified, and it shouldn't be added just because other products do it.
- **What comes after contact, visit and trade-in.** For now they stop at the "ainda não pode ser concluída por aqui" state. Their real flow gets designed when there is one.
- **"Lojas" and "Atendimento" in the header**, and a footer on mobile screens.

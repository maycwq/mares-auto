# product decisions

Decisions taken during implementation that complement the Figma file. The design and its handoff notes stay the main source; this file covers what they leave open or contradict, so it doesn't have to be settled again in every session.

When one of the open points below is decided, move it to the decided list. When a decision changes, edit it here instead of leaving the old version around.

## decided

### filters

- **Car type is a primary filter on mobile too.** The M2 sheet shows it under "mais filtros", but the rail, the C01 decision and the handoff note all treat it as primary. The sheet layout is the inconsistency, not the filter architecture.

### copy across breakpoints

- **Mobile can use shorter copy when space requires it.** Meaning and product state have to match; the literal text doesn't.
- **The rail keeps "Marca/modelo" and "Km"**, with full accessible names ("Marca e modelo", "Quilometragem").
- **With filters applied, mobile has to say that a refinement is active.** "Todos" must not suggest there's no filter.
- **Composition differences are allowed.** The FIPE note, the active filters next to "voltar" and repeated evidence can differ between desktop and mobile. The information and state they carry stay available when needed, but nothing is duplicated just for symmetry.

### price and FIPE

- **"R$ X abaixo da FIPE"** below the reference, **"R$ X acima da FIPE"** above it, and **"na média da FIPE"** when the price matches it exactly.
- The line only disappears when there is no FIPE value.

### evidence

- **Only evidence with copy in the design is shown:** "Garantia até…", "Laudo cautelar aprovado" and "Revisões registradas".
- **Single owner and clean history stay in the data only.** Clean history means no auction, total loss or theft record. Neither appears in the interface until it has content and presentation of its own.

### typography

- **Off-scale sizes in the screens map to the nearest type token.** The screens use sizes outside the type scale (11, 13, 15, 17, 18, 22, 52 px and a 135% line height). The mapping holds as long as the visual hierarchy of the screen doesn't change noticeably.

### components

- **Next step panels (N1–N7):** reuse `Contact / Panel` and `CTA / Group` only where role and behavior really match the component. If the match is only visual, keep the composition without forcing a component.
- **The skeleton gets a subtle shimmer or pulse.** The design leaves motion undefined. It keeps the real `Vehicle / Card Skeleton` structure, causes no layout shift when data arrives, and becomes static or nearly static under `prefers-reduced-motion`.

### commercial shortcuts

- **"Usar seu carro na troca" and "Entender o financiamento" keep the current vehicle.** They can open the next step with the matching intent already selected. They don't start a separate journey.

### photos

- **Photo credits are kept in the data but not shown in the interface.** The project is a private, non-commercial exercise. If it's ever published, CC BY and CC BY-SA photos need visible attribution first.

### not reproduced

- **Two artifacts in the file are ignored:** the shifted header navigation in D3 and the centered radio labels in N5.

## still open

Each one gets decided when the feature that needs it is built, starting from the simplest option that keeps the specified product.

- **Select menus and sort options.** The design only has the `Input / Select` trigger, and the only sort option shown is "Mais recentes". Options come from the dataset when the listing is built.
- **Removing a filter from its chip.** It isn't specified, and it shouldn't be added just because other products do it.
- **Next step as a route, modal or panel.** This is an implementation choice, made on accessibility, navigation and state preservation.
- **Contact, visit and trade-in intents.** Financing is the only detailed flow. The other three keep vehicle + intent, and no form is invented for them.
- **Opening a vehicle directly.** What "Voltar para resultados" shows when there was no previous search.
- **Gallery beyond the visible thumbnails.** Vehicles can have more photos than the thumbnail row shows.
- **"Lojas" and "Atendimento" in the header**, and a footer on mobile screens.

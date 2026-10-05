# marés auto

A responsive used-car discovery and evaluation experience for **Marés Automóveis**, a fictional dealership identity.

The product connects browsing, refinement, vehicle evaluation, value and risk signals, and commercial next steps without dropping context along the way.

It started as the final solution of an AutoForce product design challenge. This repository is where that experience becomes a working product, so the focus from here is implementation rather than documenting the challenge itself.

> **status:** pre-implementation — the repository does not have an application scaffold or a chosen stack yet.

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

[AutoForce · desafio de Product Design — Marés Automóveis](https://www.figma.com/design/PORVUjlL3WfuGI7kxW9JgJ/AutoForce-%7C-desafio-de-Product-Design?node-id=214-116)

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

There is no application setup in the repository yet, so there are intentionally no install, run, test, or build commands documented here.

Once the implementation defines a real framework, tooling, scripts, folder structure, data layer, tests, or deployment flow, this README should be updated with the commands and architecture that actually exist.

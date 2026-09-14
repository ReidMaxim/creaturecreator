# Phase 24: Evolution observability

Phase 24 adds a bounded, dependency-free observatory to the existing HUD. It
uses the current population, lineage IDs, genomes, behavior counters, and
population history; it does not change selection or simulation rules.

## Included

- Lightweight species clusters (diet, size, speed, and hue signatures) with
  population and average-fitness summaries.
- Largest living lineage roots with parent links, generation, and member
  counts.
- Selectable trend chart for fitness and heritable traits, sampled alongside
  the existing 120-point population history.
- Generation timeline and a fitness breakdown (survival, food, predation, and
  retained energy).
- Inspector lineage/parent fields and per-creature fitness contribution.
- Refresh and metric controls in the Evolution observatory panel.

All groups and charts are capped so long-running simulations remain responsive.
Analytics are recomputed from live state and remain transient. Snapshot
`version: 1` is unchanged; new exports do not persist HUD analytics. Existing
version-1 snapshots continue to load.

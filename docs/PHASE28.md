# Phase 28: Visual evolution history

Phase 28 makes phenotype inheritance explainable without changing selection or
simulation balance. Each birth keeps a bounded, JSON-safe record of its parent
and offspring phenotype plus the visual genes that changed. The record is
optional in snapshots, capped at 160 births, and older Phase 19-27 saves load
with an empty history.

The inspector now compares parent and offspring swatches, identifies the
inherited lineage color, and highlights changed body-plan genes. A compact
timeline in the population history panel shows recent offspring phenotypes;
the canvas uses a deterministic lineage-color ring so continuity remains
visible as hue and pattern genes mutate. Parent genome/phenotype metadata is
stored only for offspring and is bounded through the same snapshot limits.

No dependencies or random rendering were added. Existing generation, lineage,
analytics, save/load, and reset behavior remain intact.

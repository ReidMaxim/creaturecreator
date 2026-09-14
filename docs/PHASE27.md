# Phase 27: Heritable phenotypes and body plans

Phase 27 adds a bounded phenotype layer between genomes and presentation. New
geometry, marking, color, appendage, eye, mouth, armor, and fin genes are
optional: `Genome` supplies safe defaults for older saves and mutation clamps
every value to its documented range. Reproduction therefore carries visual
traits through the existing genome path without changing controls or population
rules.

`derivePhenotype()` is the single body-plan conversion used when a creature is
constructed. It produces clamped dimensions, deterministic HSL colors and
accents, silhouette/style choices, armor, and an age/growth scale. Body parts
consume the same plan for defense, while the renderer consumes it for oval,
diamond, ribbon, and round silhouettes, markings, eyes, mouths, motors, fins,
armor, predator rings, energy, hunger, and movement cues. Existing predator,
energy, selection, and camera rendering remain intact.

The inspector exposes the current visual state plus derived geometry, growth,
pattern, and armor alongside the existing genome and behavior details.
Serialized genomes remain plain objects; Phase 19 snapshots load unchanged and
new fields are ignored safely by older code.

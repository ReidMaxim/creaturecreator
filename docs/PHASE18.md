# Phase 18: Environmental events and diversity

Phase 18 adds lightweight world pressure without introducing a dependency,
build step, or special predator balancing.

## Environmental events

The world periodically selects one bounded event after a short quiet period:

* **Drought** reduces plant growth and food availability, with a small energy
  cost increase.
* **Algal bloom** accelerates plant growth and replenishment, creating a
  temporary abundance window.
* **Storm** slows movement and raises energy drain while increasing scattered
  food spawns.

Events last for a fixed number of simulation seconds. Their multipliers are
centralized in `World.getEnvironmentEffects()`, clamped to modest values, and
only affect existing spawn, growth, movement, and metabolism paths. The active
event and countdown are shown in the HUD; the canvas receives a subtle
event-colored wash and top edge marker. Event scheduling uses ordinary browser
randomness and does not affect deterministic terrain zones.

## Diversity tracking

Creatures retain a root `lineageId` through reproduction. The HUD reports the
number of live lineages and coarse species signatures (diet, size, speed, and
hue bands). These are observational counters rather than new selection rules,
so existing genome mutation and predator behavior remain unchanged.

The event system is intentionally bounded and allocation-light: no per-cell
event maps, timers, or external services are required. Dead entities and
deferred births continue to use the existing safe update flow.

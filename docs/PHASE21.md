# Phase 21: Ecosystem balance and resource analytics

Phase 21 makes long-running ecosystems easier to tune and compare without
silently changing the predator rules.

## Controls

The environment panel exposes four presets:

- **Balanced**: the default carrying capacities and resource rates.
- **Predator-rich**: tighter plant/food supply and higher metabolic pressure.
- **Plant-rich**: larger plant capacity, faster regrowth, and lower pressure.
- **Sandbox / custom**: a neutral starting point for manual experiments.

Manual controls adjust food and plant carrying capacities, creature capacity,
and a resource-pressure multiplier. The multiplier affects metabolic drain; it
does not grant predators special survival or alter attack selection.

## Measurement

The HUD reports resource pressure as a percentage derived from creature
capacity load and food/plant scarcity. It also reports the current
predator-to-herbivore population ratio. These are live observations, not
targets: a predator-rich setup can still experience predator die-off.

## Persistence and compatibility

The selected preset is stored in preferences and in the existing world
settings snapshot. The snapshot format remains version 1, so existing Phase
19/20 saves continue to load; missing Phase 21 settings use balanced defaults.
Toroidal wrapping, static deployment, and dependency-free operation are
unchanged.

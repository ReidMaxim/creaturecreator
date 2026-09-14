# Phase 15: Predation and carnivore food chains

Phase 15 adds a second energy pathway without changing the static browser
architecture. Every genome carries bounded, mutable diet, attack, defense,
and agility values. Diet values at or above `0.52` produce a carnivore;
lower values produce herbivores. All four values are inherited by
`makeChild()` and independently Gaussian-mutated within their limits.

Carnivores use the same spatial grid and toroidal distance calculation as food
sensing to find lower-diet creatures. They steer toward prey, bite only inside
their size-based range, observe an attack cooldown, and gain energy after a
successful kill. Herbivores continue collecting spawned food and turn away
from higher-diet threats. Dead prey is marked immediately but removed during
the world's deferred cleanup pass, so iteration never mutates the active
creature list.

Predators have an orange outline in the canvas. The HUD reports predator and
kill totals, and the inspector reports diet, bite, defense, and individual
kills. Metabolic costs and the existing reproduction threshold preserve
tradeoffs between hunting, escaping, and eating plants.

No dependencies or build step were added; all imports remain relative ES
modules and the simulation remains GitHub Pages compatible.

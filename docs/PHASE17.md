# Phase 17: Environmental zones and terrain variation

Phase 17 adds a deterministic terrain layer to the existing toroidal world.
The world is divided into 500px cells generated from a small coordinate hash,
so the same world dimensions always produce the same layout without a new
dependency or a saved map.

## Zones

* **Meadow** is the easiest terrain and supports fast plant growth.
* **Water** slows movement, costs slightly more energy to cross, and supports
  fewer plants and lower-value food.
* **Rock / desert** slows movement modestly and has sparse plant and food
  density.

`World.getZoneAt(x, y)` wraps coordinates before looking up a cell. This keeps
zone queries consistent with entity movement, seeds, and the existing
toroidal `getNearby` queries. Creature movement and metabolic drain use the
current zone, while plants use local zone growth and spawning density. Food
spawn energy also reflects local density.

The renderer paints terrain cells behind entities, including wrapped camera
views. The HUD legend reports the current creature distribution by terrain.
Predator behavior and balance are intentionally unchanged; the existing
short-lived predator population remains a known behavior for a later phase.

The simulator remains a dependency-free static ES-module site suitable for
GitHub Pages.

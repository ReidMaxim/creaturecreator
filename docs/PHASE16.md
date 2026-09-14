# Phase 16: Plants and growing ecosystems

Phase 16 adds a renewable producer layer without introducing dependencies or a
separate update loop.

## Plants

`Plant` entities grow energy over time, have bounded lifespans, and spread
deferred seeds to nearby toroidal coordinates. Grazing can deplete a plant,
while mature plants continue to regrow. The world caps plant count and only
applies queued seeds after the current update, so iteration never mutates the
active list.

Plants are inserted into the spatial grid and have their own `plants` query
type. Existing pellets remain available as a secondary food source. Herbivores
seek and consume nearby plants with a heritable, bounded preference and
efficiency trait; carnivores continue to sense and hunt creatures exclusively.

## UI and safety

Plant count, total plant energy, and a plant regrowth slider are shown in the
HUD. Plants use wrapped coordinates and are rendered as green growing shoots.
Dead plants, seeds, creature births, and predator kills are all resolved
between iteration passes.

The simulator remains a static ES-module site suitable for GitHub Pages.

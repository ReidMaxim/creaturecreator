# Phase 25: Player creature creator

Phase 25 adds a dependency-free creator tool to the HUD. Players can edit the
bounded genome body, diet, and behavior traits, choose safe starting energy and
age values, and inject a custom creature into a live world.

## Safety and simulation behavior

All creator fields use the same `GENE_LIMITS` as mutation and reproduction.
Non-numeric values are rejected, numeric values are clamped to their trait
limits, and body counts remain integer values. Creature energy and age are
clamped again by the entity constructor. World injection checks the creature
capacity, wraps coordinates through the existing toroidal topology, and
rebuilds the spatial grid. It does not bypass deferred birth processing:
ordinary reproduction continues to use `queueBirth` and its capacity guard.

## Presets

Named creator presets are stored in browser `localStorage` under a separate
Phase 25 key. They contain only the creator genome and starting values, so
simulation saves and existing version-1 snapshots remain compatible. Invalid
or unavailable browser storage is reported in the creator status line.

The creator has no network, framework, or package dependency and remains
usable on a static Pages deployment.

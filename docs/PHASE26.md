# Phase 26: Presentation and performance

Phase 26 makes long-running experiments easier to reproduce, share, and read
without changing the simulation model or adding dependencies.

## Reproducible experiments

The Simulation data panel provides a 32-bit deterministic seed and an
experiment label. **Reset with seed** restarts the world from that seed; all
simulation randomness now uses the shared seedable generator, including food,
plants, environmental events, mutation, and reproduction. The label and seed
are included in the existing version 1 snapshot format. Older Phase 19–21
saves remain valid and use the current defaults for missing metadata.

## Presentation and accessibility

The canvas has an accessible label, form controls have explicit labels, and
keyboard focus is visible across interactive controls. A reduced-motion media
query avoids introducing motion-heavy UI transitions for users who request
reduced motion.

## Performance safeguards

The renderer computes the camera viewport once per frame and skips food, plants,
and creatures outside that viewport. Simulation update behavior, toroidal
coordinates, save/load limits, and GitHub Pages-compatible static deployment
remain unchanged.

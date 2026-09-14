# Phase 20: Experiment controls and live analytics

Phase 20 makes repeated experiments easier to run without changing existing
ecosystem balance.

## Controls

- **Reset & reseed** clears entities, counters, event state, and pending work,
  then restores the initial 24 creatures, 120 food items, and 150 plants.
- **Pause after reset** prevents a reset from immediately consuming simulation
  time.
- **Reset time** controls whether simulation time and ticks return to zero.
- **Auto-start** controls whether the simulator begins running on page load.
  These preferences are stored locally and are independent of simulation saves.

Loading or importing a snapshot restores the world in place and clears the
selected creature and history chart, preventing references to removed
entities.

## Live analytics

The analytics panel shows cumulative births, deaths, and predator kills from
the current world, with a bounded list of environmental event transitions.
Event entries are persisted in JSON snapshots (up to 40 entries). The bounded
population chart now includes average fitness as a fourth series and retains
no more than 120 samples.

No dependencies or predator rebalance were introduced.

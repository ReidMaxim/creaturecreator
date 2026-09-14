# Phase 19: Persistence and observability

Phase 19 keeps the simulator static and dependency-free while making runs
portable and easier to study.

## Persistence

The **Simulation data** panel provides:

* **Save / Load** using `localStorage` under a versioned application key.
* **Export JSON** to download a complete snapshot and populate the textarea.
* **Import** from the textarea, or from a `.json` file when the textarea is
  empty.

Snapshots include dimensions/settings, simulation time and tick, counters,
environment event state, food, plants, creatures, complete genomes (including
neural policy weights), lineage/generation values, behavior statistics, and
camera position/zoom. Loading reconstructs `Creature` and `Plant` instances,
rebuilds the spatial grid, and clears deferred births/seeds so no stale object
references survive. Version and shape checks reject malformed input; errors are
shown in the panel instead of silently resetting the simulation.

## Population history

The compact canvas chart samples population, plant count, and predator count
once per simulated second. It keeps at most 120 points (two minutes at normal
speed), so it remains bounded during long-running sessions. The chart resets
when a snapshot is loaded.

## Limitations

Browser localStorage is origin-specific and quota-limited. Saves do not include
the browser's random-number-generator state, so a loaded run resumes with
different future random outcomes. Pending births and plant seeds are
intentionally discarded at save time because they are transient update queues.

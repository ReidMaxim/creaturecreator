# Phase 23: Advanced ecology

Phase 23 adds a bounded detritus pathway without changing the existing plant
diet or predator attack rules.

## Scavenging

Every creature inherits a `scavenging` trait in the range 0-1. When a creature
dies, the world leaves a short-lived carcass containing a bounded fraction of
its maximum energy. Creatures with enough scavenging affinity and a functional
mouth can sense nearby carcasses and recover energy from them. Energy decays
over time, carcasses are removed when depleted or aged out, and recovery is
scaled by mouth efficiency and scavenging affinity. This supports bounded
omnivory while keeping existing herbivores, carnivores, and attacks intact.

## Observability and persistence

Carcasses have a distinct canvas marker. The HUD reports active carcasses and
cumulative recovered energy, while the inspector shows each creature's
scavenging trait and recovered energy. Genome mutations, behavior statistics,
and active carcasses are included in the existing version-1 JSON snapshots;
older Phase 19-22 snapshots load with empty carcass state and default
scavenging traits.

The ecology remains toroidal and dependency-free. Carcass creation is bounded
by the number of deaths, and no predator damage, targeting, or balance preset
was changed.

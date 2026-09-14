# Phase 22: Optional sexual reproduction

Phase 22 adds sexual reproduction without removing the original asexual mode.
The reproduction selector defaults to asexual, so existing experiments and
Phase 19-21 saves retain their behavior.

## Reproduction modes

- **Asexual**: a ready creature pays the existing energy cost and produces a
  mutated copy.
- **Sexual**: a ready creature seeks a nearby compatible mate of the opposite
  sex and matching diet. Both parents pay a bounded energy cost and enter a
  bounded cooldown before one deferred birth is queued.

Sexual offspring inherit one parent value per gene (including every neural
policy weight), then receive the normal mutation pass. Offspring snapshots
record both parent IDs; older creatures without that field load as
single-parent/founder records. Sex is assigned to new founders and persisted
for loaded creatures.

## Compatibility and safety

Mate searches use the existing toroidal spatial grid. Births still pass
through the world queue and population-cap check, so mating cannot bypass
capacity or mutate entity lists during an update. Reproduction settings are
serialized inside the existing version-1 world settings object; missing mode
settings are normalized to asexual on load.

The HUD shows the active mode, and the inspector shows sex and parent IDs.
The feature uses only browser JavaScript and remains suitable for static
GitHub Pages deployment.

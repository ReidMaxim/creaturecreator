# Creature Creator: Browser Artificial Life Simulator

A browser-based artificial life simulator where evolution happens in real-time. Watch autonomous creatures develop behaviors, body plans, and strategies to survive and reproduce.

**[Live Demo](https://reidmaxim.github.io/creaturecreator)** | [Design Docs](./docs/DESIGN.md) | [Roadmap](./docs/PHASES.md)

---

## What's This?

Inspired by *The Bibites* and classic artificial life experiments, Creature Creator simulates evolution visually:

- Creatures develop eyes, mouths, and motors through natural selection
- Body plans emerge organically from mutation and survival pressure
- Watch populations adapt to food scarcity, predation, and competition
- Pausable, adjustable speed, and inspector tools to study lineages

**No backend. No database. Pure browser. Static-deployable.**

---

## Quick Start

```bash
# Clone
git clone https://github.com/ReidMaxim/creaturecreator.git
cd creaturecreator

# Serve locally (Python 3)
python -m http.server 8000

# Or use your favorite HTTP server
# Visit: http://localhost:8000
```

---

## Controls

| Input | Action |
|-------|--------|
| **W/A/S/D** or **Arrow Keys** | Pan camera |
| **Mouse Wheel** | Zoom in/out |
| **Space** | Play / Pause |
| **Click Creature** | Select & inspect |
| **Slider Controls** | Adjust simulation speed, environment |
| **Simulation data panel** | Save/load locally, export/import JSON |

---

## Development Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| 1-8 | Playable ecosystem, genetics, reproduction, lineages, inspector | ✅ Complete |
| 9-12 | Modular heritable body parts, structural mutation, costs, and sensory systems | ✅ Complete |
| 13 | Primitive neural brain (simple decision-making) | ✅ Complete |
| 14 | Neural mutation (learning to evolve) | ✅ Complete |
| 15 | Predation (carnivores, food chains) | ✅ Complete |
| 16 | Plants (living, growing, seeding) | ✅ Complete |
| 17 | Environmental zones (terrain variation) | ✅ Complete |
| 18 | Environmental events and species/lineage diversity | ✅ Complete |
| 19 | Persistence, JSON import/export, and population history | ✅ Complete |
| 20 | Experiment controls and live analytics | ✅ Complete |
| 21 | Ecosystem balance controls, presets, and resource analytics | ✅ Complete |
| 24 | Evolution observability: clusters, lineages, trends, and fitness | ✅ Complete |
| 22 | Optional sexual reproduction and heritable genome recombination | ✅ Complete |
| 26 | Deterministic experiments, accessible presentation, and large-population performance | ✅ Complete |

Every phase ships as a playable milestone.

### Phase 17: Environmental zones and terrain variation

The toroidal world now has deterministic meadow, water, and rock/desert cells.
Terrain is visibly painted on the canvas and exposed through a HUD legend.
Zones lightly affect creature movement and metabolic drain, plant growth and
density, and food energy. Wrapped zone lookup preserves safe edge queries.
Predator balance was not changed; predator die-off remains a known behavior.
See [`docs/PHASE17.md`](./docs/PHASE17.md).

### Phase 18: Environmental events and diversity

Periodic droughts, algal blooms, and storms add visible, bounded pressure to
the existing food-and-plant ecosystem. The active event shows its countdown in
the HUD and applies lightweight growth, spawn, movement, or energy modifiers;
the renderer adds a subtle event tint. Live species signatures and inherited
lineage roots are tracked for population diversity without changing predator
balance. See [`docs/PHASE18.md`](./docs/PHASE18.md).

### Phase 19: Persistence and observability

Simulation saves can be stored in browser localStorage, exported as a JSON
download, or imported from a JSON file (or the built-in textarea). Saves include
world settings, time/counters, entities, genomes and neural policies, lineage
and behavior statistics, and the camera. Invalid data is rejected with a visible
error. A bounded population history chart tracks creatures, plants, and
predators without adding dependencies. See
[`docs/PHASE19.md`](./docs/PHASE19.md).

### Phase 20: Experiment controls and live analytics

Reset-and-reseed controls now support optional time reset, pause-after-reset,
and persisted auto-start preferences. A bounded live analytics panel reports
cumulative births, deaths, and predation kills plus recent environmental event
transitions. The population chart also includes average fitness. Reset and
load clear inspector selection so stale entity references are not retained.
See [`docs/PHASE20.md`](./docs/PHASE20.md).

### Phase 21: Ecosystem balance and resource pressure

The environment panel now includes balanced, predator-rich, plant-rich, and
sandbox/custom presets. Presets configure carrying capacities and resource
production without changing predator behavior or preventing predator die-off.
Custom capacity and pressure sliders remain available for experiments, and the
selected preset is retained in preferences and serialized snapshots. The HUD
reports resource pressure and the predator-to-herbivore population ratio so
long-running outcomes are measurable. See [`docs/PHASE21.md`](./docs/PHASE21.md).

### Phase 24: Evolution observability

The Evolution observatory adds bounded species clustering, lineage summaries
and parent trees, selectable trait and fitness trends, a generation timeline,
and fitness-component breakdowns. The inspector now includes lineage and
per-creature fitness contributions. Analytics are derived from live state and
the existing history buffer; snapshot version 1 remains compatible and
transient HUD analytics are not written to new saves. See
[`docs/PHASE24.md`](./docs/PHASE24.md).
### Phase 22: Optional sexual reproduction

The reproduction control can switch between the compatible legacy asexual
mode and sexual mating. Sexual mates seek compatible nearby partners, pay
bounded costs, observe cooldowns, and produce deferred offspring with
recombined genomes, mutation, and two-parent metadata. The HUD and inspector
expose the active mode and ancestry. See
[`docs/PHASE22.md`](./docs/PHASE22.md).

### Phase 26: Reproducible, long-running experiments

Phase 26 adds a deterministic seed and experiment label to the existing
simulation data panel. Seeds and labels are included in the existing version 1
JSON snapshots, so experiments can be shared without breaking older saves.
Rendering now skips entities outside the camera viewport, while focus-visible
styles, labels, canvas semantics, and reduced-motion handling improve
accessibility. See [`docs/PHASE26.md`](./docs/PHASE26.md).

### Phase 16: Plants and growing ecosystems

Plants grow renewable energy, regrow after grazing, age out, and spread
deferred seeds across the toroidal world. Herbivores sense and consume plants
using bounded heritable plant preference and efficiency traits, while
carnivores continue hunting creatures. Plant count, energy, regrowth controls,
and visible plant rendering are included in the HUD and canvas. See
[`docs/PHASE16.md`](./docs/PHASE16.md).

### Phase 15: Predation and food chains

Diet, bite/attack, defense, and agility are bounded heritable genome traits.
Carnivores detect and pursue nearby prey, attack at close range on a cooldown,
and recover energy from kills. Herbivores prioritize plants and flee detected
predators; toroidal spatial queries and deferred death/birth processing keep
updates safe. Predator rings, diet labels, kill totals, and per-creature kills
are visible in the renderer, HUD, and inspector. See
[`docs/PHASE15.md`](./docs/PHASE15.md) for implementation notes.

### Phase 14: Neural mutation

Each genome now carries a bounded seven-value neural policy vector
(food direction, food distance, energy urgency, wander, persistence, risk, and
bias). The decision brain combines live sensor inputs with these weights for
turning and thrust; reproduction copies the vector and applies independent
Gaussian mutations. The HUD shows population average fitness, while the
inspector reports a creature's policy, food collected, travel, and fitness.

---

## Project Structure

```
creaturecreator/
├── index.html                 # Entry point
├── style.css                  # Global styles
├── README.md                  # This file
│
├── js/
│   ├── main.js               # Bootstrap & event loop
│   ├── world.js              # World state, zones, events & physics
│   ├── renderer.js           # Canvas rendering
│   ├── analytics.js          # Bounded evolution summaries and trends
│   │
│   ├── entities/
│   │   ├── creature.js       # Creature class
│   │   ├── food.js           # Food class
│   │   └── plant.js          # Growing, edible, seed-spreading plant
│   │
│   ├── genetics/
│   │   ├── genome.js         # Genetic representation and neural policy weights
│   │   ├── mutation.js       # Mutation rules
│   │   └── reproduction.js   # Birth logic
│   │
│   ├── brain/
│   │   ├── brain.js          # Mutable neural policy/decision logic
│   │   ├── sensors.js        # Sensory input
│   │   └── actions.js        # Behavioral output
│   │
│   ├── parts/
│   │   ├── bodyPart.js       # Part base class
│   │   ├── eye.js            # Eye part
│   │   ├── mouth.js          # Mouth part
│   │   ├── motor.js          # Movement part
│   │   └── armor.js          # Defense part (future)
│   │
│   └── utils/
│       ├── math.js           # Vector & utility math
│       ├── random.js         # Seeded RNG
│       ├── zones.js          # Deterministic terrain zone generation
│       └── spatialGrid.js    # Performance optimization
│
├── docs/
│   ├── DESIGN.md             # Architecture & philosophy
│   ├── PHASES.md             # Detailed phase breakdown
│   ├── PHASE17.md            # Environmental zones implementation notes
│   ├── PHASE18.md            # Environmental events and diversity notes
│   ├── PHASE19.md            # Persistence and population history notes
│   ├── PHASE20.md            # Experiment controls and live analytics notes
│   ├── PHASE21.md            # Ecosystem balance controls and resource analytics
│   └── PHASE24.md            # Evolution observability
│   └── PHASE22.md            # Optional sexual reproduction and recombination
│
└── assets/                   # (Future) sprites, icons, fonts
```

**Files created as systems become necessary. No premature scaffolding.**

---

## Design Philosophy

1. **Genome is source of truth** — Creatures are constructed from genetic blueprints
2. **Emergence over scripting** — Behavior arises from simple rules, not hardcoding
3. **Visible evolution** — Graphics make evolutionary changes immediately apparent
4. **Cost/benefit tradeoffs** — Every advantage has a metabolic price
5. **Separation of concerns** — Simulation runs independently from rendering

---

## Technology Stack

- **HTML5** — Semantic structure
- **CSS3** — Responsive, accessible styling
- **Vanilla JavaScript (ES6 modules)** — No frameworks initially
- **Canvas 2D** — Rendering & animation
- **LocalStorage and JSON files** — Browser-local save/load and portable exports

---

## Deployment

This project is built for **GitHub Pages**:

1. Push to `main`
2. Enable Pages in repository settings
3. Point to `/ (root)` on `main` branch
4. Visit `https://reidmaxim.github.io/creaturecreator`

All code is static. No build step required (until optimization).

---

## Contributing

This is currently a solo project, but the architecture supports collaboration:

- Features developed on feature branches
- Each phase merged only when fully playable
- Code reviews before main merge
- Issues used for task tracking

---

## Inspiration & References

- *The Bibites* — visual evolution game
- *Conway's Game of Life* — cellular automata
- Boid flocking algorithms
- Evolutionary algorithms & genetic programming
- Ecosystem simulation research

---

## License

MIT (add license choice later)

---

## Status

**Current Phase:** 24 (Evolution observability)
**Last Updated:** 2026-09-13
**Maintainer:** ReidMaxim

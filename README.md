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

---

## Development Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| 1-8 | Playable ecosystem, genetics, reproduction, lineages, inspector | ✅ Complete |
| 9-12 | Modular heritable body parts, structural mutation, costs, and sensory systems | ✅ Complete |
| 13 | Primitive neural brain (simple decision-making) | ✅ Complete |
| 14 | Neural mutation (learning to evolve) | ⏳ Next |
| 15 | Predation (carnivores, food chains) | ⏳ Planned |
| 16 | Plants (living, growing, seeding) | ⏳ Planned |
| 17 | Environmental zones (terrain variation) | ⏳ Planned |
| 18+ | Advanced features (water/land, disasters, species) | 🔮 Future |

Every phase ships as a playable milestone.

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
│   ├── simulation.js         # Core tick logic
│   ├── world.js              # World state & physics
│   ├── renderer.js           # Canvas rendering
│   │
│   ├── entities/
│   │   ├── creature.js       # Creature class
│   │   ├── food.js           # Food class
│   │   └── plant.js          # Plant class (future)
│   │
│   ├── genetics/
│   │   ├── genome.js         # Genetic representation
│   │   ├── mutation.js       # Mutation rules
│   │   └── reproduction.js   # Birth logic
│   │
│   ├── brain/
│   │   ├── brain.js          # Neural/decision logic
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
│   ├── ui/
│   │   ├── controls.js       # UI interactions
│   │   ├── inspector.js      # Creature details panel
│   │   └── graphs.js         # Statistics visualization
│   │
│   └── utils/
│       ├── math.js           # Vector & utility math
│       ├── random.js         # Seeded RNG
│       └── spatialGrid.js    # Performance optimization
│
├── docs/
│   ├── DESIGN.md             # Architecture & philosophy
│   └── PHASES.md             # Detailed phase breakdown
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
- **LocalStorage** — Save/load (Phase 25)

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

**Current Phase:** 13 (Primitive heritable decision brains)
**Last Updated:** 2026-09-13
**Maintainer:** ReidMaxim

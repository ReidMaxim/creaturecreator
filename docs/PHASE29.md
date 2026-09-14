# Phase 29: Advanced Ecosystem Features

## Overview

Phase 29 introduces three major ecosystem systems: **Disease/Parasites**, **Seasonal Cycles**, and **Niche Specialization**. These systems add depth to the simulation by modeling transmissible pathogens, environmental cycles, and specialized creature adaptations.

---

## 1. Disease System

### 1.1 Pathogen Types

Four distinct pathogen types with different effects:

| Pathogen | Color | Energy Drain | Movement Penalty | Reproduction Penalty | Transmission Rate |
|----------|-------|-------------|------------------|---------------------|-------------------|
| Parasite | `#f59e0b` | 0.8/s | 0.85x | 0.7x | 0.12 |
| Virus | `#ef4444` | 1.5/s | 0.7x | 0.4x | 0.18 |
| Fungus | `#a855f7` | 1.0/s | 0.9x | 0.6x | 0.10 |
| Bacteria | `#3b82f6` | 1.2/s | 0.8x | 0.5x | 0.15 |

### 1.2 Immunity Genes

New heritable genes (bounded 0-1) added to genome:

- **immunity** (default: 0.5) - Base resistance to all pathogens
- **diseaseResistance** (default: 0.5) - Reduces transmission probability
- **pathogenTolerance** (default: 0.3) - Reduces symptom severity
- **coldAdaptation** (default: 0.5) - Reduces cold temperature stress
- **heatAdaptation** (default: 0.5) - Reduces heat temperature stress
- **seasonalMetabolism** (default: 0.5) - Modulates metabolism across seasons

### 1.3 Infection Mechanics

**Environmental Exposure:** Creatures in high disease-pressure zones have a chance to contract random diseases. Probability scales with local pressure × (1 - immunity).

**Transmission:** When infected and susceptible creatures are within 15 units:
- Base transmission chance = pathogen-specific rate × (1 - target.diseaseResistance)
- Immunity and diseaseResistance reduce transmission probability
- Multiple diseases can be transmitted simultaneously

**Recovery:** Natural recovery chance per second = 0.02 × (1 + pathogenTolerance)
- Parasites recover slowest, viruses fastest (relative to severity)

### 1.4 Symptom Effects

Active diseases apply cumulative penalties:
- **Energy drain** - Continuous energy loss per second
- **Movement multiplier** - Reduces speed (multiplicative across diseases)
- **Reproduction penalty** - Increases energy threshold for reproduction

### 1.5 Disease Pressure Grid

Spatial grid (300×300 cell size) tracking environmental pathogen concentration:
- Decays at 0.02/s per cell
- Diseased creatures add pressure at their position (0.01 × disease count)
- Creatures sample pressure at their location for environmental exposure

### 1.6 Visual Indicators

- **Colored ring segments** around creatures - one segment per active disease
- **Particle effects** for severe diseases (pathogenLoad > 1.5)
- **Overall glow** for heavily infected creatures (pathogenLoad > 2.5)
- **HUD panel** showing infected count, average pathogen load, disease pressure, and per-pathogen counts

---

## 2. Seasonal Cycles

### 2.1 Season Definitions

| Season | Duration | Temperature | Plant Growth | Food Spawn | Color |
|--------|----------|-------------|--------------|------------|-------|
| Spring | 60s | 0.4 (cool) | 1.4x | 1.2x | `#86efac` (green) |
| Summer | 80s | 0.7 (warm) | 1.1x | 1.0x | `#fde047` (yellow) |
| Autumn | 60s | 0.45 (cool) | 0.8x | 0.9x | `#fb923c` (orange) |
| Winter | 70s | 0.2 (cold) | 0.4x | 0.6x | `#bfdbfe` (blue) |

**Year length:** 270 seconds (4.5 minutes)

### 2.2 Temperature Effects

Creatures experience temperature stress based on deviation from their adapted range:
- **Cold stress** = max(0, 0.5 - seasonTemp) × (1 - coldAdaptation)
- **Heat stress** = max(0, seasonTemp - 0.5) × (1 - heatAdaptation)
- Stress applies energy drain and reduces movement

### 2.3 Seasonal Metabolism

- **seasonalMetabolism** gene modulates how strongly metabolism changes with seasons
- High seasonalMetabolism = larger metabolism swings (energy efficient in good seasons, conserving in harsh)
- Low seasonalMetabolism = more stable year-round metabolism

### 2.4 Day/Night Cycle

- 60-second cycle, night length varies by season:
  - Summer: 30% night (shortest)
  - Winter: 50% night (longest)
- **Nocturnal creatures** (nocturnal gene > 0.5):
  - +15% movement at night
  - +15% sensing at night
  - -10% movement during day

### 2.5 Visual Rendering

- **Zone tint blending** - Zone colors blended with seasonal color (30% seasonal tint)
- **Night overlay** - Dark blue semi-transparent overlay during night
- **Season progress bar** in HUD showing progress through current season

---

## 3. Niche Specialization

### 3.1 Niche Traits (Bounded Genes)

| Trait | Gene | Default | Effect |
|-------|------|---------|--------|
| Burrowing | `burrowing` | 0.0 | Movement bonus in rock/meadow (+25%), penalty in water (-40%), defense bonus when stationary in rock/meadow |
| Climbing | `climbing` | 0.0 | Movement bonus in rock (+30%), escape chance from predators (+20% per level) |
| Nocturnal | `nocturnal` | 0.0 | Night: +15% movement, +15% sensing; Day: -10% movement |
| Water Depth | `waterDepthPreference` | 0.5 | < 0.5: surface feeder; > 0.5: deep water forager |
| Surface Feeding | `surfaceFeeding` | 0.0 | +30% food detection at surface, +20% plant efficiency in shallow water |
| Deep Water Foraging | `deepWaterForaging` | 0.0 | +40% food detection in deep water, +25% plant efficiency in deep water |

### 3.2 Niche Type Classification

Creatures are classified into niche types based on dominant traits:
- `burrower` - High burrowing
- `climber` - High climbing
- `nocturnal` - High nocturnal
- `deep_water` - High waterDepthPreference + deepWaterForaging
- `surface` - High surfaceFeeding
- `generalist` - No strong specialization

### 3.3 Visual Indicators

Small symbols rendered near creatures:
- ▼ (burrowing) - brown, near ground
- ▲ (climbing) - gray, upward
- ☾ (nocturnal) - blue-white, upper right
- ▼ blue (deep water) - blue, lower right
- △ cyan (surface) - cyan, lower left

### 3.4 HUD Panel

Shows population counts for each niche specialization.

---

## 4. Integration Points

### 4.1 Genetics (js/genetics/genome.js)
- 12 new bounded genes added to `GENE_LIMITS`
- Default values set in constructor

### 4.2 Phenotype Derivation (js/genetics/phenotype.js)
- `derivePhenotype()` computes all new traits from genes
- `nicheType` classification based on trait combinations

### 4.3 Creature Logic (js/entities/creature.js)
- Disease state management (`diseases`, `pathogenLoad`, `diseaseImmunity`)
- `updateDiseases()` - recovery, environmental exposure, random infection
- `transmitDiseases()` - proximity-based transmission
- `updateSeasonalEffects()` - temperature stress, metabolism, nocturnal bonuses
- `updateNicheEffects()` - zone-specific modifiers
- Visual state includes disease severity

### 4.4 World Systems (js/world.js)
- `SEASONS` array with definitions
- `updateSeasonalCycle()` - advances season timer
- `getSeasonalEffects()` - returns current multipliers
- Disease pressure grid (init, decay, sample, add)
- Modified `updatePlants()` and `updateFoodSpawning()` with seasonal multipliers
- Serialization includes seasonal state and disease grid

### 4.5 Plant Growth (js/entities/plant.js)
- Seasonal growth multiplier from `world.getSeasonalEffects().plantGrowth`

### 4.6 Rendering (js/renderer.js)
- `drawZones()` - seasonal color blending
- `drawDiseaseIndicators()` - ring segments, particles, glow
- `drawNicheIndicators()` - specialization symbols

### 4.7 UI (js/main.js, index.html, style.css)
- Season display: name, temperature, day/night, progress bar
- Disease HUD: infected count, pathogen load, pressure, breakdown
- Niche HUD: population per specialization

---

## 5. Backward Compatibility

- Serialization version remains **1**
- New fields in snapshot are optional (fallback to defaults)
- Existing saves load correctly with new systems initialized to defaults
- No changes to existing gene bounds or behavior

---

## 6. Configuration

### World Settings (no new settings added)
Existing settings control base rates; seasonal multipliers apply on top.

### Gene Bounds
All new genes bounded [0, 1] with defaults at 0.5 (or 0.0 for niche traits).

---

## 7. Testing Checklist

- [ ] Disease transmission between creatures
- [ ] Environmental infection from pressure grid
- [ ] Recovery mechanics
- [ ] Season transitions (spring→summer→autumn→winter→spring)
- [ ] Temperature stress on non-adapted creatures
- [ ] Nocturnal bonuses/penalties at correct times
- [ ] Niche movement modifiers in correct zones
- [ ] Save/load preserves seasonal state and disease grid
- [ ] Visual indicators render correctly
- [ ] HUD updates with correct statistics
- [ ] No regression in existing systems (genetics, reproduction, analytics, etc.)

---

## 8. Future Extensions (Not in Phase 29)

- Pathogen evolution/mutation
- Immunity memory (acquired immunity)
- Seasonal migration behaviors
- Social disease transmission (herd immunity)
- Niche-specific reproduction strategies
- Climate zones beyond seasons
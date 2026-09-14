/**
 * World: Central state container for the simulation
 * Manages all entities, environment settings, and world dimensions
 */

import { SpatialGrid } from './utils/spatialGrid.js';
import { Creature } from './entities/creature.js';
import { Plant } from './entities/plant.js';
import { createZones, zoneAt, ZONE_DEFINITIONS } from './utils/zones.js';
import { compareGenomeGenes, lineageColor, phenotypeSnapshot } from './genetics/phenotype.js';

// Phase 29: Seasonal cycle definitions
export const SEASONS = [
    { name: 'spring', temperature: 0.4, plantGrowth: 1.4, foodSpawn: 1.2, duration: 60, color: '#86efac' },
    { name: 'summer', temperature: 0.7, plantGrowth: 1.1, foodSpawn: 1.0, duration: 80, color: '#fde047' },
    { name: 'autumn', temperature: 0.45, plantGrowth: 0.8, foodSpawn: 0.9, duration: 60, color: '#fb923c' },
    { name: 'winter', temperature: 0.2, plantGrowth: 0.4, foodSpawn: 0.6, duration: 70, color: '#bfdbfe' }
];

const SEASON_DURATION = SEASONS.reduce((sum, s) => sum + s.duration, 0); // 270 seconds per year

export const SIMULATION_PRESETS = {
    balanced: {
        foodSpawnRate: 2.0, foodEnergy: 50, maxFood: 500,
        plantSpawnRate: 0.8, maxPlants: 260, maxCreatures: 180, resourcePressure: 1
    },
    'predator-rich': {
        foodSpawnRate: 1.7, foodEnergy: 45, maxFood: 420,
        plantSpawnRate: 0.65, maxPlants: 220, maxCreatures: 180, resourcePressure: 1.15
    },
    'plant-rich': {
        foodSpawnRate: 2.2, foodEnergy: 55, maxFood: 560,
        plantSpawnRate: 1.25, maxPlants: 420, maxCreatures: 220, resourcePressure: 0.85
    },
    sandbox: {
        foodSpawnRate: 2.0, foodEnergy: 50, maxFood: 500,
        plantSpawnRate: 0.8, maxPlants: 260, maxCreatures: 180, resourcePressure: 1
    }
};

const PRESET_NAMES = Object.keys(SIMULATION_PRESETS);

export class World {
    constructor(width = 3000, height = 3000) {
        // Dimensions
        this.width = width;
        this.height = height;
        this.zones = createZones(width, height);

        // Entity lists
        this.creatures = [];
        this.food = [];
        this.plants = [];

        // Spatial optimization
        this.spatialGrid = new SpatialGrid(width, height, 200);

        // Environment settings
        this.settings = {
            ...SIMULATION_PRESETS.balanced,
            preset: 'balanced',
            worldSize: width,          // for UI reference
        };

        // Simulation time
        this.time = 0;
        this.tick = 0;
        this.deltaTime = 0;

        // Phase 29: Seasonal cycle
        this.seasonIndex = 0;
        this.seasonTime = 0;
        this.seasonTransitionTime = 0;

        // Phase 29: Disease system
        this.diseasePressureGrid = null;
        this.diseaseGridCellSize = 300;
        this.diseaseGridColumns = Math.max(1, Math.ceil(width / this.diseaseGridCellSize));
        this.diseaseGridRows = Math.max(1, Math.ceil(height / this.diseaseGridCellSize));
        this.initDiseasePressureGrid();

        // Spawning accumulator
        this.foodSpawnAccumulator = 0;
        this.plantSeedAccumulator = 0;
        this.pendingBirths = [];
        this.pendingPlantSeeds = [];
        this.nextFoodId = 1;
        this.births = 0;
        this.deaths = 0;
        this.predationKills = 0;
        this.maxGeneration = 0;
        this.settings.maxAge = 180;
        this.settings.mutationRate = 0.08;
        this.event = null;
        this.nextEventAt = this.time + 38 + Math.random() * 18;
        this.eventHistory = [];
        this.analyticsLog = [];
        this.evolutionHistory = [];
    }

    // Phase 29: Initialize disease pressure grid
    initDiseasePressureGrid() {
        this.diseasePressureGrid = [];
        for (let y = 0; y < this.diseaseGridRows; y++) {
            const row = [];
            for (let x = 0; x < this.diseaseGridColumns; x++) {
                row.push(0);
            }
            this.diseasePressureGrid.push(row);
        }
    }

    // Phase 29: Get current season
    getSeason() {
        return SEASONS[this.seasonIndex];
    }

    // Phase 29: Check if currently night (based on season and time)
    get isNight() {
        const season = this.getSeason();
        // Night is longer in winter, shorter in summer
        const nightLength = 0.3 + (1 - season.temperature) * 0.3; // 0.3 to 0.5
        const dayCycle = (this.time % 60) / 60; // 60 second day cycle
        return dayCycle > (1 - nightLength);
    }

    // Phase 29: Update seasonal cycle
    updateSeasonalCycle() {
        this.seasonTime += this.deltaTime;
        const currentSeason = SEASONS[this.seasonIndex];

        if (this.seasonTime >= currentSeason.duration) {
            this.seasonTime = 0;
            this.seasonIndex = (this.seasonIndex + 1) % SEASONS.length;
            this.seasonTransitionTime = this.time;
            this.recordEvent(`Season changed to ${SEASONS[this.seasonIndex].name}`, SEASONS[this.seasonIndex].color);
        }
    }

    // Phase 29: Get seasonal environment effects
    getSeasonalEffects() {
        const season = this.getSeason();
        const progress = this.seasonTime / season.duration;

        return {
            plantGrowth: season.plantGrowth,
            foodSpawn: season.foodSpawn,
            temperature: season.temperature,
            seasonName: season.name,
            seasonProgress: progress,
            seasonColor: season.color,
            isNight: this.isNight
        };
    }

    // Phase 29: Get disease pressure at position
    getDiseasePressure(x, y) {
        const wrappedX = ((x % this.width) + this.width) % this.width;
        const wrappedY = ((y % this.height) + this.height) % this.height;
        const col = Math.min(this.diseaseGridColumns - 1, Math.floor(wrappedX / this.diseaseGridCellSize));
        const row = Math.min(this.diseaseGridRows - 1, Math.floor(wrappedY / this.diseaseGridCellSize));
        return this.diseasePressureGrid[row][col];
    }

    // Phase 29: Add disease pressure at position (from diseased creatures)
    addDiseasePressure(x, y, amount) {
        const wrappedX = ((x % this.width) + this.width) % this.width;
        const wrappedY = ((y % this.height) + this.height) % this.height;
        const col = Math.min(this.diseaseGridColumns - 1, Math.floor(wrappedX / this.diseaseGridCellSize));
        const row = Math.min(this.diseaseGridRows - 1, Math.floor(wrappedY / this.diseaseGridCellSize));
        this.diseasePressureGrid[row][col] = Math.min(1, this.diseasePressureGrid[row][col] + amount);
    }

    // Phase 29: Decay disease pressure grid
    decayDiseasePressure() {
        for (let y = 0; y < this.diseaseGridRows; y++) {
            for (let x = 0; x < this.diseaseGridColumns; x++) {
                this.diseasePressureGrid[y][x] = Math.max(0, this.diseasePressureGrid[y][x] - this.deltaTime * 0.02);
            }
        }
    }

        // Phase 29: Update seasonal cycle and disease pressure
                this.updateSeasonalCycle();
                this.decayDiseasePressure();

                // Add disease pressure from diseased creatures
                for (const creature of this.creatures) {
                    if (creature.diseases && creature.diseases.length > 0) {
                        this.addDiseasePressure(creature.x, creature.y, 0.01 * creature.diseases.length);
                    }
                }

                // Update creatures (will be implemented in creature class)
                for (const creature of [...this.creatures]) {
                    if (creature.update) {
                        creature.update(deltaTime * simulationSpeed, this);
                    }
                }

                // Remove dead creatures
                const living = [];
                for (const creature of this.creatures) {
                    if (creature.alive !== false) living.push(creature);
                    else this.deaths += 1;
                }
                this.creatures = living;
                this.plants = this.plants.filter(plant => plant.alive);
                for (const child of this.pendingBirths.splice(0)) {
                    const creature = new Creature(child.x, child.y, child);
                    this.addCreature(creature);
                    this.recordEvolution(creature);
                    this.births += 1;
                }
                for (const seed of this.pendingPlantSeeds.splice(0)) this.addPlant(seed);

                // Rebuild spatial grid for proximity queries
                this.rebuildSpatialGrid();

                this.tick++;
            }

    updatePlants() {
            // Phase 29: Apply seasonal effects to plant spawning
            const seasonalEffects = this.getSeasonalEffects();
            const envEffects = this.getEnvironmentEffects();
            const plantSpawnMultiplier = seasonalEffects.plantGrowth * envEffects.plantSpawn;

            this.plantSeedAccumulator += this.settings.plantSpawnRate
                * plantSpawnMultiplier * this.deltaTime;
            while (this.plantSeedAccumulator >= 1 && this.plants.length < this.settings.maxPlants) {
                this.spawnPlant();
                this.plantSeedAccumulator -= 1;
            }
            for (const plant of [...this.plants]) {
                if (plant.alive) plant.update(this.deltaTime, this);
            }
        }

        /**
         * Handle food spawning logic
         */
        updateFoodSpawning() {
            if (this.food.length >= this.settings.maxFood) {
                return;
            }

            // Phase 29: Apply seasonal effects to food spawning
            const seasonalEffects = this.getSeasonalEffects();
            const envEffects = this.getEnvironmentEffects();
            const foodSpawnMultiplier = seasonalEffects.foodSpawn * envEffects.foodSpawn;

            this.foodSpawnAccumulator += this.settings.foodSpawnRate
                * foodSpawnMultiplier * this.deltaTime;

            while (this.foodSpawnAccumulator >= 1.0) {
                this.spawnFood();
                this.foodSpawnAccumulator -= 1.0;
            }
        }

    /**
     * Spawn food at random location
     */
    spawnFood() {
        if (this.food.length >= this.settings.maxFood) return;

        const x = Math.random() * this.width;
        const y = Math.random() * this.height;
        const zone = this.getZoneAt(x, y);
        const food = {
            x, y,
            energy: this.settings.foodEnergy * zone.foodDensity,
            id: this.nextFoodId++,
            isFood: true
        };

        this.food.push(food);
    }

    spawnPlant() {
        if (this.plants.length >= this.settings.maxPlants) return;
        const x = Math.random() * this.width;
        const y = Math.random() * this.height;
        const zone = this.getZoneAt(x, y);
        if (Math.random() > zone.plantDensity * this.getEnvironmentEffects().plantDensity) return;
        this.addPlant(new Plant(x, y, { zoneType: zone.type }));
    }

    addPlant(plant) {
        const wrapped = this.wrapPosition(plant.x, plant.y);
        plant.x = wrapped.x;
        plant.y = wrapped.y;
        plant.zoneType = this.getZoneAt(plant.x, plant.y).type;
        this.plants.push(plant);
    }

    queuePlantSeed(parent) {
        if (this.plants.length + this.pendingPlantSeeds.length >= this.settings.maxPlants) return;
        const angle = Math.random() * Math.PI * 2;
        const distance = 25 + Math.random() * 70;
        this.pendingPlantSeeds.push(new Plant(
            parent.x + Math.cos(angle) * distance,
            parent.y + Math.sin(angle) * distance,
            { energy: 2, maxEnergy: parent.maxEnergy, growthRate: parent.growthRate,
                lifespan: parent.lifespan, seedTimer: 10 + Math.random() * 12,
                zoneType: parent.zoneType }
        ));
    }

    /**
     * Add creature to world
     */
    addCreature(creature) {
        const wrapped = this.wrapPosition(creature.x, creature.y);
        creature.x = wrapped.x;
        creature.y = wrapped.y;
        this.creatures.push(creature);
        this.maxGeneration = Math.max(this.maxGeneration, creature.generation);
    }

    queueBirth(child) {
        if (this.creatures.length + this.pendingBirths.length < this.settings.maxCreatures) {
            this.pendingBirths.push(child);
        }
    }

    recordEvolution(creature) {
        this.evolutionHistory.push({
            id: creature.id,
            parentId: creature.parentId,
            lineageId: creature.lineageId,
            lineageColor: lineageColor(creature.lineageId),
            generation: creature.generation,
            time: this.time,
            phenotype: phenotypeSnapshot(creature.phenotype),
            parentPhenotype: phenotypeSnapshot(creature.parentPhenotype || {}),
            mutations: compareGenomeGenes(creature.parentGenome, creature.genome)
        });
        if (this.evolutionHistory.length > 160) this.evolutionHistory.shift();
    }

    /**
     * Remove food item
     */
    removeFood(foodIndex) {
        if (foodIndex >= 0 && foodIndex < this.food.length) {
            this.food.splice(foodIndex, 1);
        }
    }

    /**
     * Get nearby entities for proximity queries
     */
    getNearby(x, y, radius, type = 'all') {
        const candidates = [];
        const seen = new Set();
        for (const offsetX of [-this.width, 0, this.width]) {
            for (const offsetY of [-this.height, 0, this.height]) {
                for (const entity of this.spatialGrid.getNearby(x + offsetX, y + offsetY, radius)) {
                    if (!seen.has(entity)) {
                        seen.add(entity);
                        candidates.push(entity);
                    }
                }
            }
        }
        const result = [];

        for (const entity of candidates) {
            let dx = entity.x - x;
            let dy = entity.y - y;
            if (Math.abs(dx) > this.width / 2) dx -= Math.sign(dx) * this.width;
            if (Math.abs(dy) > this.height / 2) dy -= Math.sign(dy) * this.height;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius) {
                if (type === 'all') {
                    result.push(entity);
                } else if (type === 'creatures' && entity.isCreature) {
                    result.push(entity);
                } else if (type === 'food' && entity.isFood) {
                    result.push(entity);
                } else if (type === 'plants' && entity.isPlant) {
                    result.push(entity);
                }
            }
        }

        return result;
    }

    getZoneAt(x, y) {
        return zoneAt(this.zones, this.width, this.height, x, y);
    }

    getEnvironmentEffects() {
        if (!this.event) {
            return { plantGrowth: 1, plantSpawn: 1, plantDensity: 1, foodSpawn: 1,
                movement: 1, energyDrain: 1 };
        }
        return this.event.effects;
    }

    updateEnvironmentalEvent() {
        if (this.event) {
            this.event.remaining = Math.max(0, this.event.remaining - this.deltaTime);
            if (this.event.remaining === 0) {
                this.recordEvent(`${this.event.name} ended`, this.event.color);
                this.eventHistory.push(this.event.type);
                this.event = null;
                this.nextEventAt = this.time + 42 + Math.random() * 24;
            }
            return;
        }
        if (this.time < this.nextEventAt) return;
        const events = [
            { type: 'drought', name: 'Drought', duration: 24, color: '#f59e0b',
                summary: 'Dry air limits plant growth and food.' ,
                effects: { plantGrowth: 0.35, plantSpawn: 0.55, plantDensity: 0.65,
                    foodSpawn: 0.6, movement: 0.94, energyDrain: 1.06 } },
            { type: 'bloom', name: 'Algal bloom', duration: 22, color: '#22c55e',
                summary: 'A burst of growth feeds the ecosystem.',
                effects: { plantGrowth: 1.8, plantSpawn: 1.7, plantDensity: 1.25,
                    foodSpawn: 1.25, movement: 1, energyDrain: 0.98 } },
            { type: 'storm', name: 'Storm', duration: 18, color: '#60a5fa',
                summary: 'Heavy weather slows movement.',
                effects: { plantGrowth: 0.8, plantSpawn: 0.8, plantDensity: 0.9,
                    foodSpawn: 1.35, movement: 0.68, energyDrain: 1.12 } }
        ];
        const selected = events[Math.floor(Math.random() * events.length)];
        this.event = { ...selected, remaining: selected.duration };
        this.recordEvent(`${selected.name} started`, selected.color);
    }

    recordEvent(message, color = '#94a3b8') {
        this.analyticsLog.push({ time: this.time, message, color });
        if (this.analyticsLog.length > 40) this.analyticsLog.shift();
    }

    /**
     * Rebuild spatial grid from all entities
     */
    rebuildSpatialGrid() {
        this.spatialGrid.clear();

        for (const creature of this.creatures) {
            this.spatialGrid.insert(creature);
        }

        for (const food of this.food) {
            this.spatialGrid.insert(food);
        }
        for (const plant of this.plants) this.spatialGrid.insert(plant);
    }

    /**
     * Wrap position to world bounds (toroidal topology)
     */
    wrapPosition(x, y) {
        return {
            x: ((x % this.width) + this.width) % this.width,
            y: ((y % this.height) + this.height) % this.height
        };
    }

    /**
     * Clamp position to world bounds (box topology)
     */
    clampPosition(x, y) {
        return {
            x: Math.max(0, Math.min(this.width, x)),
            y: Math.max(0, Math.min(this.height, y))
        };
    }

    /**
     * Check if position is within world
     */
    isInBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    /**
     * Get world statistics
     */
    getStats() {
        const fitnessTotal = this.creatures.reduce((sum, creature) => sum + creature.fitness, 0);
        const zoneCounts = Object.fromEntries(Object.keys(ZONE_DEFINITIONS).map(type => [type, 0]));
        for (const creature of this.creatures) zoneCounts[this.getZoneAt(creature.x, creature.y).type] += 1;
        const species = new Set();
        const lineages = new Set();
            let infectedCount = 0;
            let totalPathogenLoad = 0;
            let totalDiseasePressure = 0;
            const diseaseBreakdown = { parasite: 0, virus: 0, fungus: 0, bacteria: 0 };
            const nicheBreakdown = { burrowing: 0, climbing: 0, nocturnal: 0, deepWater: 0, surface: 0 };

            for (const creature of this.creatures) {
                species.add(this.getSpeciesKey(creature));
                lineages.add(creature.lineageId || creature.id);

                // Disease stats
                if (creature.diseases && creature.diseases.length > 0) {
                    infectedCount++;
                    totalPathogenLoad += creature.pathogenLoad || 0;
                    for (const disease of creature.diseases) {
                        if (diseaseBreakdown[disease.type] !== undefined) {
                            diseaseBreakdown[disease.type]++;
                        }
                    }
                }

                // Niche stats
                if (creature.phenotype) {
                    if (creature.phenotype.burrowing > 0.5) nicheBreakdown.burrowing++;
                    if (creature.phenotype.climbing > 0.5) nicheBreakdown.climbing++;
                    if (creature.phenotype.nocturnal > 0.5) nicheBreakdown.nocturnal++;
                    if (creature.phenotype.waterDepthPreference > 0.5) nicheBreakdown.deepWater++;
                    if (creature.phenotype.surfaceFeeding > 0.5) nicheBreakdown.surface++;
                }
            }

            // Average disease pressure across grid
            let gridPressureSum = 0;
            let gridCells = 0;
            for (const row of this.diseasePressureGrid) {
                for (const cell of row) {
                    gridPressureSum += cell;
                    gridCells++;
                }
            }
            totalDiseasePressure = gridCells > 0 ? gridPressureSum / gridCells : 0;

            const predators = this.creatures.filter(creature => creature.isPredator).length;
            const herbivores = this.creatures.length - predators;
            const creatureLoad = this.settings.maxCreatures
                ? this.creatures.length / this.settings.maxCreatures : 0;
            const foodScarcity = this.settings.maxFood
                ? 1 - this.food.length / this.settings.maxFood : 1;
            const plantScarcity = this.settings.maxPlants
                ? 1 - this.plants.length / this.settings.maxPlants : 1;
            const resourcePressure = Math.max(0, Math.min(100,
                (creatureLoad * 0.45 + ((foodScarcity + plantScarcity) / 2) * 0.55)
                * (this.settings.resourcePressure || 1) * 100));
            return {
                creatures: this.creatures.length,
                food: this.food.length,
                plants: this.plants.length,
                plantEnergy: this.plants.reduce((sum, plant) => sum + plant.energy, 0),
                time: this.time,
                tick: this.tick,
                generation: this.maxGeneration,
                births: this.births,
                deaths: this.deaths,
                averageFitness: this.creatures.length ? fitnessTotal / this.creatures.length : 0,
                predators,
                herbivores,
                predatorRatio: this.creatures.length ? predators / this.creatures.length : 0,
                populationRatio: `${predators}:${herbivores}`,
                resourcePressure,
                predationKills: this.predationKills,
                zoneCounts,
                species: species.size,
                lineages: lineages.size,
                event: this.event,
                // Phase 29: Disease stats
                infectedCount,
                avgPathogenLoad: this.creatures.length ? totalPathogenLoad / this.creatures.length : 0,
                diseasePressure: totalDiseasePressure,
                diseaseBreakdown,
                // Phase 29: Niche stats
                nicheBreakdown
            };
        }

    getSpeciesKey(creature) {
        const genome = creature.genome;
        const diet = genome.diet >= 0.52 ? 'c' : 'h';
        const size = Math.round(genome.size / 3);
        const speed = Math.round(genome.speed / 10);
        const hue = Math.floor(genome.hue / 45);
        return `${diet}-${size}-${speed}-${hue}`;
    }

    /**
     * Return a JSON-safe snapshot. Pending work is deliberately excluded:
     * it contains live class instances and is recreated by the next update.
     */
    serialize() {
        return {
            version: 1,
            width: this.width,
            height: this.height,
            settings: { ...this.settings },
            time: this.time,
            tick: this.tick,
            foodSpawnAccumulator: this.foodSpawnAccumulator,
            plantSeedAccumulator: this.plantSeedAccumulator,
            nextFoodId: this.nextFoodId,
            births: this.births,
            deaths: this.deaths,
            predationKills: this.predationKills,
            maxGeneration: this.maxGeneration,
            nextEventAt: this.nextEventAt,
            event: this.event ? { ...this.event, effects: { ...this.event.effects } } : null,
            eventHistory: [...this.eventHistory],
            analyticsLog: this.analyticsLog.map(entry => ({ ...entry })),
            evolutionHistory: this.evolutionHistory.map(entry => ({
                ...entry,
                phenotype: { ...entry.phenotype },
                parentPhenotype: { ...entry.parentPhenotype },
                mutations: Array.isArray(entry.mutations)
                    ? entry.mutations.map(change => ({ ...change })) : []
            })),
                // Phase 29: Seasonal cycle state
                seasonIndex: this.seasonIndex,
                seasonTime: this.seasonTime,
                // Phase 29: Disease pressure grid
                diseasePressureGrid: this.diseasePressureGrid.map(row => [...row]),
                creatures: this.creatures.map(creature => ({
                    id: creature.id, x: creature.x, y: creature.y,
                    genome: { ...creature.genome, neuralWeights: { ...creature.genome.neuralWeights } },
                    energy: creature.energy, age: creature.age, generation: creature.generation,
                    parentId: creature.parentId, lineageId: creature.lineageId,
                    parentGenome: creature.parentGenome
                        ? { ...creature.parentGenome, neuralWeights: { ...creature.parentGenome.neuralWeights } } : null,
                    parentPhenotype: creature.parentPhenotype ? { ...creature.parentPhenotype } : null,
                    rotation: creature.rotation, alive: creature.alive,
                    attackCooldown: creature.attackCooldown,
                    reproductionCooldown: creature.reproductionCooldown,
                    deathCause: creature.deathCause || null,
                    behaviorStats: { ...creature.behaviorStats },
                    // Phase 29: Disease state
                    diseases: creature.diseases ? [...creature.diseases] : [],
                    pathogenLoad: creature.pathogenLoad || 0,
                    diseaseImmunity: creature.diseaseImmunity ? { ...creature.diseaseImmunity } : {}
                })),
                plants: this.plants.map(plant => ({
                    id: plant.id, x: plant.x, y: plant.y, age: plant.age,
                    energy: plant.energy, maxEnergy: plant.maxEnergy,
                    growthRate: plant.growthRate, lifespan: plant.lifespan,
                    seedTimer: plant.seedTimer, seedInterval: plant.seedInterval,
                    alive: plant.alive, zoneType: plant.zoneType
                })),
                food: this.food.map(food => ({ x: food.x, y: food.y, energy: food.energy, id: food.id }))
            };
        }

    /**
     * Restore a validated snapshot in place so renderer references remain valid.
     */
    loadSnapshot(snapshot) {
        if (!snapshot || snapshot.version !== 1 ||
            !Number.isFinite(snapshot.width) || !Number.isFinite(snapshot.height) ||
            snapshot.width <= 0 || snapshot.height <= 0 ||
            !Array.isArray(snapshot.creatures) || !Array.isArray(snapshot.plants) ||
            !Array.isArray(snapshot.food)) {
            throw new Error('Unsupported or malformed simulation snapshot.');
        }
        if (snapshot.creatures.length > 2000 || snapshot.plants.length > 5000 ||
            snapshot.food.length > 10000) {
            throw new Error('Snapshot contains too many entities.');
        }
        for (const creature of snapshot.creatures) {
            if (!creature || !Number.isFinite(Number(creature.x)) ||
                !Number.isFinite(Number(creature.y)) || !creature.genome ||
                typeof creature.genome !== 'object') {
                throw new Error('Invalid creature in snapshot.');
            }
        }
        for (const plant of snapshot.plants) {
            if (!plant || !Number.isFinite(Number(plant.x)) || !Number.isFinite(Number(plant.y))) {
                throw new Error('Invalid plant in snapshot.');
            }
        }
        for (const food of snapshot.food) {
            if (!food || !Number.isFinite(Number(food.x)) || !Number.isFinite(Number(food.y)) ||
                !Number.isFinite(Number(food.energy))) {
                throw new Error('Invalid food in snapshot.');
            }
        }
        if (snapshot.event !== null && snapshot.event !== undefined &&
            (!snapshot.event.effects || typeof snapshot.event.effects !== 'object')) {
            throw new Error('Invalid environmental event in snapshot.');
        }
        const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
        this.width = snapshot.width;
        this.height = snapshot.height;
        this.zones = createZones(this.width, this.height);
        this.spatialGrid = new SpatialGrid(this.width, this.height, 200);
        this.settings = { ...this.settings, ...(snapshot.settings || {}), worldSize: this.width };
        if (!PRESET_NAMES.includes(this.settings.preset)) this.settings.preset = 'sandbox';
        this.time = Math.max(0, finite(snapshot.time));
        this.tick = Math.max(0, Math.floor(finite(snapshot.tick)));
        this.foodSpawnAccumulator = Math.max(0, finite(snapshot.foodSpawnAccumulator));
        this.plantSeedAccumulator = Math.max(0, finite(snapshot.plantSeedAccumulator));
        this.nextFoodId = Math.max(1, Math.floor(finite(snapshot.nextFoodId, 1)));
        this.births = Math.max(0, Math.floor(finite(snapshot.births)));
        this.deaths = Math.max(0, Math.floor(finite(snapshot.deaths)));
        this.predationKills = Math.max(0, Math.floor(finite(snapshot.predationKills)));
        this.maxGeneration = Math.max(0, Math.floor(finite(snapshot.maxGeneration)));
        this.nextEventAt = Math.max(this.time, finite(snapshot.nextEventAt, this.time + 45));
        this.event = snapshot.event && typeof snapshot.event === 'object' ? { ...snapshot.event } : null;
        this.eventHistory = Array.isArray(snapshot.eventHistory) ? snapshot.eventHistory.slice(-100) : [];
        this.analyticsLog = Array.isArray(snapshot.analyticsLog)
            ? snapshot.analyticsLog.slice(-40).filter(entry => entry && typeof entry.message === 'string')
            : [];
        this.evolutionHistory = Array.isArray(snapshot.evolutionHistory)
            ? snapshot.evolutionHistory.slice(-160)
                .filter(entry => entry && Number.isFinite(Number(entry.id)))
                .map(entry => ({
                    ...entry,
                    phenotype: phenotypeSnapshot(entry.phenotype),
                    parentPhenotype: phenotypeSnapshot(entry.parentPhenotype),
                    mutations: Array.isArray(entry.mutations) ? entry.mutations.slice(0, 24) : []
                }))
            : [];
        this.pendingBirths = [];
        this.pendingPlantSeeds = [];
        this.creatures = snapshot.creatures.map(data => {
            if (!data || !Number.isFinite(Number(data.x)) || !Number.isFinite(Number(data.y)) ||
                !data.genome || typeof data.genome !== 'object') throw new Error('Invalid creature in snapshot.');
            const creature = new Creature(Number(data.x), Number(data.y), {
                id: data.id, genome: data.genome, energy: finite(data.energy),
                age: finite(data.age), generation: finite(data.generation),
                parentId: data.parentId, lineageId: data.lineageId,
                        parentGenome: data.parentGenome, parentPhenotype: data.parentPhenotype,
                        // Phase 29: Disease state
                        diseases: Array.isArray(data.diseases) ? data.diseases.map(d => ({...d})) : [],
                        pathogenLoad: finite(data.pathogenLoad, 0),
                        diseaseImmunity: data.diseaseImmunity && typeof data.diseaseImmunity === 'object' ? {...data.diseaseImmunity} : {}
                    });
                    creature.rotation = finite(data.rotation);
                    creature.alive = data.alive !== false;
                    creature.attackCooldown = Math.max(0, finite(data.attackCooldown));
                    creature.reproductionCooldown = Math.max(0, finite(data.reproductionCooldown));
                    creature.deathCause = data.deathCause || null;
                    creature.behaviorStats = { ...creature.behaviorStats, ...(data.behaviorStats || {}) };
                    return creature;
                });
        this.plants = snapshot.plants.map(data => {
            if (!data || !Number.isFinite(Number(data.x)) || !Number.isFinite(Number(data.y))) {
                throw new Error('Invalid plant in snapshot.');
            }
            const plant = new Plant(Number(data.x), Number(data.y), data);
            plant.alive = data.alive !== false;
            return plant;
        });
        this.food = snapshot.food.map(data => {
            if (!data || !Number.isFinite(Number(data.x)) || !Number.isFinite(Number(data.y)) ||
                !Number.isFinite(Number(data.energy))) throw new Error('Invalid food in snapshot.');
            return { x: Number(data.x), y: Number(data.y), energy: Number(data.energy),
                id: data.id, isFood: true };
        });
        this.rebuildSpatialGrid();
    }

    /**
     * Reset world to initial state
     */
    reset(resetTime = true) {
        const previousTime = this.time;
        const previousTick = this.tick;
        this.creatures = [];
        this.food = [];
        this.plants = [];
        this.time = resetTime ? 0 : previousTime;
        this.tick = resetTime ? 0 : previousTick;
        this.foodSpawnAccumulator = 0;
        this.plantSeedAccumulator = 0;
        this.pendingBirths = [];
        this.pendingPlantSeeds = [];
        this.births = 0;
        this.deaths = 0;
        this.predationKills = 0;
        this.maxGeneration = 0;
        this.event = null;
        this.nextEventAt = this.time + 38 + Math.random() * 18;
        this.eventHistory = [];
        this.analyticsLog = [];
        this.spatialGrid.clear();
            // Phase 29: Reset seasonal cycle
            this.seasonIndex = 0;
            this.seasonTime = 0;
            this.seasonTransitionTime = 0;
            // Phase 29: Reset disease pressure grid
            this.initDiseasePressureGrid();
        }
    }

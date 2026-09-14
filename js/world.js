/**
 * World: Central state container for the simulation
 * Manages all entities, environment settings, and world dimensions
 */

import { SpatialGrid } from './utils/spatialGrid.js';
import { Creature } from './entities/creature.js';
import { Plant } from './entities/plant.js';
import { createZones, zoneAt, ZONE_DEFINITIONS } from './utils/zones.js';

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
            foodSpawnRate: 2.0,        // food per second
            foodEnergy: 50,            // energy per food item
            maxFood: 500,              // maximum food items
            plantSpawnRate: 0.8,
            maxPlants: 260,
            maxCreatures: 180,
            worldSize: width,          // for UI reference
        };

        // Simulation time
        this.time = 0;
        this.tick = 0;
        this.deltaTime = 0;

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
    }

    /**
     * Update world state for one frame
     */
    update(deltaTime, simulationSpeed = 1) {
        this.deltaTime = deltaTime * simulationSpeed;
        this.time += this.deltaTime;
        this.rebuildSpatialGrid();

        // Spawn new food
        this.updateFoodSpawning();
        this.updatePlants();

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
            this.addCreature(new Creature(child.x, child.y, child));
            this.births += 1;
        }
        for (const seed of this.pendingPlantSeeds.splice(0)) this.addPlant(seed);

        // Rebuild spatial grid for proximity queries
        this.rebuildSpatialGrid();

        this.tick++;
    }

    updatePlants() {
        this.plantSeedAccumulator += this.settings.plantSpawnRate * this.deltaTime;
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

        this.foodSpawnAccumulator += this.settings.foodSpawnRate * this.deltaTime;

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
        if (Math.random() > zone.plantDensity) return;
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
            predators: this.creatures.filter(creature => creature.isPredator).length,
            predationKills: this.predationKills,
            zoneCounts
        };
    }

    /**
     * Reset world to initial state
     */
    reset() {
        this.creatures = [];
        this.food = [];
        this.plants = [];
        this.time = 0;
        this.tick = 0;
        this.foodSpawnAccumulator = 0;
        this.plantSeedAccumulator = 0;
        this.pendingBirths = [];
        this.pendingPlantSeeds = [];
        this.births = 0;
        this.deaths = 0;
        this.predationKills = 0;
        this.maxGeneration = 0;
        this.spatialGrid.clear();
    }
}

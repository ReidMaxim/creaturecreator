/**
 * World: Central state container for the simulation
 * Manages all entities, environment settings, and world dimensions
 */

import { SpatialGrid } from './utils/spatialGrid.js';
import { Creature } from './entities/creature.js';

export class World {
    constructor(width = 3000, height = 3000) {
        // Dimensions
        this.width = width;
        this.height = height;

        // Entity lists
        this.creatures = [];
        this.food = [];

        // Spatial optimization
        this.spatialGrid = new SpatialGrid(width, height, 200);

        // Environment settings
        this.settings = {
            foodSpawnRate: 2.0,        // food per second
            foodEnergy: 50,            // energy per food item
            maxFood: 500,              // maximum food items
            maxCreatures: 180,
            worldSize: width,          // for UI reference
        };

        // Simulation time
        this.time = 0;
        this.tick = 0;
        this.deltaTime = 0;

        // Spawning accumulator
        this.foodSpawnAccumulator = 0;
        this.pendingBirths = [];
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
        for (const child of this.pendingBirths.splice(0)) {
            this.addCreature(new Creature(child.x, child.y, child));
            this.births += 1;
        }

        // Rebuild spatial grid for proximity queries
        this.rebuildSpatialGrid();

        this.tick++;
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

        const food = {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            energy: this.settings.foodEnergy,
            id: this.nextFoodId++
        };

        this.food.push(food);
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
                } else if (type === 'food' && !entity.isCreature) {
                    result.push(entity);
                }
            }
        }

        return result;
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
        return {
            creatures: this.creatures.length,
            food: this.food.length,
            time: this.time,
            tick: this.tick,
            generation: this.maxGeneration,
            births: this.births,
            deaths: this.deaths,
            averageFitness: this.creatures.length ? fitnessTotal / this.creatures.length : 0,
            predators: this.creatures.filter(creature => creature.isPredator).length,
            predationKills: this.predationKills
        };
    }

    /**
     * Reset world to initial state
     */
    reset() {
        this.creatures = [];
        this.food = [];
        this.time = 0;
        this.tick = 0;
        this.foodSpawnAccumulator = 0;
        this.pendingBirths = [];
        this.births = 0;
        this.deaths = 0;
        this.predationKills = 0;
        this.maxGeneration = 0;
        this.spatialGrid.clear();
    }
}

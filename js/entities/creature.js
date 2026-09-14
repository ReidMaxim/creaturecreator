import { Genome } from '../genetics/genome.js';
import { makeChild } from '../genetics/reproduction.js';
import { randomAngle, randomFloat } from '../utils/random.js';
import { createBodyParts } from '../parts/bodyParts.js';
import { DecisionBrain } from '../brain/brain.js';

let nextCreatureId = 1;

export class Creature {
    constructor(x, y, options = {}) {
        this.id = options.id || nextCreatureId++;
        if (Number.isFinite(Number(options.id))) nextCreatureId = Math.max(nextCreatureId, Number(options.id) + 1);
        this.x = x;
        this.y = y;
        this.genome = options.genome instanceof Genome ? options.genome : new Genome(options.genome);
        this.parts = createBodyParts(this.genome);
        this.brain = new DecisionBrain(this.genome);
        this.size = this.genome.size;
        this.speed = this.genome.speed * this.parts.movementFactor * (0.82 + this.parts.agility * 0.18);
        this.maxEnergy = this.genome.maxEnergy;
        this.energy = Math.max(0, Math.min(this.maxEnergy,
            options.energy ?? randomFloat(this.maxEnergy * 0.7, this.maxEnergy)));
        this.age = Math.max(0, Math.min(180, Number(options.age) || 0));
        this.generation = options.generation || 0;
        this.parentId = options.parentId || null;
        this.parentIds = Array.isArray(options.parentIds) ? options.parentIds.slice(0, 2)
            : (this.parentId ? [this.parentId] : []);
        this.lineageId = options.lineageId || this.parentId || this.id;
        this.sex = options.sex === 'male' || options.sex === 'female'
            ? options.sex : (Math.random() < 0.5 ? 'male' : 'female');
        this.rotation = randomAngle();
        this.alive = true;
        this.isCreature = true;
        this.color = `hsl(${Math.round(this.genome.hue)} 75% 60%)`;
        this.isPredator = this.genome.diet >= 0.52;
        this.attackCooldown = 0;
        this.reproductionCooldown = 0;
        this.behaviorStats = {
            foodEaten: 0,
            kills: 0,
            distanceTravelled: 0,
            decisions: 0
        };
    }

    update(deltaTime, world) {
        this.age += deltaTime;
        this.reproductionCooldown = Math.max(0, this.reproductionCooldown - deltaTime);
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        const zone = world.getZoneAt(this.x, this.y);
        const effects = world.getEnvironmentEffects();
        this.energy -= deltaTime * (this.genome.metabolism + this.parts.metabolicCost)
            * zone.energyDrain * effects.energyDrain * (world.settings.resourcePressure || 1);
        if (this.energy <= 0 || this.age >= world.settings.maxAge) {
            this.alive = false;
            return;
        }

        const action = this.brain.decide(this, world, deltaTime);
        this.behaviorStats.decisions += 1;
        this.rotation += action.turn * (1.8 + this.genome.persistence * 0.35) * deltaTime;

        const position = world.wrapPosition(
            this.x + Math.cos(this.rotation) * this.speed * zone.movement
                * effects.movement * action.thrust * deltaTime,
            this.y + Math.sin(this.rotation) * this.speed * zone.movement
                * effects.movement * action.thrust * deltaTime
        );
        this.x = position.x;
        this.y = position.y;
        this.behaviorStats.distanceTravelled += this.speed * zone.movement
            * effects.movement * action.thrust * deltaTime;

        if (!this.isPredator) {
            for (const plant of world.getNearby(this.x, this.y, this.size + 8, 'plants')) {
                if (!plant.alive || this.distanceTo(plant, world) > this.size + 8) continue;
                const eaten = plant.consume(9 * deltaTime + 5);
                this.energy = Math.min(this.maxEnergy,
                    this.energy + eaten * this.genome.plantEfficiency);
                if (eaten > 0) this.behaviorStats.foodEaten += 1;
                break;
            }
            for (let index = world.food.length - 1; index >= 0; index -= 1) {
                const food = world.food[index];
                if (this.distanceTo(food, world) <= this.size + 6) {
                    if (this.parts.eatingEfficiency > 0) {
                        this.energy = Math.min(
                            this.maxEnergy,
                            this.energy + food.energy * this.parts.eatingEfficiency
                        );
                        this.behaviorStats.foodEaten += 1;
                        world.removeFood(index);
                    }

                    break;
                }
            }
        }

        if (this.isPredator && this.attackCooldown <= 0) {
            const attackRange = this.size + 5 + this.parts.bite * 5;
            let target = null;
            let targetDistance = attackRange;
            for (const candidate of world.getNearby(this.x, this.y, attackRange, 'creatures')) {
                if (candidate === this || !candidate.alive || candidate.isPredator) continue;
                const distance = this.distanceTo(candidate, world);
                if (distance < targetDistance) {
                    target = candidate;
                    targetDistance = distance;
                }
            }
            if (target) {
                const damage = this.parts.bite * (1.1 + this.genome.attack)
                    - target.parts.defense * 0.45;
                if (damage > 0.15) {
                    target.alive = false;
                    target.deathCause = 'predation';
                    this.energy = Math.min(this.maxEnergy, this.energy + 30 + damage * 14);
                    this.behaviorStats.kills += 1;
                    this.attackCooldown = Math.max(0.55, 1.8 - this.parts.bite * 0.5);
                    world.predationKills += 1;
                }
            }
        }

        if (this.age >= this.genome.reproductionAge &&
            this.energy >= this.genome.reproductionThreshold &&
            this.reproductionCooldown <= 0) {
            if (world.settings.reproductionMode === 'sexual') {
                const mate = world.getCompatibleMate(this);
                if (mate) {
                    this.energy -= world.settings.mateEnergyCost;
                    mate.energy -= world.settings.mateEnergyCost;
                    this.reproductionCooldown = world.settings.mateCooldown;
                    mate.reproductionCooldown = world.settings.mateCooldown;
                    world.queueBirth(makeChild(this, world, mate));
                } else {
                    const nearby = world.getNearby(this.x, this.y, world.settings.mateRange, 'creatures')
                        .find(candidate => candidate !== this && candidate.alive &&
                            candidate.sex !== this.sex && candidate.isPredator === this.isPredator);
                    if (nearby) {
                        let dx = nearby.x - this.x;
                        let dy = nearby.y - this.y;
                        if (Math.abs(dx) > world.width / 2) dx -= Math.sign(dx) * world.width;
                        if (Math.abs(dy) > world.height / 2) dy -= Math.sign(dy) * world.height;
                        this.rotation = Math.atan2(
                            dy, dx
                        );
                    }
                }
            } else {
                this.energy *= 0.52;
                this.reproductionCooldown = 4;
                world.queueBirth(makeChild(this, world));
            }
        }
    }

    get fitness() {
        return this.age + this.behaviorStats.foodEaten * 10 + this.behaviorStats.kills * 18
            + Math.min(this.energy, this.maxEnergy) * 0.05;
    }

    distanceTo(entity, world = null) {
        let dx = entity.x - this.x;
        let dy = entity.y - this.y;
        if (world) {
            if (Math.abs(dx) > world.width / 2) dx -= Math.sign(dx) * world.width;
            if (Math.abs(dy) > world.height / 2) dy -= Math.sign(dy) * world.height;
        }
        return Math.hypot(dx, dy);
    }
}

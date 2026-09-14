import { Genome } from '../genetics/genome.js';
import { makeChild } from '../genetics/reproduction.js';
import { randomAngle, randomFloat } from '../utils/random.js';
import { createBodyParts } from '../parts/bodyParts.js';
import { DecisionBrain } from '../brain/brain.js';

let nextCreatureId = 1;

export class Creature {
    constructor(x, y, options = {}) {
        this.id = options.id || nextCreatureId++;
        this.x = x;
        this.y = y;
        this.genome = options.genome instanceof Genome ? options.genome : new Genome(options.genome);
        this.parts = createBodyParts(this.genome);
        this.brain = new DecisionBrain(this.genome);
        this.size = this.genome.size;
        this.speed = this.genome.speed * this.parts.movementFactor;
        this.maxEnergy = this.genome.maxEnergy;
        this.energy = options.energy ?? randomFloat(this.maxEnergy * 0.7, this.maxEnergy);
        this.age = options.age || 0;
        this.generation = options.generation || 0;
        this.parentId = options.parentId || null;
        this.rotation = randomAngle();
        this.alive = true;
        this.isCreature = true;
        this.color = `hsl(${Math.round(this.genome.hue)} 75% 60%)`;
        this.reproductionCooldown = 0;
    }

    update(deltaTime, world) {
        this.age += deltaTime;
        this.reproductionCooldown = Math.max(0, this.reproductionCooldown - deltaTime);
        this.energy -= deltaTime * (this.genome.metabolism + this.parts.metabolicCost);
        if (this.energy <= 0 || this.age >= world.settings.maxAge) {
            this.alive = false;
            return;
        }

        const action = this.brain.decide(this, world, deltaTime);
        this.rotation += action.turn * (1.8 + this.genome.persistence * 0.35) * deltaTime;

        const position = world.wrapPosition(
            this.x + Math.cos(this.rotation) * this.speed * action.thrust * deltaTime,
            this.y + Math.sin(this.rotation) * this.speed * action.thrust * deltaTime
        );
        this.x = position.x;
        this.y = position.y;

        for (let index = world.food.length - 1; index >= 0; index -= 1) {
            const food = world.food[index];
            if (this.distanceTo(food, world) <= this.size + 6) {
                if (this.parts.eatingEfficiency > 0) {
                    this.energy = Math.min(
                        this.maxEnergy,
                        this.energy + food.energy * this.parts.eatingEfficiency
                    );
                    world.removeFood(index);
                }
                break;
            }
        }

        if (this.age >= this.genome.reproductionAge &&
            this.energy >= this.genome.reproductionThreshold &&
            this.reproductionCooldown <= 0) {
            this.energy *= 0.52;
            this.reproductionCooldown = 4;
            world.queueBirth(makeChild(this, world));
        }
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

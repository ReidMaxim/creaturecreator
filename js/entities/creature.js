import { Genome } from '../genetics/genome.js';
import { makeChild } from '../genetics/reproduction.js';
import { random, randomAngle, randomFloat } from '../utils/random.js';

let nextCreatureId = 1;

export class Creature {
    constructor(x, y, options = {}) {
        this.id = options.id || nextCreatureId++;
        this.x = x;
        this.y = y;
        this.genome = options.genome instanceof Genome ? options.genome : new Genome(options.genome);
        this.size = this.genome.size;
        this.speed = this.genome.speed;
        this.maxEnergy = this.genome.maxEnergy;
        this.energy = options.energy ?? randomFloat(this.maxEnergy * 0.7, this.maxEnergy);
        this.age = options.age || 0;
        this.generation = options.generation || 0;
        this.parentId = options.parentId || null;
        this.rotation = randomAngle();
        this.alive = true;
        this.isCreature = true;
        this.color = `hsl(${Math.round(this.genome.hue)} 75% 60%)`;
        this.wanderTimer = randomFloat(0, 2);
        this.reproductionCooldown = 0;
    }

    update(deltaTime, world) {
        this.age += deltaTime;
        this.reproductionCooldown = Math.max(0, this.reproductionCooldown - deltaTime);
        this.energy -= deltaTime * this.genome.metabolism;
        if (this.energy <= 0 || this.age >= world.settings.maxAge) {
            this.alive = false;
            return;
        }

        const nearbyFood = world.getNearby(this.x, this.y, this.genome.vision, 'food');
        if (nearbyFood.length) {
            const target = nearbyFood.reduce((closest, food) =>
                this.distanceTo(food, world) < this.distanceTo(closest, world) ? food : closest
            );
            this.rotation = Math.atan2(target.y - this.y, target.x - this.x);
        } else {
            this.wanderTimer -= deltaTime;
            if (this.wanderTimer <= 0) {
                this.rotation += randomFloat(-1.2, 1.2);
                this.wanderTimer = randomFloat(0.5, 2);
            }
        }

        const position = world.wrapPosition(
            this.x + Math.cos(this.rotation) * this.speed * deltaTime,
            this.y + Math.sin(this.rotation) * this.speed * deltaTime
        );
        this.x = position.x;
        this.y = position.y;

        for (let index = world.food.length - 1; index >= 0; index -= 1) {
            const food = world.food[index];
            if (this.distanceTo(food, world) <= this.size + 6) {
                this.energy = Math.min(this.maxEnergy, this.energy + food.energy);
                world.removeFood(index);
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

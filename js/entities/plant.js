import { randomFloat } from '../utils/random.js';

let nextPlantId = 1;

export class Plant {
    constructor(x, y, options = {}) {
        this.id = options.id || nextPlantId++;
        this.x = x;
        this.y = y;
        this.age = options.age || 0;
        this.energy = options.energy ?? 8;
        this.maxEnergy = options.maxEnergy ?? randomFloat(18, 30);
        this.growthRate = options.growthRate ?? randomFloat(1.8, 3.2);
        this.lifespan = options.lifespan ?? randomFloat(90, 150);
        this.seedTimer = options.seedTimer ?? randomFloat(8, 18);
        this.seedInterval = options.seedInterval ?? randomFloat(15, 28);
        this.alive = true;
        this.isPlant = true;
        this.zoneType = options.zoneType || 'meadow';
    }

    update(deltaTime, world) {
        this.age += deltaTime;
        const zone = world.getZoneAt(this.x, this.y);
        this.zoneType = zone.type;
        this.energy = Math.min(this.maxEnergy, this.energy + this.growthRate * zone.plantGrowth * deltaTime);
        this.seedTimer -= deltaTime;
        if (this.seedTimer <= 0 && this.energy >= this.maxEnergy * 0.55) {
            world.queuePlantSeed(this);
            this.seedTimer = this.seedInterval;
        }
        if (this.age >= this.lifespan && this.energy <= this.maxEnergy * 0.25) {
            this.alive = false;
            if (Math.random() < 0.7) world.queuePlantSeed(this);
        }
    }

    consume(amount) {
        const eaten = Math.min(this.energy, Math.max(0, amount));
        this.energy -= eaten;
        if (this.energy <= 0.5) this.alive = false;
        return eaten;
    }
}

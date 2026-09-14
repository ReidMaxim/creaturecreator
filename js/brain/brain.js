import { randomFloat } from '../utils/random.js';
import { clamp, normalizeAngle } from './actions.js';
import { senseCreature } from './sensors.js';

export class DecisionBrain {
    constructor(genome) {
        this.genome = genome;
        this.wanderTimer = randomFloat(0, 2);
        this.wanderDirection = randomFloat(-1, 1);
        this.lastAction = { turn: 0, thrust: 1 };
    }

    decide(creature, world, deltaTime) {
        const senses = senseCreature(creature, world);
        this.wanderTimer -= deltaTime;
        if (this.wanderTimer <= 0) {
            this.wanderDirection = randomFloat(-1, 1);
            this.wanderTimer = randomFloat(0.5, 2);
        }

        const foodSignal = senses.foodVisible ? 1 - senses.foodDistance : 0;
        const foodAngle = normalizeAngle(senses.foodDirection - creature.rotation);
        const urgency = 1 - clamp(senses.energy, 0, 1);
        const ageFactor = clamp(senses.age, 0, 1);
        const riskDrive = 0.7 + this.genome.risk * (0.35 + urgency * 0.65);
        const foodTurn = Math.sin(foodAngle) * foodSignal * this.genome.foodAttraction * riskDrive;
        const wanderTurn = this.wanderDirection * this.genome.wander
            * (1 + ageFactor * 0.25) * (1 - foodSignal * 0.75);
        const turn = clamp(
            foodTurn + wanderTurn + this.lastAction.turn * this.genome.persistence * 0.12,
            -1,
            1
        );
        const thrust = clamp(
            0.75 + this.genome.risk * 0.12 + foodSignal * 0.18
                + urgency * this.genome.risk * 0.15 - ageFactor * 0.1,
            0.35,
            1.2
        );

        this.lastAction = { turn, thrust, senses };
        return this.lastAction;
    }
}

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
        const weights = this.genome.neuralWeights;
        const inputs = {
            foodDirection: Math.sin(foodAngle) * (senses.foodVisible ? 1 : 0)
                * this.genome.foodAttraction,
            foodDistance: foodSignal * this.genome.foodAttraction,
            energyUrgency: urgency,
            wander: this.wanderDirection * this.genome.wander
                * (1 + ageFactor * 0.25) * (1 - foodSignal * 0.75),
            persistence: this.lastAction.turn * this.genome.persistence,
            risk: urgency * this.genome.risk,
            bias: 1
        };
        // This compact linear policy is the creature's mutable neural circuit.
        // Scalar genes still scale its sensory and motor hardware, while the
        // inherited weights decide how those signals are combined.
        const turnSignal = NEURAL_INPUTS.reduce(
            (sum, name) => sum + inputs[name] * weights[name],
            0
        );
        const turn = clamp(Math.tanh(turnSignal), -1, 1);
        const driveSignal = weights.foodDistance * foodSignal
            + weights.energyUrgency * urgency
            + weights.risk * urgency * this.genome.risk
            + weights.bias;
        const thrust = clamp(
            0.78 + Math.tanh(driveSignal) * 0.25
                + this.genome.risk * 0.08 - ageFactor * 0.1,
            0.35,
            1.2
        );

        this.lastAction = { turn, thrust, senses };
        return this.lastAction;
    }
}

const NEURAL_INPUTS = [
    'foodDirection',
    'foodDistance',
    'energyUrgency',
    'wander',
    'persistence',
    'risk',
    'bias'
];

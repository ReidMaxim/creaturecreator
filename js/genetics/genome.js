import { random, randomFloat, randomGaussian, randomInt } from '../utils/random.js';

export const GENE_LIMITS = {
    size: [6, 22],
    speed: [12, 75],
    metabolism: [0.7, 3.8],
    vision: [70, 280],
    hue: [0, 360],
    reproductionThreshold: [105, 155],
    reproductionAge: [8, 45],
    eyeCount: [0, 3],
    eyeStrength: [0.2, 1],
    mouthCount: [0, 3],
    mouthStrength: [0.2, 1],
    motorCount: [0, 3],
    motorStrength: [0.2, 1],
    foodAttraction: [0, 1.5],
    wander: [0, 1.2],
    persistence: [0, 1.5],
    risk: [0, 1.2],
    diet: [0, 1],
    attack: [0.15, 1],
    defense: [0.15, 1],
    agility: [0.2, 1],
    plantPreference: [0, 1],
    plantEfficiency: [0.45, 1.25],
    scavenging: [0, 1]
};

// A small policy vector keeps behavior heritable without introducing a
// heavyweight neural-network runtime. Values are intentionally bounded so a
// rare mutation cannot make a creature uncontrollable.
export const NEURAL_WEIGHT_NAMES = [
    'foodDirection',
    'foodDistance',
    'energyUrgency',
    'wander',
    'persistence',
    'risk',
    'bias'
];

const DEFAULT_NEURAL_WEIGHTS = {
    foodDirection: 1.15,
    foodDistance: 0.55,
    energyUrgency: 0.35,
    wander: 0.45,
    persistence: 0.2,
    risk: 0.25,
    bias: 0
};

const NEURAL_WEIGHT_LIMIT = 2;

export class Genome {
    constructor(values = {}) {
        this.size = values.size ?? randomFloat(8, 14);
        this.speed = values.speed ?? randomFloat(24, 48);
        this.metabolism = values.metabolism ?? randomFloat(1.2, 2.3);
        this.vision = values.vision ?? randomFloat(130, 210);
        this.hue = values.hue ?? randomFloat(0, 360);
        this.reproductionThreshold = values.reproductionThreshold ?? randomFloat(120, 155);
        this.reproductionAge = values.reproductionAge ?? randomFloat(12, 24);
        this.eyeCount = values.eyeCount ?? randomInt(1, 3);
        this.eyeStrength = values.eyeStrength ?? randomFloat(0.55, 1);
        this.mouthCount = values.mouthCount ?? randomInt(1, 2);
        this.mouthStrength = values.mouthStrength ?? randomFloat(0.55, 1);
        this.motorCount = values.motorCount ?? randomInt(1, 3);
        this.motorStrength = values.motorStrength ?? randomFloat(0.55, 1);
        this.foodAttraction = values.foodAttraction ?? randomFloat(0.75, 1.15);
        this.wander = values.wander ?? randomFloat(0.2, 0.65);
        this.persistence = values.persistence ?? randomFloat(0.55, 1.1);
        this.risk = values.risk ?? randomFloat(0.25, 0.8);
        this.diet = values.diet ?? randomFloat(0.05, 0.65);
        this.attack = values.attack ?? randomFloat(0.35, 0.75);
        this.defense = values.defense ?? randomFloat(0.3, 0.75);
        this.agility = values.agility ?? randomFloat(0.35, 0.8);
        this.plantPreference = values.plantPreference ?? randomFloat(0.55, 0.95);
        this.plantEfficiency = values.plantEfficiency ?? randomFloat(0.7, 1.05);
        this.scavenging = values.scavenging ?? randomFloat(0.1, 0.75);
        this.neuralWeights = {};
        const inheritedWeights = values.neuralWeights || {};
        for (const name of NEURAL_WEIGHT_NAMES) {
            const value = Array.isArray(inheritedWeights)
                ? inheritedWeights[NEURAL_WEIGHT_NAMES.indexOf(name)]
                : inheritedWeights[name];
            this.neuralWeights[name] = Number.isFinite(value)
                ? Math.max(-NEURAL_WEIGHT_LIMIT, Math.min(NEURAL_WEIGHT_LIMIT, value))
                : DEFAULT_NEURAL_WEIGHTS[name];
        }
    }

    clone() {
        return new Genome({
            ...this,
            neuralWeights: { ...this.neuralWeights }
        });
    }

    mutated(rate = 0.08) {
        const child = this.clone();
        for (const gene of Object.keys(GENE_LIMITS)) {
            if (random() < rate) {
                const [min, max] = GENE_LIMITS[gene];
                const span = max - min;
                child[gene] += randomGaussian(0, span * 0.08);
                if (gene === 'hue') child[gene] = (child[gene] + 360) % 360;
                else child[gene] = Math.max(min, Math.min(max, child[gene]));
            }
        }
        for (const name of NEURAL_WEIGHT_NAMES) {
            if (random() < rate) {
                child.neuralWeights[name] = Math.max(
                    -NEURAL_WEIGHT_LIMIT,
                    Math.min(NEURAL_WEIGHT_LIMIT, child.neuralWeights[name] + randomGaussian(0, 0.16))
                );
            }
        }
        return child;
    }

    static recombine(first, second) {
        const values = {};
        for (const gene of Object.keys(GENE_LIMITS)) {
            values[gene] = random() < 0.5 ? first[gene] : second[gene];
        }
        values.neuralWeights = {};
        for (const name of NEURAL_WEIGHT_NAMES) {
            values.neuralWeights[name] = random() < 0.5
                ? first.neuralWeights[name] : second.neuralWeights[name];
        }
        return new Genome(values);
    }

    get maxEnergy() {
        return 95 + this.size * 6;
    }
}

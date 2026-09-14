import { random, randomFloat, randomGaussian, randomInt } from '../utils/random.js';
const bounded = (value, min, max, fallback) => Number.isFinite(Number(value))
    ? Math.max(min, Math.min(max, Number(value))) : fallback;

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
    bodyShape: [0, 3],
    bodyWidth: [0.65, 1.45],
    bodyLength: [0.75, 1.65],
    bodyTaper: [0.55, 1.35],
    tailStyle: [0, 2],
    pattern: [0, 3],
    patternScale: [0.45, 1.5],
    saturation: [0.35, 1],
    lightness: [0.35, 0.75],
    eyeStyle: [0, 2],
    eyeSpacing: [0.55, 1.45],
    pupilSize: [0.2, 0.75],
    mouthStyle: [0, 2],
    mouthSize: [0.55, 1.45],
    armor: [0, 1],
    fin: [0, 1],
    finAngle: [-0.45, 0.45],
    motorLength: [0.55, 1.45]
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
        this.bodyShape = bounded(values.bodyShape, 0, 3, randomInt(0, 4));
        this.bodyWidth = bounded(values.bodyWidth, 0.65, 1.45, randomFloat(0.82, 1.2));
        this.bodyLength = bounded(values.bodyLength, 0.75, 1.65, randomFloat(0.9, 1.35));
        this.bodyTaper = bounded(values.bodyTaper, 0.55, 1.35, randomFloat(0.75, 1.15));
        this.tailStyle = bounded(values.tailStyle, 0, 2, randomInt(0, 3));
        this.pattern = bounded(values.pattern, 0, 3, randomInt(0, 4));
        this.patternScale = bounded(values.patternScale, 0.45, 1.5, randomFloat(0.75, 1.2));
        this.saturation = bounded(values.saturation, 0.35, 1, randomFloat(0.62, 0.92));
        this.lightness = bounded(values.lightness, 0.35, 0.75, randomFloat(0.5, 0.68));
        this.eyeStyle = bounded(values.eyeStyle, 0, 2, randomInt(0, 3));
        this.eyeSpacing = bounded(values.eyeSpacing, 0.55, 1.45, randomFloat(0.8, 1.2));
        this.pupilSize = bounded(values.pupilSize, 0.2, 0.75, randomFloat(0.32, 0.55));
        this.mouthStyle = bounded(values.mouthStyle, 0, 2, randomInt(0, 3));
        this.mouthSize = bounded(values.mouthSize, 0.55, 1.45, randomFloat(0.8, 1.2));
        this.armor = bounded(values.armor, 0, 1, randomFloat(0.25, 0.8));
        this.fin = bounded(values.fin, 0, 1, randomFloat(0.25, 0.85));
        this.finAngle = bounded(values.finAngle, -0.45, 0.45, randomFloat(-0.18, 0.18));
        this.motorLength = bounded(values.motorLength, 0.55, 1.45, randomFloat(0.8, 1.2));
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

    get maxEnergy() {
        return 95 + this.size * 6;
    }
}

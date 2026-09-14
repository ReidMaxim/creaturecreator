import { random, randomFloat, randomGaussian } from '../utils/random.js';

export const GENE_LIMITS = {
    size: [6, 22],
    speed: [12, 75],
    metabolism: [0.7, 3.8],
    vision: [70, 280],
    hue: [0, 360],
    reproductionThreshold: [105, 155],
    reproductionAge: [8, 45]
};

export class Genome {
    constructor(values = {}) {
        this.size = values.size ?? randomFloat(8, 14);
        this.speed = values.speed ?? randomFloat(24, 48);
        this.metabolism = values.metabolism ?? randomFloat(1.2, 2.3);
        this.vision = values.vision ?? randomFloat(130, 210);
        this.hue = values.hue ?? randomFloat(0, 360);
        this.reproductionThreshold = values.reproductionThreshold ?? randomFloat(120, 155);
        this.reproductionAge = values.reproductionAge ?? randomFloat(12, 24);
    }

    clone() {
        return new Genome(this);
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
        return child;
    }

    get maxEnergy() {
        return 95 + this.size * 6;
    }
}

/**
 * Seedable random number generator
 * Provides consistent, reproducible randomness
 */

export class SeededRandom {
    constructor(seed = Math.random() * 0xffffffff) {
        this.seed = seed >>> 0;
        this.m = 0x80000000;
        this.a = 1103515245;
        this.c = 12345;
    }

    /**
     * Generate next random float [0, 1)
     */
    next() {
        this.seed = (this.a * this.seed + this.c) % this.m;
        return (this.seed / this.m);
    }

    /**
     * Random integer [min, max)
     */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min)) + min;
    }

    /**
     * Random float [min, max)
     */
    nextFloat(min, max) {
        return this.next() * (max - min) + min;
    }

    /**
     * Random boolean with given probability [0, 1]
     */
    nextBool(probability = 0.5) {
        return this.next() < probability;
    }

    /**
     * Gaussian/normal distribution
     */
    nextGaussian(mean = 0, stdDev = 1) {
        let u1, u2;
        do {
            u1 = this.next();
        } while (u1 === 0);
        u2 = this.next();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return z0 * stdDev + mean;
    }

    /**
     * Random element from array
     */
    choose(array) {
        return array[this.nextInt(0, array.length)];
    }

    /**
     * Shuffle array in-place (Fisher-Yates)
     */
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i + 1);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Global random instance (seeded with current time for variety)
export const globalRandom = new SeededRandom(Date.now());

/**
 * Random float [0, 1)
 */
export function random() {
    return globalRandom.next();
}

/**
 * Random integer [min, max)
 */
export function randomInt(min, max) {
    return globalRandom.nextInt(min, max);
}

/**
 * Random float [min, max)
 */
export function randomFloat(min, max) {
    return globalRandom.nextFloat(min, max);
}

/**
 * Random boolean with probability [0, 1]
 */
export function randomBool(probability = 0.5) {
    return globalRandom.nextBool(probability);
}

/**
 * Random from gaussian distribution
 */
export function randomGaussian(mean = 0, stdDev = 1) {
    return globalRandom.nextGaussian(mean, stdDev);
}

/**
 * Pick random element from array
 */
export function randomChoice(array) {
    return globalRandom.choose(array);
}

/**
 * Random angle [0, 2π)
 */
export function randomAngle() {
    return globalRandom.next() * Math.PI * 2;
}

/**
 * Random point in circle
 */
export function randomPointInCircle(radius) {
    const angle = randomAngle();
    const r = Math.sqrt(globalRandom.next()) * radius;
    return {
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
    };
}

/**
 * Convert inherited part genes into the functional body plan used by a creature.
 * Keeping this derived data separate means rendering and simulation use the same traits.
 */
export function createBodyParts(genome) {
    const part = (count, strength) => ({
        count: Math.max(0, Math.round(count)),
        strength: Math.max(0, Math.min(1, strength))
    });

    const eyes = part(genome.eyeCount, genome.eyeStrength);
    const mouth = part(genome.mouthCount, genome.mouthStrength);
    const motor = part(genome.motorCount, genome.motorStrength);

    return {
        eyes,
        mouth,
        motor,
        vision: genome.vision * (eyes.count ? 0.35 + eyes.count * eyes.strength * 0.32 : 0),
        eatingEfficiency: mouth.count
            ? Math.min(1.35, 0.25 + mouth.count * mouth.strength * 0.36)
            : 0,
        movementFactor: motor.count
            ? Math.min(1.45, 0.3 + motor.count * motor.strength * 0.38)
            : 0,
        metabolicCost: (eyes.count * eyes.strength * 0.08)
            + (mouth.count * mouth.strength * 0.06)
            + (motor.count * motor.strength * 0.12)
            + genome.diet * 0.12 + genome.attack * 0.08,
        bite: genome.mouthCount
            ? Math.min(1.5, genome.attack * (0.35 + genome.mouthCount * genome.mouthStrength * 0.45))
            : 0,
        defense: Math.min(1.5, genome.defense * (0.6 + genome.size / 30)),
        agility: Math.min(1.5, genome.agility * (0.65 + motor.count * motor.strength * 0.18))
    };
}

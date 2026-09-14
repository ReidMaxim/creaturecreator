const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

const hue = value => ((Number(value) || 0) % 360 + 360) % 360;

/**
 * Convert legacy-compatible genome values into the bounded body plan shared
 * by simulation and rendering. Missing Phase 27 genes intentionally receive
 * neutral defaults so old saves remain valid.
 */
export function derivePhenotype(genome) {
    const growth = clamp((genome.age || 0) / Math.max(1, genome.reproductionAge || 18), 0, 1);
    const shape = Math.round(clamp(genome.bodyShape ?? 0, 0, 3));
    const width = clamp(genome.bodyWidth ?? 1, 0.65, 1.45);
    const length = clamp(genome.bodyLength ?? 1, 0.75, 1.65);
    const taper = clamp(genome.bodyTaper ?? 1, 0.55, 1.35);
    const tail = Math.round(clamp(genome.tailStyle ?? shape, 0, 2));
    const pattern = Math.round(clamp(genome.pattern ?? 0, 0, 3));
    const patternScale = clamp(genome.patternScale ?? 1, 0.45, 1.5);
    const armor = clamp(genome.armor ?? genome.defense ?? 0.5, 0, 1);
    const fin = clamp(genome.fin ?? genome.motorStrength ?? 0.6, 0, 1);
    const saturation = clamp(genome.saturation ?? 0.75, 0.35, 1);
    const lightness = clamp(genome.lightness ?? 0.6, 0.35, 0.75);
    const primaryHue = hue(genome.hue);
    return {
        shape, width, length, taper, tail, pattern, patternScale, armor, fin,
        growth: 0.72 + growth * 0.28,
        radius: clamp((genome.size || 10) * (0.86 + width * 0.14), 5, 32),
        color: `hsl(${Math.round(primaryHue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%)`,
        accentColor: `hsl(${Math.round(hue(primaryHue + 28 + pattern * 17))} ${Math.round(saturation * 95)}% ${Math.round(clamp(lightness + 0.12, 0.45, 0.86) * 100)}%)`,
        eyeStyle: Math.round(clamp(genome.eyeStyle ?? shape, 0, 2)),
        eyeSpacing: clamp(genome.eyeSpacing ?? 1, 0.55, 1.45),
        pupilSize: clamp(genome.pupilSize ?? 0.45, 0.2, 0.75),
        mouthStyle: Math.round(clamp(genome.mouthStyle ?? pattern, 0, 2)),
        mouthSize: clamp(genome.mouthSize ?? 1, 0.55, 1.45),
        finAngle: clamp(genome.finAngle ?? 0, -0.45, 0.45),
        motorLength: clamp(genome.motorLength ?? 1, 0.55, 1.45),
        state: 'stable'
    };
}

export function phenotypeState(creature) {
    if (!creature.alive) return 'dead';
    if (creature.energy <= creature.maxEnergy * 0.25) return 'hungry';
    if (creature.isPredator && creature.attackCooldown <= 0) return 'alert';
    if (creature.brain?.lastAction?.thrust > 0.65) return 'moving';
    return 'stable';
}

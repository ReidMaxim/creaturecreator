const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

const hue = value => ((Number(value) || 0) % 360 + 360) % 360;

const LINEAGE_PALETTE = ['#4ade80', '#60a5fa', '#f472b6', '#facc15', '#c084fc', '#fb923c'];

export function lineageColor(lineageId) {
    const text = String(lineageId ?? '0');
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
    return LINEAGE_PALETTE[hash % LINEAGE_PALETTE.length];
}

export function phenotypeSnapshot(phenotype = {}) {
    return {
        shape: phenotype.shape ?? 0,
        width: phenotype.width ?? 1,
        length: phenotype.length ?? 1,
        taper: phenotype.taper ?? 1,
        tail: phenotype.tail ?? 0,
        pattern: phenotype.pattern ?? 0,
        armor: phenotype.armor ?? 0,
        fin: phenotype.fin ?? 0,
        color: phenotype.color || '#94a3b8'
    };
}

export function compareGenomeGenes(parentGenome, childGenome) {
    if (!parentGenome || !childGenome) return [];
    const changes = [];
    const names = ['size', 'hue', 'bodyShape', 'bodyWidth', 'bodyLength', 'bodyTaper',
        'tailStyle', 'pattern', 'patternScale', 'armor', 'fin', 'finAngle', 'motorLength'];
    for (const name of names) {
        const before = Number(parentGenome[name]);
        const after = Number(childGenome[name]);
        if (!Number.isFinite(before) || !Number.isFinite(after)) continue;
        const difference = name === 'hue'
            ? Math.min(Math.abs(after - before), 360 - Math.abs(after - before))
            : Math.abs(after - before);
        const threshold = ['bodyShape', 'tailStyle', 'pattern'].includes(name) ? 0.5 : 0.01;
        if (difference >= threshold) changes.push({ name, before, after });
    }
    return changes;
}

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

    // Phase 29: Disease system phenotype
    const immunity = clamp(genome.immunity ?? 0.4, 0, 1);
    const diseaseResistance = clamp(genome.diseaseResistance ?? 0.3, 0, 1);
    const pathogenTolerance = clamp(genome.pathogenTolerance ?? 0.2, 0, 1);

    // Phase 29: Seasonal adaptation phenotype
    const coldAdaptation = clamp(genome.coldAdaptation ?? 0.45, 0, 1);
    const heatAdaptation = clamp(genome.heatAdaptation ?? 0.45, 0, 1);
    const seasonalMetabolism = clamp(genome.seasonalMetabolism ?? 1, 0.5, 1.5);

    // Phase 29: Niche specialization phenotype
    const burrowing = clamp(genome.burrowing ?? 0, 0, 1);
    const climbing = clamp(genome.climbing ?? 0, 0, 1);
    const nocturnal = clamp(genome.nocturnal ?? 0, 0, 1);
    const waterDepthPreference = clamp(genome.waterDepthPreference ?? 0.5, 0, 1);
    const surfaceFeeding = clamp(genome.surfaceFeeding ?? 0.55, 0, 1);
    const deepWaterForaging = clamp(genome.deepWaterForaging ?? 0.3, 0, 1);

    // Compute niche type for rendering and mechanics
    const nicheType = (() => {
        if (burrowing > 0.6) return 'burrower';
        if (climbing > 0.6) return 'climber';
        if (nocturnal > 0.6) return 'nocturnal';
        if (waterDepthPreference > 0.7 && deepWaterForaging > 0.5) return 'deepWater';
        if (waterDepthPreference < 0.3 && surfaceFeeding > 0.6) return 'surfaceFeeder';
        return 'generalist';
    })();

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
        state: 'stable',
        // Phase 29 additions
        immunity,
        diseaseResistance,
        pathogenTolerance,
        coldAdaptation,
        heatAdaptation,
        seasonalMetabolism,
        burrowing,
        climbing,
        nocturnal,
        waterDepthPreference,
        surfaceFeeding,
        deepWaterForaging,
        nicheType
    };
}

export function phenotypeState(creature) {
    if (!creature.alive) return 'dead';
    if (creature.energy <= creature.maxEnergy * 0.25) return 'hungry';
    if (creature.isPredator && creature.attackCooldown <= 0) return 'alert';
    if (creature.brain?.lastAction?.thrust > 0.65) return 'moving';
    return 'stable';
}

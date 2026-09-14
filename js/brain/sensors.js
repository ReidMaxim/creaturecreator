function toroidalDelta(from, to, world) {
    let dx = to.x - from.x;
    let dy = to.y - from.y;
    if (Math.abs(dx) > world.width / 2) dx -= Math.sign(dx) * world.width;
    if (Math.abs(dy) > world.height / 2) dy -= Math.sign(dy) * world.height;
    return { dx, dy };
}

export function senseCreature(creature, world) {
    const vision = creature.parts.vision;
    let food = null;
    let nearestDistance = vision;

    if (vision > 0) {
        const foodCandidates = [
            ...world.getNearby(creature.x, creature.y, vision, 'plants'),
            ...world.getNearby(creature.x, creature.y, vision, 'food'),
            ...world.getNearby(creature.x, creature.y, vision, 'carcasses')
        ];
        for (const candidate of foodCandidates) {
            const { dx, dy } = toroidalDelta(creature, candidate, world);
            const attraction = candidate.isPlant
                ? (1 - creature.genome.plantPreference * 0.35)
                : candidate.isCarcass ? (1.15 - creature.genome.scavenging * 0.45) : 1;
            const distance = Math.hypot(dx, dy) * attraction;
            if (distance < nearestDistance) {
                nearestDistance = distance;
                food = { direction: Math.atan2(dy, dx), distance,
                    isPlant: candidate.isPlant, isCarcass: candidate.isCarcass };
            }
        }
    }

    let prey = null;
    let threat = null;
    let preyDistance = vision;
    let threatDistance = vision;
    for (const candidate of world.getNearby(creature.x, creature.y, vision, 'creatures')) {
        if (candidate === creature || !candidate.alive) continue;
        const { dx, dy } = toroidalDelta(creature, candidate, world);
        const distance = Math.hypot(dx, dy);
        if (candidate.genome.diet < creature.genome.diet - 0.08 && distance < preyDistance) {
            preyDistance = distance;
            prey = { direction: Math.atan2(dy, dx), distance };
        }
        if (candidate.genome.diet > creature.genome.diet + 0.08 && distance < threatDistance) {
            threatDistance = distance;
            threat = { direction: Math.atan2(dy, dx), distance };
        }
    }

    return {
        foodDirection: food ? food.direction : creature.rotation,
        foodDistance: food ? food.distance / Math.max(vision, 1) : 1,
        foodVisible: Boolean(food),
        preyDirection: prey ? prey.direction : creature.rotation,
        preyDistance: prey ? prey.distance / Math.max(vision, 1) : 1,
        preyVisible: Boolean(prey),
        threatDirection: threat ? threat.direction : creature.rotation,
        threatDistance: threat ? threat.distance / Math.max(vision, 1) : 1,
        threatVisible: Boolean(threat),
        energy: creature.energy / creature.maxEnergy,
        age: creature.age / Math.max(world.settings.maxAge, 1),
        plantVisible: Boolean(food && food.isPlant),
        carcassVisible: Boolean(food && food.isCarcass)
    };
}

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
        for (const candidate of world.getNearby(creature.x, creature.y, vision, 'food')) {
            const { dx, dy } = toroidalDelta(creature, candidate, world);
            const distance = Math.hypot(dx, dy);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                food = { direction: Math.atan2(dy, dx), distance };
            }
        }
    }

    return {
        foodDirection: food ? food.direction : creature.rotation,
        foodDistance: food ? food.distance / Math.max(vision, 1) : 1,
        foodVisible: Boolean(food),
        energy: creature.energy / creature.maxEnergy,
        age: creature.age / Math.max(world.settings.maxAge, 1)
    };
}

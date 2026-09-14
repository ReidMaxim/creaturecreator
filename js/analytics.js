/**
 * Bounded, presentation-ready evolution summaries. These calculations are
 * intentionally transient: snapshots continue to contain only simulation data.
 */
export const TRAITS = [
    ['size', 'Size'], ['speed', 'Speed'], ['diet', 'Diet'],
    ['metabolism', 'Metabolism'], ['plantPreference', 'Plant preference'],
    ['plantEfficiency', 'Plant efficiency'], ['hue', 'Hue']
];

const LIMIT = 24;
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

function traitValue(creature, key) {
    return finite(creature.genome && creature.genome[key]);
}

function summarizeGroup(creatures, key) {
    const groups = new Map();
    for (const creature of creatures) {
        const groupKey = String(key(creature));
        if (!groups.has(groupKey)) groups.set(groupKey, []);
        groups.get(groupKey).push(creature);
    }
    return [...groups.entries()]
        .map(([id, members]) => ({
            id,
            count: members.length,
            averageFitness: average(members.map(creature => finite(creature.fitness))),
            averageGeneration: average(members.map(creature => finite(creature.generation))),
            traits: Object.fromEntries(TRAITS.map(([trait]) =>
                [trait, average(members.map(creature => traitValue(creature, trait)))]))
        }))
        .sort((a, b) => b.count - a.count || b.averageFitness - a.averageFitness)
        .slice(0, LIMIT);
}

export function getEvolutionAnalytics(world, history = []) {
    const creatures = world.creatures || [];
    const species = summarizeGroup(creatures, creature => world.getSpeciesKey(creature));
    const lineageMap = new Map();
    for (const creature of creatures) {
        const id = String(creature.lineageId || creature.id);
        if (!lineageMap.has(id)) lineageMap.set(id, []);
        lineageMap.get(id).push(creature);
    }
    const lineages = [...lineageMap.entries()]
        .map(([id, members]) => ({
            id,
            count: members.length,
            generation: Math.max(...members.map(creature => finite(creature.generation))),
            averageFitness: average(members.map(creature => finite(creature.fitness))),
            parentIds: [...new Set(members.map(creature => creature.parentId).filter(Boolean).map(String))].slice(0, 4)
        }))
        .sort((a, b) => b.count - a.count || b.generation - a.generation)
        .slice(0, LIMIT);
    const traits = Object.fromEntries(TRAITS.map(([key]) => [key,
        average(creatures.map(creature => traitValue(creature, key)))]));
    const fitness = {
        survival: average(creatures.map(creature => finite(creature.age))),
        food: average(creatures.map(creature => finite(creature.behaviorStats && creature.behaviorStats.foodEaten))) * 10,
        predation: average(creatures.map(creature => finite(creature.behaviorStats && creature.behaviorStats.kills))) * 18,
        energy: average(creatures.map(creature => Math.min(finite(creature.energy), finite(creature.maxEnergy)))) * 0.05
    };
    const timeline = history.slice(-120).map(point => ({
        time: finite(point.time),
        generation: finite(point.generation),
        creatures: finite(point.creatures),
        averageFitness: finite(point.averageFitness)
    }));
    return {
        species,
        speciesCount: new Set(creatures.map(creature => world.getSpeciesKey(creature))).size,
        lineages,
        lineageCount: lineageMap.size,
        traits,
        fitness,
        timeline
    };
}

export function formatAnalyticsNumber(value) {
    return Number(value).toFixed(Math.abs(value) >= 100 ? 0 : 1);
}

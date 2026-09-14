import { randomFloat, randomPointInCircle } from '../utils/random.js';
import { Genome } from './genome.js';

export function makeChild(parent, world) {
    const offset = randomPointInCircle(parent.size * 2 + 8);
    const genome = parent.genome instanceof Genome ? parent.genome.mutated(world.settings.mutationRate) : new Genome();
    return {
        x: parent.x + offset.x,
        y: parent.y + offset.y,
        genome,
        generation: parent.generation + 1,
        parentId: parent.id,
        lineageId: parent.lineageId,
        parentGenome: { ...parent.genome, neuralWeights: { ...parent.genome.neuralWeights } },
        parentPhenotype: { ...parent.phenotype },
        energy: Math.min(genome.maxEnergy * 0.75, randomFloat(55, 80))
    };
}

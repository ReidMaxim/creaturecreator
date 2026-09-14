import { randomFloat, randomPointInCircle } from '../utils/random.js';
import { Genome } from './genome.js';

export function makeChild(parent, world, secondParent = null) {
    const offset = randomPointInCircle((parent.size + (secondParent?.size || parent.size)) + 8);
    const genome = secondParent && parent.genome instanceof Genome && secondParent.genome instanceof Genome
        ? Genome.recombine(parent.genome, secondParent.genome).mutated(world.settings.mutationRate)
        : parent.genome instanceof Genome ? parent.genome.mutated(world.settings.mutationRate) : new Genome();
    return {
        x: parent.x + offset.x,
        y: parent.y + offset.y,
        genome,
        generation: Math.max(parent.generation, secondParent?.generation || 0) + 1,
        parentId: parent.id,
        parentIds: secondParent ? [parent.id, secondParent.id] : [parent.id],
        lineageId: parent.lineageId,
        energy: Math.min(genome.maxEnergy * 0.75, randomFloat(55, 80))
    };
}

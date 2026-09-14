import { Genome } from '../genetics/genome.js';
import { makeChild } from '../genetics/reproduction.js';
import { randomAngle, randomFloat, random } from '../utils/random.js';
import { createBodyParts } from '../parts/bodyParts.js';
import { DecisionBrain } from '../brain/brain.js';
import { derivePhenotype, lineageColor, phenotypeState } from '../genetics/phenotype.js';

let nextCreatureId = 1;

// Phase 29: Disease system constants
const DISEASE_TYPES = [
    { name: 'parasite', color: '#f97316', severity: 0.4, transmissionRate: 0.15 },
    { name: 'virus', color: '#ef4444', severity: 0.6, transmissionRate: 0.25 },
    { name: 'fungus', color: '#a855f7', severity: 0.35, transmissionRate: 0.12 },
    { name: 'bacteria', color: '#eab308', severity: 0.45, transmissionRate: 0.18 }
];

const MAX_DISEASES_PER_CREATURE = 3;

export class Creature {
    constructor(x, y, options = {}) {
        this.id = options.id || nextCreatureId++;
        if (Number.isFinite(Number(options.id))) nextCreatureId = Math.max(nextCreatureId, Number(options.id) + 1);
        this.x = x;
        this.y = y;
        this.genome = options.genome instanceof Genome ? options.genome : new Genome(options.genome);
        this.age = options.age || 0;
        this.phenotype = derivePhenotype(this.genome);
        this.phenotype.growth = 0.72 + Math.min(1,
            this.age / Math.max(1, this.genome.reproductionAge)) * 0.28;
        this.parts = createBodyParts(this.genome, this.phenotype);
        this.brain = new DecisionBrain(this.genome);
        this.size = this.phenotype.radius;
        this.speed = this.genome.speed * this.parts.movementFactor * (0.82 + this.parts.agility * 0.18);
        this.maxEnergy = this.genome.maxEnergy;
        this.energy = options.energy ?? randomFloat(this.maxEnergy * 0.7, this.maxEnergy);
        this.generation = options.generation || 0;
        this.parentId = options.parentId || null;
        this.lineageId = options.lineageId || this.parentId || this.id;
        this.lineageColor = lineageColor(this.lineageId);
        this.parentGenome = options.parentGenome || null;
        this.parentPhenotype = options.parentPhenotype || null;
        this.rotation = randomAngle();
        this.alive = true;
        this.isCreature = true;
        this.color = this.phenotype.color;
        this.isPredator = this.genome.diet >= 0.52;
        this.attackCooldown = 0;
        this.reproductionCooldown = 0;
        this.behaviorStats = {
            foodEaten: 0,
            kills: 0,
            distanceTravelled: 0,
            decisions: 0
        };
        this.visualState = phenotypeState(this);

        // Phase 29: Disease system
        this.diseases = options.diseases || [];
        this.pathogenLoad = options.pathogenLoad || 0;
        this.diseaseImmunity = options.diseaseImmunity || {};
        this.infectionTimer = 0;

        // Phase 29: Seasonal adaptation state
        this.seasonalMetabolismMultiplier = 1;
        this.seasonalMovementMultiplier = 1;

        // Phase 29: Niche specialization state
        this.nicheMovementCost = 1;
        this.nicheSensingBonus = 0;
        this.nicheResourceAccess = 1;
    }

    update(deltaTime, world) {
        this.age += deltaTime;
        this.phenotype.growth = Math.min(1, this.phenotype.growth + deltaTime
            / Math.max(1, this.genome.reproductionAge * 8));
        this.reproductionCooldown = Math.max(0, this.reproductionCooldown - deltaTime);
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);

        // Phase 29: Update seasonal effects
        this.updateSeasonalEffects(world);

        // Phase 29: Update disease state
        this.updateDiseases(deltaTime, world);

        // Phase 29: Update niche specialization effects
        this.updateNicheEffects(world);

        const zone = world.getZoneAt(this.x, this.y);
        const effects = world.getEnvironmentEffects();

        // Apply disease-modified energy drain
        const diseaseEnergyDrain = this.getDiseaseEnergyDrain();
        const diseaseMovementMultiplier = this.getDiseaseMovementMultiplier();
        const diseaseReproductionPenalty = this.getDiseaseReproductionPenalty();

        this.energy -= deltaTime * (this.genome.metabolism + this.parts.metabolicCost)
            * this.seasonalMetabolismMultiplier
            * zone.energyDrain * effects.energyDrain
            * (world.settings.resourcePressure || 1)
            * diseaseEnergyDrain;

        if (this.energy <= 0 || this.age >= world.settings.maxAge) {
            this.alive = false;
            this.visualState = 'dead';
            return;
        }

        const action = this.brain.decide(this, world, deltaTime);
        this.visualState = phenotypeState(this);
        this.behaviorStats.decisions += 1;
        this.rotation += action.turn * (1.8 + this.genome.persistence * 0.35) * deltaTime;

        // Apply disease-modified movement
        const effectiveSpeed = this.speed * diseaseMovementMultiplier * this.nicheMovementCost;
        const position = world.wrapPosition(
            this.x + Math.cos(this.rotation) * effectiveSpeed * zone.movement
                * effects.movement * action.thrust * deltaTime,
            this.y + Math.sin(this.rotation) * effectiveSpeed * zone.movement
                * effects.movement * action.thrust * deltaTime
        );
        this.x = position.x;
        this.y = position.y;
        this.behaviorStats.distanceTravelled += effectiveSpeed * zone.movement
            * effects.movement * action.thrust * deltaTime;

        if (!this.isPredator) {
            for (const plant of world.getNearby(this.x, this.y, this.size + 8, 'plants')) {
                if (!plant.alive || this.distanceTo(plant, world) > this.size + 8) continue;
                const eaten = plant.consume(9 * deltaTime + 5);
                this.energy = Math.min(this.maxEnergy,
                    this.energy + eaten * this.genome.plantEfficiency * this.nicheResourceAccess);
                if (eaten > 0) this.behaviorStats.foodEaten += 1;
                break;
            }
            for (let index = world.food.length - 1; index >= 0; index -= 1) {
                const food = world.food[index];
                if (this.distanceTo(food, world) <= this.size + 6) {
                    if (this.parts.eatingEfficiency > 0) {
                        this.energy = Math.min(
                            this.maxEnergy,
                            this.energy + food.energy * this.parts.eatingEfficiency * this.nicheResourceAccess
                        );
                        this.behaviorStats.foodEaten += 1;
                        world.removeFood(index);
                    }
                    break;
                }
            }
        }

        if (this.isPredator && this.attackCooldown <= 0) {
            const attackRange = this.size + 5 + this.parts.bite * 5;
            let target = null;
            let targetDistance = attackRange;
            for (const candidate of world.getNearby(this.x, this.y, attackRange, 'creatures')) {
                if (candidate === this || !candidate.alive || candidate.isPredator) continue;
                const distance = this.distanceTo(candidate, world);
                if (distance < targetDistance) {
                    target = candidate;
                    targetDistance = distance;
                }
            }
            if (target) {
                const damage = this.parts.bite * (1.1 + this.genome.attack)
                    - target.parts.defense * 0.45;
                if (damage > 0.15) {
                    target.alive = false;
                    target.deathCause = 'predation';
                    this.energy = Math.min(this.maxEnergy, this.energy + 30 + damage * 14);
                    this.behaviorStats.kills += 1;
                    this.attackCooldown = Math.max(0.55, 1.8 - this.parts.bite * 0.5);
                    world.predationKills += 1;
                }
            }
        }

        // Phase 29: Disease transmission to nearby creatures
        this.transmitDiseases(world);

        if (this.age >= this.genome.reproductionAge &&
            this.energy >= this.genome.reproductionThreshold * diseaseReproductionPenalty &&
            this.reproductionCooldown <= 0) {
            this.energy *= 0.52;
            this.reproductionCooldown = 4;
            world.queueBirth(makeChild(this, world));
        }
    }

    // Phase 29: Seasonal effects on creature
    updateSeasonalEffects(world) {
        const season = world.getSeason ? world.getSeason() : { name: 'temperate', temperature: 0.5 };
        const zone = world.getZoneAt(this.x, this.y);
        const zoneTemp = this.getZoneTemperature(zone, season);

        // Apply seasonal metabolism based on adaptation genes
        let tempStress = 0;
        if (zoneTemp < 0.3) {
            // Cold stress
            tempStress = (0.3 - zoneTemp) * (1 - this.phenotype.coldAdaptation);
        } else if (zoneTemp > 0.7) {
            // Heat stress
            tempStress = (zoneTemp - 0.7) * (1 - this.phenotype.heatAdaptation);
        }

        // Seasonal metabolism multiplier
        const baseSeasonalMult = this.phenotype.seasonalMetabolism;
        this.seasonalMetabolismMultiplier = baseSeasonalMult * (1 + tempStress * 0.5);

        // Seasonal movement effects
        this.seasonalMovementMultiplier = 1 - tempStress * 0.3;

        // Nocturnal bonus during night
        if (world.isNight && this.phenotype.nocturnal > 0.5) {
            this.seasonalMovementMultiplier *= 1.15;
            this.nicheSensingBonus = this.phenotype.nocturnal * 0.3;
        } else {
            this.nicheSensingBonus = 0;
        }
    }

    getZoneTemperature(zone, season) {
        // Base temperature by zone type
        let baseTemp = 0.5;
        switch (zone.type) {
            case 'water': baseTemp = 0.4; break;
            case 'rock': baseTemp = 0.7; break;
            case 'meadow': baseTemp = 0.5; break;
        }
        // Season modifier
        const seasonMod = (season.temperature - 0.5) * 0.4;
        return Math.max(0, Math.min(1, baseTemp + seasonMod));
    }

    // Phase 29: Disease system methods
    updateDiseases(deltaTime, world) {
        this.infectionTimer = Math.max(0, this.infectionTimer - deltaTime);

        // Natural recovery based on immunity
        for (let i = this.diseases.length - 1; i >= 0; i--) {
            const disease = this.diseases[i];
            disease.duration -= deltaTime;

            // Recovery chance based on immunity and disease resistance
            const recoveryRate = (this.phenotype.immunity + this.phenotype.diseaseResistance) * 0.02;
            if (disease.duration <= 0 || random() < recoveryRate * deltaTime) {
                // Develop immunity to this disease type
                this.diseaseImmunity[disease.type] = (this.diseaseImmunity[disease.type] || 0) + 0.15;
                this.diseases.splice(i, 1);
            }
        }

        // Update pathogen load (environmental exposure)
        const zone = world.getZoneAt(this.x, this.y);
        const envDiseasePressure = world.getDiseasePressure ? world.getDiseasePressure(this.x, this.y) : 0;
        this.pathogenLoad = Math.min(1, this.pathogenLoad + envDiseasePressure * deltaTime * 0.1);

        // Natural pathogen clearance
        this.pathogenLoad = Math.max(0, this.pathogenLoad - deltaTime * this.phenotype.pathogenTolerance * 0.05);

        // Random new infection from environment
        if (this.pathogenLoad > 0.3 && this.infectionTimer <= 0 && this.diseases.length < MAX_DISEASES_PER_CREATURE) {
            if (random() < this.pathogenLoad * 0.02 * (1 - this.phenotype.immunity)) {
                this.contractRandomDisease();
                this.infectionTimer = 5 + random() * 10; // Cooldown before next infection
            }
        }

        // Update visual state for disease
        if (this.diseases.length > 0) {
            this.visualState = 'diseased';
        }
    }

    contractRandomDisease() {
        const diseaseType = DISEASE_TYPES[Math.floor(random() * DISEASE_TYPES.length)];
        const immunity = this.diseaseImmunity[diseaseType.name] || 0;
        const severity = diseaseType.severity * (1 - immunity * 0.5) * (1 - this.phenotype.diseaseResistance * 0.4);

        this.diseases.push({
            type: diseaseType.name,
            color: diseaseType.color,
            severity: Math.max(0.1, Math.min(1, severity)),
            duration: 20 + random() * 40, // 20-60 seconds
            transmissionRate: diseaseType.transmissionRate
        });

        this.pathogenLoad = Math.min(1, this.pathogenLoad + 0.2);
    }

    getDiseaseEnergyDrain() {
        if (this.diseases.length === 0) return 1;
        const totalSeverity = this.diseases.reduce((sum, d) => sum + d.severity, 0);
        return 1 + totalSeverity * 0.5; // Up to 2.5x energy drain with 3 severe diseases
    }

    getDiseaseMovementMultiplier() {
        if (this.diseases.length === 0) return 1;
        const totalSeverity = this.diseases.reduce((sum, d) => sum + d.severity, 0);
        return Math.max(0.3, 1 - totalSeverity * 0.4); // Down to 30% speed
    }

    getDiseaseReproductionPenalty() {
        if (this.diseases.length === 0) return 1;
        const totalSeverity = this.diseases.reduce((sum, d) => sum + d.severity, 0);
        return 1 + totalSeverity * 2; // Up to 7x reproduction threshold
    }

    transmitDiseases(world) {
        if (this.diseases.length === 0) return;

        const transmissionRange = this.size + 15;
        const nearby = world.getNearby(this.x, this.y, transmissionRange, 'creatures');

        for (const target of nearby) {
            if (target === this || !target.alive) continue;

            for (const disease of this.diseases) {
                // Check if target already has this disease
                if (target.diseases.some(d => d.type === disease.type)) continue;

                // Check target's immunity
                const targetImmunity = target.diseaseImmunity[disease.type] || 0;
                const transmissionChance = disease.transmissionRate
                    * (1 - targetImmunity * 0.7)
                    * (1 - target.phenotype.immunity * 0.5)
                    * (1 - target.phenotype.diseaseResistance * 0.3);

                if (random() < transmissionChance) {
                    target.diseases.push({
                        type: disease.type,
                        color: disease.color,
                        severity: disease.severity * (0.8 + random() * 0.4),
                        duration: 15 + random() * 30,
                        transmissionRate: disease.transmissionRate * 0.8
                    });
                    target.pathogenLoad = Math.min(1, target.pathogenLoad + 0.15);
                    target.infectionTimer = 3 + random() * 5;
                }
            }
        }
    }

    // Phase 29: Niche specialization effects
    updateNicheEffects(world) {
        const zone = world.getZoneAt(this.x, this.y);

        // Reset niche modifiers
        this.nicheMovementCost = 1;
        this.nicheResourceAccess = 1;

        // Burrowing: better in rock/meadow, can hide from predators, slower in water
        if (this.phenotype.burrowing > 0.3) {
            if (zone.type === 'rock' || zone.type === 'meadow') {
                this.nicheMovementCost *= 0.85; // Easier movement
                this.nicheResourceAccess *= 1.1; // Better access to buried food
            }
            if (zone.type === 'water') {
                this.nicheMovementCost *= 1.5; // Harder in water
            }
            // Burrowers harder to catch
            this.parts.defense += this.phenotype.burrowing * 0.2;
        }

        // Climbing: better in rock zones, can escape predators
        if (this.phenotype.climbing > 0.3) {
            if (zone.type === 'rock') {
                this.nicheMovementCost *= 0.8;
                this.nicheSensingBonus += this.phenotype.climbing * 0.2;
            }
            // Climbers escape predation easier
            if (this.isPredator === false) {
                this.parts.agility += this.phenotype.climbing * 0.15;
            }
        }

        // Nocturnal: better at night, worse during day
        if (this.phenotype.nocturnal > 0.3) {
            if (world.isNight) {
                this.nicheMovementCost *= 0.9;
                this.nicheSensingBonus += this.phenotype.nocturnal * 0.25;
                this.nicheResourceAccess *= 1.15;
            } else {
                this.nicheMovementCost *= 1.15;
                this.nicheSensingBonus -= this.phenotype.nocturnal * 0.1;
            }
        }

        // Water depth preference
        if (zone.type === 'water') {
            const depthPref = this.phenotype.waterDepthPreference;
            if (depthPref > 0.6 && this.phenotype.deepWaterForaging > 0.4) {
                // Deep water specialist
                this.nicheMovementCost *= 0.85;
                this.nicheResourceAccess *= 1.2;
                this.nicheSensingBonus += 0.15;
            } else if (depthPref < 0.4 && this.phenotype.surfaceFeeding > 0.5) {
                // Surface feeder
                this.nicheMovementCost *= 0.9;
                this.nicheResourceAccess *= 1.1;
            } else {
                // Generalist in water - slight penalty
                this.nicheMovementCost *= 1.05;
            }
        }
    }

    get fitness() {
        return this.age + this.behaviorStats.foodEaten * 10 + this.behaviorStats.kills * 18
            + Math.min(this.energy, this.maxEnergy) * 0.05;
    }

    distanceTo(entity, world = null) {
        let dx = entity.x - this.x;
        let dy = entity.y - this.y;
        if (world) {
            if (Math.abs(dx) > world.width / 2) dx -= Math.sign(dx) * world.width;
            if (Math.abs(dy) > world.height / 2) dy -= Math.sign(dy) * world.height;
        }
        return Math.hypot(dx, dy);
    }
}

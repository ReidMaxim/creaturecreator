import { Creature } from './entities/creature.js';
import { Renderer } from './renderer.js';
import { World } from './world.js';
import { randomFloat } from './utils/random.js';

const canvas = document.getElementById('canvas');
const world = new World();
const renderer = new Renderer(canvas);
renderer.setCameraPosition(world.width / 2, world.height / 2);
const state = {
    running: false,
    speed: 1,
    lastFrame: performance.now(),
    fps: 0,
    fpsTimer: 0,
    frameCount: 0
};

for (let index = 0; index < 24; index += 1) {
    world.addCreature(new Creature(
        randomFloat(0, world.width),
        randomFloat(0, world.height)
    ));
}

for (let index = 0; index < 120; index += 1) {
    world.spawnFood();
}
for (let index = 0; index < 150; index += 1) {
    world.spawnPlant();
}

const elements = {
    playPause: document.getElementById('playPauseBtn'),
    speed: document.getElementById('speedSlider'),
    speedDisplay: document.getElementById('speedDisplay'),
    creatureCount: document.getElementById('creatureCount'),
    generation: document.getElementById('generation'),
    foodCount: document.getElementById('foodCount'),
    plantCount: document.getElementById('plantCount'),
    plantEnergy: document.getElementById('plantEnergy'),
    averageFitness: document.getElementById('averageFitness'),
    diversity: document.getElementById('diversity'),
    eventStatus: document.getElementById('eventStatus'),
    eventName: document.getElementById('eventName'),
    eventCountdown: document.getElementById('eventCountdown'),
    eventSummary: document.getElementById('eventSummary'),
    predatorCount: document.getElementById('predatorCount'),
    killCount: document.getElementById('killCount'),
    meadowCount: document.getElementById('meadowCount'),
    waterCount: document.getElementById('waterCount'),
    rockCount: document.getElementById('rockCount'),
    fps: document.getElementById('fps'),
    camX: document.getElementById('camX'),
    camY: document.getElementById('camY'),
    zoom: document.getElementById('zoomLevel'),
    foodSpawnRate: document.getElementById('foodSpawnRate'),
    foodSpawnRateValue: document.getElementById('foodSpawnRateValue'),
    foodEnergy: document.getElementById('foodEnergy'),
    foodEnergyValue: document.getElementById('foodEnergyValue'),
    maxFood: document.getElementById('maxFood'),
    maxFoodValue: document.getElementById('maxFoodValue'),
    plantSpawnRate: document.getElementById('plantSpawnRate'),
    plantSpawnRateValue: document.getElementById('plantSpawnRateValue'),
    inspector: document.getElementById('inspector'),
    inspectorBody: document.getElementById('inspectorBody'),
    closeInspector: document.getElementById('closeInspector')
};

function updateHud() {
    const stats = world.getStats();
    elements.fps.textContent = Math.round(state.fps);
    elements.creatureCount.textContent = stats.creatures;
    elements.generation.textContent = stats.generation;
    elements.foodCount.textContent = stats.food;
    elements.plantCount.textContent = stats.plants;
    elements.plantEnergy.textContent = Math.round(stats.plantEnergy);
    elements.averageFitness.textContent = stats.averageFitness.toFixed(1);
    elements.diversity.textContent = `${stats.species} / ${stats.lineages}`;
    elements.predatorCount.textContent = stats.predators;
    elements.killCount.textContent = stats.predationKills;
    elements.meadowCount.textContent = stats.zoneCounts.meadow;
    elements.waterCount.textContent = stats.zoneCounts.water;
    elements.rockCount.textContent = stats.zoneCounts.rock;
    elements.speedDisplay.textContent = `${state.speed.toFixed(2)}x`;
    elements.camX.textContent = Math.round(renderer.camera.x);
    elements.camY.textContent = Math.round(renderer.camera.y);
    elements.zoom.textContent = `${renderer.getZoom().toFixed(1)}x`;
    if (stats.event) {
        elements.eventStatus.classList.remove('hidden');
        elements.eventStatus.style.setProperty('--event-color', stats.event.color);
        elements.eventName.textContent = stats.event.name;
        elements.eventCountdown.textContent = `${Math.ceil(stats.event.remaining)}s`;
        elements.eventSummary.textContent = stats.event.summary;
    } else {
        elements.eventStatus.classList.add('hidden');
    }
}

function inspectCreature(creature) {
    renderer.selectedCreature = creature;
    if (!creature) {
        elements.inspector.classList.add('hidden');
        return;
    }
    elements.inspector.classList.remove('hidden');
    elements.inspectorBody.innerHTML = `
        <div class="creature-swatch" style="background:${creature.color}"></div>
        <strong>#${creature.id}</strong> &middot; generation ${creature.generation}<br>
        Age ${creature.age.toFixed(1)}s &middot; energy ${creature.energy.toFixed(0)}<br>
        Size ${creature.genome.size.toFixed(1)} &middot; speed ${creature.genome.speed.toFixed(1)}<br>
        Metabolism ${(creature.genome.metabolism + creature.parts.metabolicCost).toFixed(2)}
        &middot; vision ${creature.parts.vision.toFixed(0)}<br>
        Eyes ${creature.parts.eyes.count} (${creature.parts.eyes.strength.toFixed(2)})
        &middot; mouth ${creature.parts.mouth.count} (${creature.parts.mouth.strength.toFixed(2)})
        &middot; motor ${creature.parts.motor.count} (${creature.parts.motor.strength.toFixed(2)})<br>
        Feeding ${(creature.parts.eatingEfficiency * 100).toFixed(0)}%
        &middot; movement ${(creature.parts.movementFactor * 100).toFixed(0)}%<br>
        Plants ${(creature.genome.plantPreference * 100).toFixed(0)}% preference
        &middot; efficiency ${(creature.genome.plantEfficiency * 100).toFixed(0)}%<br>
        Diet ${creature.isPredator ? 'carnivore' : 'herbivore'}
        (${(creature.genome.diet * 100).toFixed(0)}%) &middot;
        attack ${(creature.parts.bite).toFixed(2)} &middot;
        defense ${(creature.parts.defense).toFixed(2)}<br>
        Brain genes: food ${(creature.genome.foodAttraction).toFixed(2)}
        &middot; wander ${(creature.genome.wander).toFixed(2)}
        &middot; persistence ${(creature.genome.persistence).toFixed(2)}
        &middot; risk ${(creature.genome.risk).toFixed(2)}<br>
        Neural policy:
        ${Object.entries(creature.genome.neuralWeights)
            .map(([name, value]) => `${name} ${value.toFixed(2)}`).join(' &middot; ')}<br>
        Fitness ${creature.fitness.toFixed(1)}
        &middot; food eaten ${creature.behaviorStats.foodEaten}
        &middot; kills ${creature.behaviorStats.kills}
        &middot; travel ${creature.behaviorStats.distanceTravelled.toFixed(0)}<br>
        Action: turn ${(creature.brain.lastAction.turn).toFixed(2)}
        &middot; thrust ${(creature.brain.lastAction.thrust).toFixed(2)}<br>
        Reproduces at ${creature.genome.reproductionAge.toFixed(1)}s / ${creature.genome.reproductionThreshold.toFixed(0)} energy
    `;
}

function setRunning(running) {
    state.running = running;
    elements.playPause.textContent = running ? '❚❚ Pause' : '▶ Play';
    elements.playPause.classList.toggle('paused', running);
}

function updateSetting(input, output, key) {
    const value = Number(input.value);
    world.settings[key] = value;
    output.textContent = key === 'foodSpawnRate' ? value.toFixed(1) : value;
}

elements.playPause.addEventListener('click', () => setRunning(!state.running));
elements.speed.addEventListener('change', () => {
    state.speed = Number(elements.speed.value);
    updateHud();
});
elements.foodSpawnRate.addEventListener('input', () =>
    updateSetting(elements.foodSpawnRate, elements.foodSpawnRateValue, 'foodSpawnRate')
);
elements.foodEnergy.addEventListener('input', () =>
    updateSetting(elements.foodEnergy, elements.foodEnergyValue, 'foodEnergy')
);
elements.maxFood.addEventListener('input', () =>
    updateSetting(elements.maxFood, elements.maxFoodValue, 'maxFood')
);
elements.plantSpawnRate.addEventListener('input', () =>
    updateSetting(elements.plantSpawnRate, elements.plantSpawnRateValue, 'plantSpawnRate')
);
elements.closeInspector.addEventListener('click', () => inspectCreature(null));
canvas.addEventListener('click', (event) => {
    const bounds = canvas.getBoundingClientRect();
    const point = renderer.screenToWorld(event.clientX - bounds.left, event.clientY - bounds.top);
    let closest = null;
    let distance = Infinity;
    for (const creature of world.creatures) {
        const current = creature.distanceTo(point, world);
        if (current <= creature.size + 12 / renderer.getZoom() && current < distance) {
            closest = creature;
            distance = current;
        }
    }
    inspectCreature(closest);
});

const keys = new Set();
window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault();
        setRunning(!state.running);
        return;
    }
    keys.add(event.key.toLowerCase());
});
window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    renderer.setCameraZoom(renderer.getZoom() * (event.deltaY < 0 ? 1.1 : 0.9));
    updateHud();
}, { passive: false });

function updateCamera(deltaTime) {
    const horizontal = (keys.has('d') || keys.has('arrowright') ? 1 : 0)
        - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
    const vertical = (keys.has('s') || keys.has('arrowdown') ? 1 : 0)
        - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
    const distance = 500 * deltaTime / renderer.getZoom();
    renderer.setCameraPosition(
        renderer.camera.x + horizontal * distance,
        renderer.camera.y + vertical * distance
    );
}

function frame(now) {
    const deltaTime = Math.min((now - state.lastFrame) / 1000, 0.1);
    state.lastFrame = now;
    if (state.running) {
        world.update(deltaTime, state.speed);
    }
    updateCamera(deltaTime);
    renderer.draw(world);
    if (renderer.selectedCreature && !renderer.selectedCreature.alive) inspectCreature(null);

    state.frameCount += 1;
    state.fpsTimer += deltaTime;
    if (state.fpsTimer >= 0.25) {
        state.fps = state.frameCount / state.fpsTimer;
        state.frameCount = 0;
        state.fpsTimer = 0;
        updateHud();
    }
    requestAnimationFrame(frame);
}

renderer.showGrid = true;
updateHud();
requestAnimationFrame(frame);

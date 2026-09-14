import { Creature } from './entities/creature.js';
import { Renderer } from './renderer.js';
import { World, SIMULATION_PRESETS } from './world.js';
import { randomFloat, setRandomSeed } from './utils/random.js';
import { getEvolutionAnalytics, formatAnalyticsNumber, TRAITS } from './analytics.js';
import { Genome, GENE_LIMITS, CREATOR_TRAITS, clampGeneValue } from './genetics/genome.js';

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
    frameCount: 0,
    historyTimer: 0,
    history: []
};
const STORAGE_KEY = 'creature-creator-phase19-save';
const CREATOR_STORAGE_KEY = 'creature-creator-phase25-presets';
const PREFERENCES_KEY = 'creature-creator-phase20-preferences';
const INITIAL_COUNTS = { creatures: 24, food: 120, plants: 150 };

function seedWorld() {
    for (let index = 0; index < INITIAL_COUNTS.creatures; index += 1) {
        world.addCreature(new Creature(randomFloat(0, world.width), randomFloat(0, world.height)));
    }
    for (let index = 0; index < INITIAL_COUNTS.food; index += 1) world.spawnFood();
    let attempts = 0;
    while (world.plants.length < INITIAL_COUNTS.plants && attempts < INITIAL_COUNTS.plants * 20) {
        world.spawnPlant();
        attempts += 1;
    }
}

const elements = {
    playPause: document.getElementById('playPauseBtn'),
    speed: document.getElementById('speedSlider'),
    speedDisplay: document.getElementById('speedDisplay'),
    creatureCount: document.getElementById('creatureCount'),
    generation: document.getElementById('generation'),
    reproductionModeDisplay: document.getElementById('reproductionModeDisplay'),
    foodCount: document.getElementById('foodCount'),
    plantCount: document.getElementById('plantCount'),
    plantEnergy: document.getElementById('plantEnergy'),
    averageFitness: document.getElementById('averageFitness'),
    diversity: document.getElementById('diversity'),
    populationRatio: document.getElementById('populationRatio'),
    resourcePressure: document.getElementById('resourcePressure'),
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
    preset: document.getElementById('preset'),
    maxCreatures: document.getElementById('maxCreatures'),
    maxCreaturesValue: document.getElementById('maxCreaturesValue'),
    maxPlants: document.getElementById('maxPlants'),
    maxPlantsValue: document.getElementById('maxPlantsValue'),
    resourcePressureSlider: document.getElementById('resourcePressureSlider'),
    resourcePressureValue: document.getElementById('resourcePressureValue'),
    reproductionMode: document.getElementById('reproductionMode'),
    inspector: document.getElementById('inspector'),
    inspectorBody: document.getElementById('inspectorBody'),
    closeInspector: document.getElementById('closeInspector')
    ,save: document.getElementById('saveBtn'),
    load: document.getElementById('loadBtn'),
    export: document.getElementById('exportBtn'),
    import: document.getElementById('importBtn'),
    importFile: document.getElementById('importFile'),
    snapshotText: document.getElementById('snapshotText'),
    persistenceStatus: document.getElementById('persistenceStatus'),
    historyCanvas: document.getElementById('historyCanvas')
    ,reset: document.getElementById('resetBtn')
    ,resetPause: document.getElementById('resetPause')
    ,resetTime: document.getElementById('resetTime')
    ,autoStart: document.getElementById('autoStart')
    ,birthCount: document.getElementById('birthCount')
    ,deathCount: document.getElementById('deathCount')
    ,analyticsKillCount: document.getElementById('analyticsKillCount')
    ,eventLog: document.getElementById('eventLog')
    ,trendMetric: document.getElementById('trendMetric')
    ,refreshAnalytics: document.getElementById('refreshAnalytics')
    ,trendCanvas: document.getElementById('trendCanvas')
    ,evolutionSummary: document.getElementById('evolutionSummary')
    ,lineageTree: document.getElementById('lineageTree')
    ,fitnessBreakdown: document.getElementById('fitnessBreakdown')
    ,seed: document.getElementById('seed')
    ,experimentLabel: document.getElementById('experimentLabel')
    ,applySeed: document.getElementById('applySeed')
    ,creatorName: document.getElementById('creatorName')
    ,creatorTraits: document.getElementById('creatorTraits')
    ,creatorEnergy: document.getElementById('creatorEnergy')
    ,creatorAge: document.getElementById('creatorAge')
    ,creatorInject: document.getElementById('creatorInject')
    ,creatorSave: document.getElementById('creatorSave')
    ,creatorLoad: document.getElementById('creatorLoad')
    ,creatorClear: document.getElementById('creatorClear')
    ,creatorPresets: document.getElementById('creatorPresets')
    ,creatorStatus: document.getElementById('creatorStatus')
};

try {
    const preferences = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}');
    elements.autoStart.checked = preferences.autoStart === true;
    elements.resetPause.checked = preferences.resetPause !== false;
    elements.resetTime.checked = preferences.resetTime !== false;
    if (preferences.reproductionMode === 'sexual') world.settings.reproductionMode = 'sexual';
    if (SIMULATION_PRESETS[preferences.preset]) world.applyPreset(preferences.preset);
} catch (error) {
    setPersistenceStatus(`Preferences unavailable: ${error.message}`, true);
}
elements.preset.value = world.settings.preset;
elements.seed.value = String(world.seed);
elements.experimentLabel.value = world.experimentLabel;
setRandomSeed(world.seed);
world.nextEventAt = world.time + 38 + randomFloat(0, 18);

seedWorld();

function snapshot() {
    return {
        app: 'creature-creator',
        version: 1,
        savedAt: new Date().toISOString(),
        world: world.serialize(),
        camera: { ...renderer.camera },
        speed: state.speed
    };
}

function setPersistenceStatus(message, error = false) {
    elements.persistenceStatus.textContent = message;
    elements.persistenceStatus.style.color = error ? '#fca5a5' : '#86efac';
}

function applySnapshot(data) {
    if (!data || data.app !== 'creature-creator' || data.version !== 1 || !data.world) {
        throw new Error('This is not a Creature Creator Phase 19 save.');
    }
    world.loadSnapshot(data.world);
    setRandomSeed(world.seed);
    elements.seed.value = String(world.seed);
    elements.experimentLabel.value = world.experimentLabel;
    if (data.camera && Number.isFinite(data.camera.x) && Number.isFinite(data.camera.y)) {
        renderer.setCameraPosition(data.camera.x, data.camera.y);
        if (Number.isFinite(data.camera.zoom)) renderer.setCameraZoom(data.camera.zoom);
    }
    if (Number.isFinite(data.speed)) {
        state.speed = Math.max(0.25, Math.min(10, data.speed));
        elements.speed.value = String(state.speed);
    }
    syncControlsFromWorld();
    renderer.selectedCreature = null;
    inspectCreature(null);
    state.history = [];
    drawHistory();
    updateHud();
}

function resetSimulation() {
    setRandomSeed(world.seed);
    world.reset(elements.resetTime.checked);
    seedWorld();
    renderer.selectedCreature = null;
    inspectCreature(null);
    state.history = [];
    state.historyTimer = 0;
    drawHistory();
    if (elements.resetPause.checked) setRunning(false);
    updateHud();
    setPersistenceStatus(`Reset and reseeded (${INITIAL_COUNTS.creatures} creatures, ${INITIAL_COUNTS.food} food, ${INITIAL_COUNTS.plants} plants).`);
}

function savePreferences() {
    try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify({
            autoStart: elements.autoStart.checked,
            resetPause: elements.resetPause.checked,
            resetTime: elements.resetTime.checked,
            preset: world.settings.preset || 'sandbox'
            ,reproductionMode: world.settings.reproductionMode || 'asexual'
        }));
    } catch (error) {
        setPersistenceStatus(`Preferences failed: ${error.message}`, true);
    }

}

function syncControlsFromWorld() {
    for (const [input, output, key] of [
        [elements.foodSpawnRate, elements.foodSpawnRateValue, 'foodSpawnRate'],
        [elements.foodEnergy, elements.foodEnergyValue, 'foodEnergy'],
        [elements.maxFood, elements.maxFoodValue, 'maxFood'],
        [elements.plantSpawnRate, elements.plantSpawnRateValue, 'plantSpawnRate'],
        [elements.maxCreatures, elements.maxCreaturesValue, 'maxCreatures'],
        [elements.maxPlants, elements.maxPlantsValue, 'maxPlants'],
        [elements.resourcePressureSlider, elements.resourcePressureValue, 'resourcePressure']
    ]) {
        input.value = world.settings[key];
        const value = Number(input.value);
        output.textContent = key === 'foodSpawnRate' || key === 'resourcePressure'
            ? value.toFixed(key === 'resourcePressure' ? 2 : 1) : value;
    }
    elements.preset.value = world.settings.preset || 'sandbox';
    elements.reproductionMode.value = world.settings.reproductionMode || 'asexual';
}

function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
        setPersistenceStatus('Saved locally.');
    } catch (error) {
        setPersistenceStatus(`Save failed: ${error.message}`, true);
    }
}

function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) throw new Error('No local save found.');
        applySnapshot(JSON.parse(raw));
        setPersistenceStatus('Loaded local save.');
    } catch (error) {
        setPersistenceStatus(`Load failed: ${error.message}`, true);
    }
}

function exportSnapshot() {
    const text = JSON.stringify(snapshot(), null, 2);
    elements.snapshotText.value = text;
    const blob = new Blob([text], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `creature-creator-${world.tick}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setPersistenceStatus('JSON export ready.');
}

function importSnapshot(text) {
    try {
        applySnapshot(JSON.parse(text));
        setPersistenceStatus('Imported simulation.');
    } catch (error) {
        setPersistenceStatus(`Import failed: ${error.message}`, true);
    }
}

function creatorStatus(message, error = false) {
    elements.creatorStatus.textContent = message;
    elements.creatorStatus.style.color = error ? '#fca5a5' : '#86efac';
}

function renderCreatorTraits(values = {}) {
    const defaults = new Genome();
    elements.creatorTraits.replaceChildren(...CREATOR_TRAITS.map(([name, label, group]) => {
        const limits = GENE_LIMITS[name];
        const input = document.createElement('input');
        input.id = `creator-${name}`;
        input.dataset.trait = name;
        input.type = 'number';
        input.min = limits[0];
        input.max = limits[1];
        input.step = ['eyeCount', 'mouthCount', 'motorCount'].includes(name) ? '1' : '0.01';
        input.value = clampGeneValue(name, values[name], defaults[name]);
        input.title = `Allowed: ${limits[0]}–${limits[1]}`;
        const wrapper = document.createElement('label');
        wrapper.className = `creator-trait ${group}`;
        wrapper.textContent = label;
        wrapper.appendChild(input);
        return wrapper;
    }));
}

function creatorValues() {
    const values = {};
    for (const [name] of CREATOR_TRAITS) {
        const input = document.getElementById(`creator-${name}`);
        const number = Number(input.value);
        if (!Number.isFinite(number)) throw new Error(`${name} must be a number.`);
        values[name] = clampGeneValue(name, number);
    }
    const energy = Number(elements.creatorEnergy.value);
    const age = Number(elements.creatorAge.value);
    if (!Number.isFinite(energy) || energy < 1 || energy > 227) throw new Error('Starting energy must be 1–227.');
    if (!Number.isFinite(age) || age < 0 || age > 180) throw new Error('Starting age must be 0–180.');
    return { genome: values, energy, age };
}

function readCreatorPresets() {
    try {
        const parsed = JSON.parse(localStorage.getItem(CREATOR_STORAGE_KEY) || '{}');
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
        creatorStatus(`Preset storage unavailable: ${error.message}`, true);
        return {};
    }
}

function refreshCreatorPresets() {
    const presets = readCreatorPresets();
    elements.creatorPresets.replaceChildren(new Option('Select saved preset', ''));
    Object.keys(presets).sort().forEach(name => elements.creatorPresets.appendChild(new Option(name, name)));
}

function injectCreator() {
    try {
        const values = creatorValues();
        if (world.creatures.length >= world.settings.maxCreatures) {
            throw new Error(`World capacity reached (${world.settings.maxCreatures}).`);
        }
        const creature = new Creature(randomFloat(0, world.width), randomFloat(0, world.height), values);
        if (!world.injectCreature(creature)) throw new Error('Creature could not be added safely.');
        inspectCreature(creature);
        updateHud();
        creatorStatus(`Injected creature #${creature.id}.`);
    } catch (error) {
        creatorStatus(`Invalid creature: ${error.message}`, true);
    }
}

function saveCreatorPreset() {
    try {
        const name = elements.creatorName.value.trim();
        if (!name) throw new Error('Enter a preset name.');
        const values = creatorValues();
        const presets = readCreatorPresets();
        presets[name] = values;
        localStorage.setItem(CREATOR_STORAGE_KEY, JSON.stringify(presets));
        refreshCreatorPresets();
        elements.creatorPresets.value = name;
        creatorStatus(`Saved preset “${name}”.`);
    } catch (error) {
        creatorStatus(`Preset not saved: ${error.message}`, true);
    }
}

function loadCreatorPreset() {
    const name = elements.creatorPresets.value;
    const preset = name && readCreatorPresets()[name];
    if (!preset || !preset.genome) {
        creatorStatus('Select a saved preset first.', true);
        return;
    }
    renderCreatorTraits(preset.genome);
    elements.creatorName.value = name;
    elements.creatorEnergy.value = Math.max(1, Math.min(227, Number(preset.energy) || 100));
    elements.creatorAge.value = Math.max(0, Math.min(180, Number(preset.age) || 0));
    creatorStatus(`Loaded preset “${name}”.`);
}

function clearCreator() {
    elements.creatorName.value = 'My creature';
    elements.creatorEnergy.value = 100;
    elements.creatorAge.value = 0;
    renderCreatorTraits();
    creatorStatus('Creator reset to safe defaults.');
}

renderCreatorTraits();
refreshCreatorPresets();
elements.creatorInject.addEventListener('click', injectCreator);
elements.creatorSave.addEventListener('click', saveCreatorPreset);
elements.creatorLoad.addEventListener('click', loadCreatorPreset);
elements.creatorClear.addEventListener('click', clearCreator);

elements.save.addEventListener('click', saveToLocalStorage);
elements.load.addEventListener('click', loadFromLocalStorage);
elements.export.addEventListener('click', exportSnapshot);
elements.import.addEventListener('click', () => {
    if (elements.snapshotText.value.trim()) importSnapshot(elements.snapshotText.value);
    else elements.importFile.click();
});
elements.importFile.addEventListener('change', () => {
    const file = elements.importFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importSnapshot(reader.result);
    reader.onerror = () => setPersistenceStatus('Import failed: could not read file.', true);
    reader.readAsText(file);
    elements.importFile.value = '';
});

function drawHistory() {
    const canvasElement = elements.historyCanvas;
    const context = canvasElement.getContext('2d');
    const width = canvasElement.width;
    const height = canvasElement.height;
    context.clearRect(0, 0, width, height);
    if (state.history.length < 2) return;
    const max = Math.max(1, ...state.history.map(point =>
        Math.max(point.creatures, point.plants, point.predators)));
    for (const [key, color] of [['creatures', '#4ade80'], ['plants', '#a3e635'], ['predators', '#fb923c']]) {
        context.strokeStyle = color;
        context.lineWidth = 1.5;
        context.beginPath();
        state.history.forEach((point, index) => {
            const x = index * width / (state.history.length - 1);
            const y = height - point[key] / max * (height - 6) - 3;
            if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
        });
        context.stroke();
    }

    const fitnessMax = Math.max(1, ...state.history.map(point => point.averageFitness || 0));
    context.strokeStyle = '#c084fc';
    context.lineWidth = 1.25;
    context.beginPath();
    state.history.forEach((point, index) => {
        const x = index * width / (state.history.length - 1);
        const y = height - (point.averageFitness || 0) / fitnessMax * (height - 6) - 3;
        if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
    });
    context.stroke();
}

function drawTrend() {
   const context = elements.trendCanvas.getContext('2d');
   const width = elements.trendCanvas.width;
   const height = elements.trendCanvas.height;
   const metric = elements.trendMetric.value;
   const points = state.history.slice(-120);
   context.clearRect(0, 0, width, height);
   if (points.length < 2) return;
   const values = points.map(point => metric === 'averageFitness' || metric === 'generation'
       ? point[metric] || 0 : (point.traits && point.traits[metric]) || 0);
   const min = Math.min(...values);
   const max = Math.max(...values, min + 1);
   context.strokeStyle = '#60a5fa';
   context.lineWidth = 1.5;
   context.beginPath();
   values.forEach((value, index) => {
       const x = index * width / (values.length - 1);
       const y = height - 5 - (value - min) / (max - min) * (height - 10);
       if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
   });
   context.stroke();
   context.fillStyle = '#94a3b8';
   context.font = '9px sans-serif';
   context.fillText(formatAnalyticsNumber(min), 3, height - 3);
   context.fillText(formatAnalyticsNumber(max), 3, 10);
}

function updateEvolutionPanel() {
   const analytics = getEvolutionAnalytics(world, state.history);
   const topSpecies = analytics.species.slice(0, 4);
   elements.evolutionSummary.innerHTML = [
       `<div class="analytics-summary-row"><span>Clusters</span><b>${analytics.speciesCount}</b></div>`,
       ...topSpecies.map(group => `<div class="analytics-summary-row"><span>${group.id}</span><b>${group.count} · ${formatAnalyticsNumber(group.averageFitness)}</b></div>`),
       `<div class="analytics-summary-row"><span>Tracked generations</span><b>${analytics.timeline.length ? analytics.timeline[analytics.timeline.length - 1].generation : 0}</b></div>`
   ].join('');
   elements.lineageTree.innerHTML = analytics.lineages.slice(0, 6).map(lineage =>
       `<div class="lineage-node"><b>${lineage.id}</b> · ${lineage.count} members · G${lineage.generation}` +
       `${lineage.parentIds.length ? ` <small>← ${lineage.parentIds.join(', ')}</small>` : ''}</div>`).join('')
       || '<span>No living lineages.</span>';
   elements.fitnessBreakdown.innerHTML = Object.entries({
       Survival: analytics.fitness.survival, Food: analytics.fitness.food,
       Predation: analytics.fitness.predation, Energy: analytics.fitness.energy
   }).map(([name, value]) => `<div class="fitness-row"><span>${name}</span><b>${formatAnalyticsNumber(value)}</b></div>`).join('');
   drawTrend();
}

function updateHud() {
    const stats = world.getStats();
    elements.fps.textContent = Math.round(state.fps);
    elements.creatureCount.textContent = stats.creatures;
    elements.generation.textContent = stats.generation;
    elements.reproductionModeDisplay.textContent = stats.reproductionMode;
    elements.foodCount.textContent = stats.food;
    elements.plantCount.textContent = stats.plants;
    elements.plantEnergy.textContent = Math.round(stats.plantEnergy);
    elements.averageFitness.textContent = stats.averageFitness.toFixed(1);
    elements.diversity.textContent = `${stats.species} / ${stats.lineages}`;
    elements.predatorCount.textContent = stats.predators;
    elements.populationRatio.textContent = stats.populationRatio;
    elements.resourcePressure.textContent = `${stats.resourcePressure.toFixed(0)}%`;
    elements.killCount.textContent = stats.predationKills;
    elements.birthCount.textContent = stats.births;
    elements.deathCount.textContent = stats.deaths;
    elements.analyticsKillCount.textContent = stats.predationKills;
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
    elements.eventLog.replaceChildren(...(world.analyticsLog || []).slice().reverse().map(entry => {
        const row = document.createElement('div');
        const time = document.createElement('time');
        const message = document.createElement('span');
        time.textContent = `${Number(entry.time).toFixed(0)}s`;
        message.textContent = entry.message;
        message.style.color = /^#[0-9a-f]{6}$/i.test(entry.color) ? entry.color : '#cbd5e1';
        row.append(time, message);
        return row;
    }));
    updateEvolutionPanel();
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
        Sex ${creature.sex} &middot; parents ${
            (creature.parentIds && creature.parentIds.length ? creature.parentIds.join(' + ') : 'founder')
        }<br>
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
        Reproduces at ${creature.genome.reproductionAge.toFixed(1)}s / ${creature.genome.reproductionThreshold.toFixed(0)} energy<br>
        Lineage ${creature.lineageId || creature.id} &middot; parent ${creature.parentId || 'founder'}<br>
        Fitness breakdown: survival ${creature.age.toFixed(1)} +
        food ${(creature.behaviorStats.foodEaten * 10).toFixed(1)} +
        kills ${(creature.behaviorStats.kills * 18).toFixed(1)} +
        energy ${(Math.min(creature.energy, creature.maxEnergy) * .05).toFixed(1)}
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
    output.textContent = key === 'foodSpawnRate' || key === 'resourcePressure'
        ? value.toFixed(key === 'resourcePressure' ? 2 : 1) : value;
    if (world.settings.preset !== 'sandbox') {
        world.settings.preset = 'sandbox';
        elements.preset.value = 'sandbox';
    }
}

function applyPreset() {
    world.applyPreset(elements.preset.value);
    syncControlsFromWorld();
    savePreferences();
    updateHud();
}

elements.playPause.addEventListener('click', () => setRunning(!state.running));
elements.reset.addEventListener('click', resetSimulation);
elements.applySeed.addEventListener('click', () => {
    const seed = Number(elements.seed.value);
    if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
        setPersistenceStatus('Seed must be an integer from 0 to 4294967295.', true);
        return;
    }
    world.seed = seed;
    resetSimulation();
    setPersistenceStatus(`Reset with seed ${world.seed}.`);
});
elements.experimentLabel.addEventListener('input', () => {
    world.experimentLabel = elements.experimentLabel.value.slice(0, 80);
});
elements.preset.addEventListener('change', applyPreset);
elements.reproductionMode.addEventListener('change', () => {
    world.settings.reproductionMode = elements.reproductionMode.value === 'sexual' ? 'sexual' : 'asexual';
    savePreferences();
    updateHud();
});
for (const input of [elements.autoStart, elements.resetPause, elements.resetTime]) {
    input.addEventListener('change', savePreferences);
}
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
elements.maxCreatures.addEventListener('input', () =>
    updateSetting(elements.maxCreatures, elements.maxCreaturesValue, 'maxCreatures')
);
elements.maxPlants.addEventListener('input', () =>
    updateSetting(elements.maxPlants, elements.maxPlantsValue, 'maxPlants')
);
elements.resourcePressureSlider.addEventListener('input', () =>
    updateSetting(elements.resourcePressureSlider, elements.resourcePressureValue, 'resourcePressure')
);
elements.closeInspector.addEventListener('click', () => inspectCreature(null));
elements.trendMetric.addEventListener('change', drawTrend);
elements.refreshAnalytics.addEventListener('click', updateEvolutionPanel);
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
        state.historyTimer += deltaTime * state.speed;
        if (state.historyTimer >= 1) {
            state.historyTimer = 0;
            const stats = world.getStats();
            state.history.push({
                creatures: stats.creatures, plants: stats.plants, predators: stats.predators,
                averageFitness: stats.averageFitness, generation: stats.generation,
                time: stats.time,
                traits: Object.fromEntries(TRAITS.map(([key]) => [key,
                    world.creatures.length ? world.creatures.reduce((sum, creature) =>
                        sum + Number(creature.genome[key] || 0), 0) / world.creatures.length : 0]))
            });
            if (state.history.length > 120) state.history.shift();
            drawHistory();
            drawTrend();
        }
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
syncControlsFromWorld();
setRunning(elements.autoStart.checked);
updateHud();
requestAnimationFrame(frame);

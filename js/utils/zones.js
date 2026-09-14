/**
 * Lightweight deterministic terrain zones. The hash keeps a new world layout
 * stable across reloads without adding a seeded RNG or storing map data.
 */
export const ZONE_DEFINITIONS = {
    meadow: {
        name: 'Meadow',
        color: '#527d4f',
        movement: 1,
        energyDrain: 1,
        plantGrowth: 1.25,
        plantDensity: 1.35,
        foodDensity: 1.15
    },
    water: {
        name: 'Water',
        color: '#315d78',
        movement: 0.72,
        energyDrain: 1.12,
        plantGrowth: 0.65,
        plantDensity: 0.55,
        foodDensity: 0.8
    },
    rock: {
        name: 'Rock / desert',
        color: '#80654a',
        movement: 0.86,
        energyDrain: 0.94,
        plantGrowth: 0.4,
        plantDensity: 0.3,
        foodDensity: 0.55
    }
};

const TYPES = ['meadow', 'water', 'rock'];

function hashCell(x, y) {
    let value = Math.imul(x + 374761393, 668265263) ^ Math.imul(y + 1274126177, 2147483647);
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

export function createZones(width, height, cellSize = 500) {
    const columns = Math.max(1, Math.ceil(width / cellSize));
    const rows = Math.max(1, Math.ceil(height / cellSize));
    const cells = [];
    for (let y = 0; y < rows; y += 1) {
        const row = [];
        for (let x = 0; x < columns; x += 1) {
            row.push(TYPES[Math.floor(hashCell(x, y) * TYPES.length)]);
        }
        cells.push(row);
    }
    // Keep the legend useful even with unusually small worlds.
    const present = new Set(cells.flat());
    TYPES.forEach((type, index) => {
        if (!present.has(type)) cells[index % rows][index % columns] = type;
    });
    return { cellSize, columns, rows, cells };
}

export function zoneAt(zones, width, height, x, y) {
    const wrappedX = ((x % width) + width) % width;
    const wrappedY = ((y % height) + height) % height;
    const column = Math.min(zones.columns - 1, Math.floor(wrappedX / zones.cellSize));
    const row = Math.min(zones.rows - 1, Math.floor(wrappedY / zones.cellSize));
    const type = zones.cells[row][column];
    return { type, ...ZONE_DEFINITIONS[type], column, row };
}

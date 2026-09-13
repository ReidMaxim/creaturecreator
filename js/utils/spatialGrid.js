/**
 * Spatial grid for fast proximity queries
 * Divides world into cells for O(1) neighbor lookup
 */

export class SpatialGrid {
    constructor(worldWidth, worldHeight, cellSize) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.cellSize = cellSize;
        this.cols = Math.ceil(worldWidth / cellSize);
        this.rows = Math.ceil(worldHeight / cellSize);
        this.cells = new Map();
    }

    /**
     * Get cell coordinates for a world position
     */
    getCellKey(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return `${col},${row}`;
    }

    /**
     * Insert entity into grid
     */
    insert(entity) {
        const key = this.getCellKey(entity.x, entity.y);
        if (!this.cells.has(key)) {
            this.cells.set(key, []);
        }
        this.cells.get(key).push(entity);
    }

    /**
     * Get all entities in a cell
     */
    getCell(x, y) {
        const key = this.getCellKey(x, y);
        return this.cells.get(key) || [];
    }

    /**
     * Get all entities within radius of a point
     */
    getNearby(x, y, radius) {
        const result = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const startCol = Math.max(0, Math.floor((x - radius) / this.cellSize));
        const endCol = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
        const startRow = Math.max(0, Math.floor((y - radius) / this.cellSize));
        const endRow = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));

        for (let col = startCol; col <= endCol; col++) {
            for (let row = startRow; row <= endRow; row++) {
                const key = `${col},${row}`;
                const cell = this.cells.get(key);
                if (cell) {
                    result.push(...cell);
                }
            }
        }

        return result;
    }

    /**
     * Clear all cells
     */
    clear() {
        this.cells.clear();
    }

    /**
     * Rebuild grid from entity array
     */
    rebuild(entities) {
        this.clear();
        for (const entity of entities) {
            this.insert(entity);
        }
    }

    /**
     * Get grid statistics (for debugging)
     */
    getStats() {
        let totalEntities = 0;
        let maxInCell = 0;
        for (const cell of this.cells.values()) {
            totalEntities += cell.length;
            maxInCell = Math.max(maxInCell, cell.length);
        }
        return {
            cellsUsed: this.cells.size,
            totalEntities,
            avgPerCell: this.cells.size > 0 ? totalEntities / this.cells.size : 0,
            maxInCell
        };
    }
}

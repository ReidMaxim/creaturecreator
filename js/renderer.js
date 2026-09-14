/**
 * Renderer: Handles all Canvas drawing and camera management
 */

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Camera
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1.0
        };

        // Rendering options
        this.showGrid = false;
        this.showStats = false;
        this.selectedCreature = null;

        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Handle canvas resize
     */
    handleResize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }

    /**
     * Update camera position
     */
    setCameraPosition(x, y) {
        this.camera.x = x;
        this.camera.y = y;
    }

    /**
     * Update camera zoom
     */
    setCameraZoom(zoom) {
        this.camera.zoom = Math.max(0.1, Math.min(5, zoom));
    }

    /**
     * Get camera zoom
     */
    getZoom() {
        return this.camera.zoom;
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        const screenX = (worldX - this.camera.x) * this.camera.zoom + this.width / 2;
        const screenY = (worldY - this.camera.y) * this.camera.zoom + this.height / 2;
        return { x: screenX, y: screenY };
    }

    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        const worldX = (screenX - this.width / 2) / this.camera.zoom + this.camera.x;
        const worldY = (screenY - this.height / 2) / this.camera.zoom + this.camera.y;
        return { x: worldX, y: worldY };
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.fillStyle = '#1a1f3a';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawZones(world) {
        const cell = world.zones.cellSize;
        const startX = Math.floor((this.camera.x - this.width / this.camera.zoom) / cell) * cell;
        const startY = Math.floor((this.camera.y - this.height / this.camera.zoom) / cell) * cell;
        const endX = this.camera.x + this.width / this.camera.zoom;
        const endY = this.camera.y + this.height / this.camera.zoom;
        for (let x = startX; x <= endX; x += cell) {
            for (let y = startY; y <= endY; y += cell) {
                const zone = world.getZoneAt(x + cell / 2, y + cell / 2);
                const topLeft = this.worldToScreen(x, y);
                this.ctx.fillStyle = zone.color;
                this.ctx.globalAlpha = 0.42;
                this.ctx.fillRect(topLeft.x, topLeft.y, cell * this.camera.zoom + 1, cell * this.camera.zoom + 1);
            }
        }
        this.ctx.globalAlpha = 1;
    }

    /**
     * Draw world grid (for debugging)
     */
    drawGrid(worldWidth, worldHeight, gridSize = 500) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;

        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        const endX = startX + (this.width / this.camera.zoom) + gridSize;
        const endY = startY + (this.height / this.camera.zoom) + gridSize;

        // Vertical lines
        for (let x = startX; x < endX; x += gridSize) {
            const screen = this.worldToScreen(x, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(screen.x, 0);
            this.ctx.lineTo(screen.x, this.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = startY; y < endY; y += gridSize) {
            const screen = this.worldToScreen(0, y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, screen.y);
            this.ctx.lineTo(this.width, screen.y);
            this.ctx.stroke();
        }

        // World bounds
        this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
        this.ctx.lineWidth = 2;
        const topLeft = this.worldToScreen(0, 0);
        const bottomRight = this.worldToScreen(worldWidth, worldHeight);
        this.ctx.strokeRect(
            topLeft.x,
            topLeft.y,
            bottomRight.x - topLeft.x,
            bottomRight.y - topLeft.y
        );
    }

    /**
     * Draw food item
     */
    drawFood(food) {
        const screen = this.worldToScreen(food.x, food.y);

        // Draw circle
        this.ctx.fillStyle = '#22c55e';
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, 3 * this.camera.zoom, 0, Math.PI * 2);
        this.ctx.fill();

        // Glow effect
        this.ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, 5 * this.camera.zoom, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawPlant(plant) {
        const screen = this.worldToScreen(plant.x, plant.y);
        const size = (3 + 5 * plant.energy / plant.maxEnergy) * this.camera.zoom;
        this.ctx.fillStyle = '#65a30d';
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#bef264';
        this.ctx.lineWidth = Math.max(1, this.camera.zoom);
        this.ctx.beginPath();
        this.ctx.moveTo(screen.x, screen.y + size);
        this.ctx.lineTo(screen.x, screen.y - size * 1.5);
        this.ctx.stroke();
    }

    /**
     * Draw creature
     */
    drawCreature(creature) {
        const screen = this.worldToScreen(creature.x, creature.y);
        const size = creature.size * this.camera.zoom;

        this.ctx.save();
        this.ctx.translate(screen.x, screen.y);
        this.ctx.rotate(creature.rotation);

        // Body
        this.ctx.fillStyle = creature.color || '#3b82f6';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fill();

        if (creature.isPredator) {
            this.ctx.strokeStyle = '#f97316';
            this.ctx.lineWidth = Math.max(1.5, size * 0.16);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size + 1, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        const parts = creature.parts;
        if (parts && parts.eyes.count) {
            this.ctx.fillStyle = '#f8fafc';
            for (let index = 0; index < parts.eyes.count; index += 1) {
                const spread = (index - (parts.eyes.count - 1) / 2) * size * 0.45;
                this.ctx.beginPath();
                this.ctx.arc(size * 0.58, spread, size * (0.12 + parts.eyes.strength * 0.1), 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        if (parts && parts.mouth.count) {
            this.ctx.strokeStyle = '#3f172e';
            this.ctx.lineWidth = Math.max(1, size * 0.08 * parts.mouth.strength);
            this.ctx.beginPath();
            this.ctx.arc(size * 0.52, 0, size * (0.16 + parts.mouth.count * 0.06), -0.8, 0.8);
            this.ctx.stroke();
        }
        if (parts && parts.motor.count) {
            this.ctx.fillStyle = 'rgba(255,255,255,0.35)';
            for (let index = 0; index < parts.motor.count; index += 1) {
                const side = index % 2 === 0 ? -1 : 1;
                this.ctx.beginPath();
                this.ctx.moveTo(-size * 0.65, side * size * 0.18);
                this.ctx.lineTo(-size * (1 + parts.motor.strength * 0.35), side * size * 0.5);
                this.ctx.lineTo(-size * 0.45, side * size * 0.42);
                this.ctx.closePath();
                this.ctx.fill();
            }
        }

        // Energy indicator (ring)
        const energyPercent = creature.energy / (creature.maxEnergy || 100);
        this.ctx.strokeStyle = energyPercent > 0.5 ? '#22c55e' : energyPercent > 0.25 ? '#eab308' : '#ef4444';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size + 4, 0, Math.PI * 2 * energyPercent);
        this.ctx.stroke();

        this.ctx.restore();
        if (creature === this.selectedCreature) {
            this.ctx.strokeStyle = '#facc15';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, size + 8, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    /**
     * Draw all entities in world
     */
    draw(world) {
        this.clear();
        this.drawZones(world);

        // Draw grid if enabled
        if (this.showGrid) {
            this.drawGrid(world.width, world.height);
        }

        // Draw food
        for (const food of world.food) {
            this.drawFood(food);
        }
        for (const plant of world.plants) this.drawPlant(plant);

        // Draw creatures
        for (const creature of world.creatures) {
            this.drawCreature(creature);
        }
    }

    /**
     * Draw text (for debug/info)
     */
    drawText(text, x, y, options = {}) {
        const {
            size = 14,
            color = '#e0e0e0',
            align = 'left',
            font = 'Arial'
        } = options;

        this.ctx.fillStyle = color;
        this.ctx.font = `${size}px ${font}`;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(text, x, y);
    }

    /**
     * Get visible world bounds
     */
    getVisibleBounds() {
        const topLeft = this.screenToWorld(0, 0);
        const bottomRight = this.screenToWorld(this.width, this.height);
        return {
            minX: topLeft.x,
            minY: topLeft.y,
            maxX: bottomRight.x,
            maxY: bottomRight.y
        };
    }
}

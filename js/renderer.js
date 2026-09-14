/**
 * Renderer: Handles all Canvas drawing and camera management
 */
import { phenotypeState } from './genetics/phenotype.js';

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

            // Phase 29: Seasonal background tint
            const seasonalEffects = world.getSeasonalEffects ? world.getSeasonalEffects() : { seasonColor: '#1a1f3a', isNight: false };
            const seasonTint = seasonalEffects.seasonColor || '#1a1f3a';

            for (let x = startX; x <= endX; x += cell) {
                for (let y = startY; y <= endY; y += cell) {
                    const zone = world.getZoneAt(x + cell / 2, y + cell / 2);
                    const topLeft = this.worldToScreen(x, y);
                    // Blend zone color with seasonal tint
                    this.ctx.fillStyle = this.blendColors(zone.color, seasonTint, 0.15);
                    this.ctx.globalAlpha = 0.42;
                    this.ctx.fillRect(topLeft.x, topLeft.y, cell * this.camera.zoom + 1, cell * this.camera.zoom + 1);
                }
            }
            this.ctx.globalAlpha = 1;

            // Phase 29: Night overlay
            if (seasonalEffects.isNight) {
                this.ctx.fillStyle = 'rgba(10, 15, 35, 0.25)';
                this.ctx.fillRect(0, 0, this.width, this.height);
            }
        }

        // Helper: Blend two hex colors
        blendColors(color1, color2, ratio) {
            const c1 = this.hexToRgb(color1);
            const c2 = this.hexToRgb(color2);
            if (!c1 || !c2) return color1;
            const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
            const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
            const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio);
            return `rgb(${r}, ${g}, ${b})`;
        }

        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
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
        const phenotype = creature.phenotype || {};
        const size = creature.size * (phenotype.growth || 1) * this.camera.zoom;
        const width = size * (phenotype.width || 1);
        const length = size * (phenotype.length || 1);
        const state = phenotypeState(creature);

        this.ctx.save();
        this.ctx.translate(screen.x, screen.y);
        this.ctx.rotate(creature.rotation);

        this.ctx.fillStyle = phenotype.color || creature.color || '#3b82f6';
        this.ctx.beginPath();
        if (phenotype.shape === 1) {
            this.ctx.ellipse(0, 0, length, width, 0, 0, Math.PI * 2);
        } else if (phenotype.shape === 2) {
            this.ctx.moveTo(length, 0);
            this.ctx.lineTo(0, width);
            this.ctx.lineTo(-length, 0);
            this.ctx.lineTo(0, -width);
            this.ctx.closePath();
        } else if (phenotype.shape === 3) {
            this.ctx.moveTo(length, 0);
            this.ctx.quadraticCurveTo(0, width * 1.2 * phenotype.taper, -length, 0);
            this.ctx.quadraticCurveTo(0, -width * 1.2 * phenotype.taper, length, 0);
        } else {
            this.ctx.ellipse(0, 0, length, width, 0, 0, Math.PI * 2);
        }
        this.ctx.fill();

        if (phenotype.tail > 0) {
            this.ctx.fillStyle = phenotype.accentColor || '#f8fafc';
            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            this.ctx.moveTo(-length * 0.55, 0);
            if (phenotype.tail === 1) {
                this.ctx.lineTo(-length * (1.05 + phenotype.fin * 0.3), -width * 0.55);
                this.ctx.lineTo(-length * (1.05 + phenotype.fin * 0.3), width * 0.55);
            } else {
                this.ctx.lineTo(-length * (1.1 + phenotype.fin * 0.35), -width * 0.85);
                this.ctx.lineTo(-length * (1.1 + phenotype.fin * 0.35), width * 0.85);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        // Deterministic markings are derived from the inherited pattern gene.
        if ((phenotype.pattern || 0) > 0) {
            this.ctx.strokeStyle = phenotype.accentColor || '#f8fafc';
            this.ctx.globalAlpha = 0.38;
            this.ctx.lineWidth = Math.max(1, size * 0.12);
            for (let mark = 0; mark < phenotype.pattern; mark += 1) {
                this.ctx.beginPath();
                const markOffset = mark * length * 0.42 * phenotype.patternScale;
                this.ctx.moveTo(-length * 0.65 + markOffset, -width * 0.72);
                this.ctx.lineTo(-length * 0.25 + markOffset, width * 0.72);
                this.ctx.stroke();
            }
            this.ctx.globalAlpha = 1;
        }
        if (creature.isPredator || (phenotype.armor || 0) > 0.65) {
            this.ctx.strokeStyle = creature.isPredator ? '#f97316' : '#cbd5e1';
            this.ctx.lineWidth = Math.max(1.5, size * (0.08 + (phenotype.armor || 0) * 0.1));
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, length + 1, width + 1, 0, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        this.ctx.strokeStyle = creature.lineageColor || '#94a3b8';
        this.ctx.globalAlpha = 0.7;
        this.ctx.lineWidth = Math.max(1, size * 0.045);
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, length + 3, width + 3, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;

        const parts = creature.parts;
        if (parts && parts.eyes.count) {
            this.ctx.fillStyle = '#f8fafc';
            for (let index = 0; index < parts.eyes.count; index += 1) {
                const spread = (index - (parts.eyes.count - 1) / 2)
                    * width * 0.65 * phenotype.eyeSpacing;
                this.ctx.beginPath();
                const eyeRadius = size * (0.1 + parts.eyes.strength * 0.1);
                if (phenotype.eyeStyle === 1) this.ctx.ellipse(length * 0.62, spread, eyeRadius * 1.35, eyeRadius, 0, 0, Math.PI * 2);
                else this.ctx.arc(length * 0.62, spread, eyeRadius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#172033';
                this.ctx.beginPath();
                this.ctx.arc(length * 0.66, spread, eyeRadius * phenotype.pupilSize, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#f8fafc';
            }
        }
        if (parts && parts.mouth.count) {
            this.ctx.strokeStyle = '#3f172e';
            this.ctx.lineWidth = Math.max(1, size * 0.08 * parts.mouth.strength);
            this.ctx.beginPath();
            if (phenotype.mouthStyle === 1) {
                this.ctx.moveTo(length * 0.55, -width * 0.18);
                this.ctx.lineTo(length * 0.78, 0);
                this.ctx.lineTo(length * 0.55, width * 0.18);
            } else {
                this.ctx.arc(length * 0.58, 0,
                    size * (0.14 + parts.mouth.count * 0.06) * phenotype.mouthSize, -0.8, 0.8);
            }
            this.ctx.stroke();
        }
        if (parts && parts.motor.count) {
            this.ctx.fillStyle = phenotype.accentColor || 'rgba(255,255,255,0.35)';
            for (let index = 0; index < parts.motor.count; index += 1) {
                const side = index % 2 === 0 ? -1 : 1;
                this.ctx.beginPath();
                this.ctx.moveTo(-length * 0.55, side * width * 0.18);
                this.ctx.lineTo(-length * (0.9 + parts.motor.strength * 0.35) * phenotype.motorLength,
                    side * width * (0.45 + (phenotype.fin || 0) * 0.2 + phenotype.finAngle * side));
                this.ctx.lineTo(-length * 0.4, side * width * 0.42);
                this.ctx.closePath();
                this.ctx.fill();
            }
        }
        if (state === 'hungry') {
            this.ctx.strokeStyle = '#ef4444';
            this.ctx.setLineDash([2, 2]);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size + 5, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

                // Phase 29: Disease visual indicators
                if (creature.diseases && creature.diseases.length > 0) {
                    this.drawDiseaseIndicators(creature, size, length, width);
                }

                // Phase 29: Niche specialization visual indicators
                this.drawNicheIndicators(creature, phenotype, size, length, width);

                // Energy indicator (ring)
                const energyPercent = creature.energy / (creature.maxEnergy || 100);
                this.ctx.strokeStyle = energyPercent > 0.5 ? '#22c55e' : energyPercent > 0.25 ? '#eab308' : '#ef4444';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, Math.max(length, width) + 4, 0, Math.PI * 2 * energyPercent);
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

            // Phase 29: Draw disease indicators on creature
            drawDiseaseIndicators(creature, size, length, width) {
                const maxRadius = Math.max(length, width);
                for (let i = 0; i < creature.diseases.length; i++) {
                    const disease = creature.diseases[i];
                    const angle = (i * Math.PI * 2 / creature.diseases.length) - Math.PI / 2;
                    const indicatorRadius = maxRadius + 8 + i * 4;

                    // Disease ring segment
                    this.ctx.strokeStyle = disease.color;
                    this.ctx.lineWidth = Math.max(1.5, size * 0.08);
                    this.ctx.globalAlpha = 0.6 + disease.severity * 0.3;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, indicatorRadius, angle - 0.4, angle + 0.4);
                    this.ctx.stroke();
                    this.ctx.globalAlpha = 1;

                    // Disease particle effect (small dots)
                    if (disease.severity > 0.5) {
                        this.ctx.fillStyle = disease.color;
                        for (let p = 0; p < 3; p++) {
                            const particleAngle = angle + (Math.random() - 0.5) * 0.6;
                            const particleDist = indicatorRadius + Math.random() * 6;
                            const px = Math.cos(particleAngle) * particleDist;
                            const py = Math.sin(particleAngle) * particleDist;
                            this.ctx.beginPath();
                            this.ctx.arc(px, py, Math.max(1, size * 0.04), 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                    }
                }

                // Overall disease glow if heavily infected
                const totalSeverity = creature.diseases.reduce((sum, d) => sum + d.severity, 0);
                if (totalSeverity > 1.2) {
                    this.ctx.strokeStyle = '#ef4444';
                    this.ctx.lineWidth = 2;
                    this.ctx.globalAlpha = 0.3;
                    this.ctx.setLineDash([4, 4]);
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, maxRadius + 12, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.setLineDash([]);
                    this.ctx.globalAlpha = 1;
                }
            }

            // Phase 29: Draw niche specialization indicators
            drawNicheIndicators(creature, phenotype, size, length, width) {
                const maxRadius = Math.max(length, width);
                const indicators = [];

                // Burrowing indicator
                if (phenotype.burrowing > 0.4) {
                    indicators.push({
                        symbol: '▼',
                        color: '#8b7355',
                        offset: { x: -length * 0.7, y: -width * 0.7 },
                        size: phenotype.burrowing
                    });
                }

                // Climbing indicator
                if (phenotype.climbing > 0.4) {
                    indicators.push({
                        symbol: '▲',
                        color: '#6b7280',
                        offset: { x: length * 0.7, y: -width * 0.7 },
                        size: phenotype.climbing
                    });
                }

                // Nocturnal indicator
                if (phenotype.nocturnal > 0.5) {
                    indicators.push({
                        symbol: '☾',
                        color: '#6366f1',
                        offset: { x: 0, y: -width * 0.9 },
                        size: phenotype.nocturnal
                    });
                }

                // Water depth preference
                if (phenotype.waterDepthPreference > 0.6 && phenotype.deepWaterForaging > 0.4) {
                    indicators.push({
                        symbol: '▼',
                        color: '#1e40af',
                        offset: { x: -length * 0.5, y: width * 0.8 },
                        size: phenotype.deepWaterForaging
                    });
                } else if (phenotype.waterDepthPreference < 0.4 && phenotype.surfaceFeeding > 0.5) {
                    indicators.push({
                        symbol: '△',
                        color: '#06b6d4',
                        offset: { x: length * 0.5, y: width * 0.8 },
                        size: phenotype.surfaceFeeding
                    });
                }

                // Draw indicators
                for (const indicator of indicators) {
                    this.ctx.fillStyle = indicator.color;
                    this.ctx.font = `${Math.max(8, size * 0.15 * indicator.size)}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.globalAlpha = 0.8 * indicator.size;
                    this.ctx.fillText(indicator.symbol, indicator.offset.x, indicator.offset.y);
                    this.ctx.globalAlpha = 1;
                }
            }

    /**
     * Draw all entities in world
     */
    draw(world) {
        this.clear();
        this.drawZones(world);
        if (world.event) this.drawEventEffect(world.event);

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

    drawEventEffect(event) {
        this.ctx.fillStyle = event.type === 'storm'
            ? 'rgba(96, 165, 250, 0.08)'
            : event.type === 'drought' ? 'rgba(245, 158, 11, 0.06)' : 'rgba(34, 197, 94, 0.05)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = event.color;
        this.ctx.globalAlpha = 0.8;
        this.ctx.fillRect(0, 0, this.width, 3);
        this.ctx.globalAlpha = 1;
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

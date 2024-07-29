import VDOM from '../core/dom.mjs';
import EventHandler from '../core/events.js';
import StateManager from '../core/state.js';

export let mapWidth;

const mapClass = {
    EMPTY_DIV_CLASS: 'empty-div',
    BORDER_WALL_CLASS: 'border-wall',
    PILLAR_WALL_CLASS: 'pillar-wall',
    BRITTLE_BRICK_CLASS: 'brittle-brick',
    POWERUP_CLASS: 'powerup'
};

class GameRenderer {
    constructor(gameBody, eventHandler, mapData) {
        this.gameBody = gameBody;
        this.eventHandler = eventHandler;
        this.stateManager = new StateManager({ mapDiv: null });
        this.tilePool = new Map();
        this.lastSize = { width: 0, height: 0 };
        this.resizeTimeout = null;
        this.mapData = mapData;
    }

    createDivs() {
        const mapDiv = this.createDiv('mapDiv', '100%', '95%');
        this.gameBody.append(mapDiv.render());
        this.stateManager.setState({ mapDiv });
    }

    createDiv(id, width, height) {
        return VDOM.createElement('div', { id, style: { width, height } });
    }

    renderMap() {
        const gameBodyWidth = this.gameBody.offsetWidth;
        const gameBodyHeight = this.gameBody.offsetHeight * 0.95;

        if (this.lastSize.width !== gameBodyWidth || this.lastSize.height !== gameBodyHeight) {
            this.calculateTileSize(gameBodyWidth, gameBodyHeight);
            this.lastSize = { width: gameBodyWidth, height: gameBodyHeight };
        }

        const gridWidth = this.tileSize * this.mapData.columns;
        const gridHeight = this.tileSize * this.mapData.rows;
        const offsetX = (gameBodyWidth - gridWidth) / 2;
        const offsetY = (gameBodyHeight - gridHeight) / 2;

        this.setupmapDiv(gridWidth, gridHeight, offsetX, offsetY);

        const fragment = VDOM.createElement('fragment');
        for (let row = 0; row < this.mapData.rows; row++) {
            for (let col = 0; col < this.mapData.columns; col++) {
                const tileType = this.mapData.map[row][col];
                fragment.children.push(this.createOrUpdateTile(tileType, col, row));
            }
        }
        this.stateManager.getState().mapDiv.children = [fragment];
        this.gameBody.querySelector('#mapDiv').replaceWith(this.stateManager.getState().mapDiv.render());
    }

    setupmapDiv(width, height, left, top) {
        Object.assign(this.stateManager.getState().mapDiv.attrs.style, {
            position: 'relative',
            width: `${width}px`,
            height: `${height}px`,
            left: `${left}px`,
            top: `${top}px`
        });
    }

    createOrUpdateTile(tileType, col, row) {
        const key = `${col}-${row}`;
        let tile = this.tilePool.get(key);

        if (!tile) {
            tile = this.createTile(tileType, col, row);
            this.tilePool.set(key, tile);
        } else {
            this.updateTile(tile, tileType, col, row);
        }

        return tile;
    }

    createTile(tileType, col, row) {
        const color = this.getColor(tileType);
        const className = this.getTileClassName(tileType, col, row);

        return VDOM.createElement('div', {
            class: className,
            id: `${className}-${row}-${col}`,
            style: {
                backgroundColor: color,
                position: 'absolute',
                left: `${col * this.tileSize}px`,
                top: `${row * this.tileSize}px`,
                width: `${this.tileSize}px`,
                height: `${this.tileSize}px`
            }
        });
    }

    updateTile(tile, tileType, col, row) {
        const color = this.getColor(tileType);
        const className = this.getTileClassName(tileType, col, row);

        tile.attrs.class = className;
        tile.attrs.style.backgroundColor = color;
        tile.attrs.style.left = `${col * this.tileSize}px`;
        tile.attrs.style.top = `${row * this.tileSize}px`;
        tile.attrs.style.width = `${this.tileSize}px`;
        tile.attrs.style.height = `${this.tileSize}px`;
    }

    getTileClassName(tileType, col, row) {
        switch (tileType) {
            case 1: // WALL
                return (row === 0 || row === this.mapData.rows - 1 || col === 0 || col === this.mapData.columns - 1) 
                    ? mapClass.BORDER_WALL_CLASS 
                    : mapClass.PILLAR_WALL_CLASS;
            case 2: // BRICK
                return mapClass.BRITTLE_BRICK_CLASS;
            case 0: // EMPTY
                return mapClass.EMPTY_DIV_CLASS;
            case 3: // POWERUP
                return mapClass.POWERUP_CLASS;
            default:
                return '';
        }
    }

    getColor(tileType) {
        switch (tileType) {
            case 1: return "black";  // WALL
            case 2: return "white";  // BRICK
            case 3: return "yellow"; // POWERUP
            default: return "transparent";
        }
    }

    calculateTileSize(gameBodyWidth, gameBodyHeight) {
        const gameBodyAspectRatio = gameBodyWidth / gameBodyHeight;
        const mapAspectRatio = this.mapData.columns / this.mapData.rows;

        if (mapAspectRatio > gameBodyAspectRatio) {
            this.tileSize = gameBodyWidth / this.mapData.columns;
        } else {
            this.tileSize = gameBodyHeight / this.mapData.rows;
        }
        mapWidth = this.tileSize;
    }

    onResize() {
        if (this.resizeTimeout) {
            cancelAnimationFrame(this.resizeTimeout);
        }
        this.resizeTimeout = requestAnimationFrame(() => this.renderMap());
    }

    attachEventListeners() {
        this.eventHandler.on(window, 'resize', () => this.onResize());
    }

    initialize() {
        this.createDivs();
        this.renderMap();
        this.attachEventListeners();
    }
}

export function insertMap(mapData) {
    console.log('Inserting map');
    const gameBody = document.getElementById("maps");
    const eventHandler = new EventHandler();
    const gameRenderer = new GameRenderer(gameBody, eventHandler, mapData);
    gameRenderer.initialize();
}
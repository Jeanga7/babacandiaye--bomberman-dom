import VDOM from '../core/dom.mjs';
import EventHandler from '../core/events.js';
import StateManager from '../core/state.js';

var mapWidth;

const mapClass = {
    EMPTY_DIV_CLASS: 'empty-div',
    BORDER_WALL_CLASS: 'border-wall',
    PILLAR_WALL_CLASS: 'pillar-wall',
    BRITTLE_BRICK_CLASS: 'brittle-brick',
    POWERUP_CLASS: 'powerup'
};

const tileMap = {
    columns: 21,
    rows: 13,
    tileSize: 0,
    tileTypes: {
        EMPTY: 0,
        WALL: 1,
        BRICK: 2,
        POWERUP: 3,
        SPECIALPOWERUP: 4
    },
    colorMap: {
        1: "black",  // WALL
        2: "white",  // BRICK
        3: "yellow"  // POWERUP 
    },
    gameConfig: {
        BRICK_COUNT: 60,
        MAIN_DIV_HEIGHT_PERCENTAGE: 95
    },
    map: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],

    getTile(col, row) {
        return this.map[row][col];
    },

    getColor(tileType) {
        return this.colorMap[tileType] || "transparent";
    },

    placeRandomBricks(count) {
        let placed = 0;
        while (placed < count) {
            const randomRow = Math.floor(Math.random() * (this.rows - 2)) + 1;
            const randomCol = Math.floor(Math.random() * (this.columns - 2)) + 1;

            if (
                (randomRow <= 3 && (randomCol <= 3 || randomCol >= this.columns - 4)) ||
                (randomRow >= this.rows - 4 && (randomCol <= 3 || randomCol >= this.columns - 4))
            ) {
                continue;
            }

            if (this.map[randomRow][randomCol] === this.tileTypes.EMPTY) {
                this.map[randomRow][randomCol] = this.tileTypes.BRICK;
                placed++;
            }
        }
    },

    calculateTileSize(gameBodyWidth, gameBodyHeight) {
        const gameBodyAspectRatio = gameBodyWidth / gameBodyHeight;
        const mapAspectRatio = this.columns / this.rows;

        if (mapAspectRatio > gameBodyAspectRatio) {
            this.tileSize = gameBodyWidth / this.columns;
        } else {
            this.tileSize = gameBodyHeight / this.rows;
        }
        mapWidth = this.tileSize;
    }
};

class GameRenderer {
    constructor(gameBody, eventHandler) {
        this.gameBody = gameBody;
        this.eventHandler = eventHandler;
        this.stateManager = new StateManager({ mapDiv: null });
        this.tilePool = new Map();
        this.lastSize = { width: 0, height: 0 };
        this.resizeTimeout = null;
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
        const gameBodyHeight = this.gameBody.offsetHeight * (tileMap.gameConfig.MAIN_DIV_HEIGHT_PERCENTAGE / 100);

        if (this.lastSize.width !== gameBodyWidth || this.lastSize.height !== gameBodyHeight) {
            tileMap.calculateTileSize(gameBodyWidth, gameBodyHeight);
            this.lastSize = { width: gameBodyWidth, height: gameBodyHeight };
        }

        const gridWidth = tileMap.tileSize * tileMap.columns;
        const gridHeight = tileMap.tileSize * tileMap.rows;
        const offsetX = (gameBodyWidth - gridWidth) / 2;
        const offsetY = (gameBodyHeight - gridHeight) / 2;

        this.setupmapDiv(gridWidth, gridHeight, offsetX, offsetY);

        const fragment = VDOM.createElement('fragment');
        for (let row = 0; row < tileMap.rows; row++) {
            for (let col = 0; col < tileMap.columns; col++) {
                const tileType = tileMap.getTile(col, row);
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
        const color = tileMap.getColor(tileType);
        const className = this.getTileClassName(tileType, col, row);

        return VDOM.createElement('div', {
            class: className,
            id: `${className}-${row}-${col}`,
            style: {
                backgroundColor: color,
                position: 'absolute',
                left: `${col * tileMap.tileSize}px`,
                top: `${row * tileMap.tileSize}px`,
                width: `${tileMap.tileSize}px`,
                height: `${tileMap.tileSize}px`
            }
        });
    }

    updateTile(tile, tileType, col, row) {
        const color = tileMap.getColor(tileType);
        const className = this.getTileClassName(tileType, col, row);

        tile.attrs.class = className;
        tile.attrs.style.backgroundColor = color;
        tile.attrs.style.left = `${col * tileMap.tileSize}px`;
        tile.attrs.style.top = `${row * tileMap.tileSize}px`;
        tile.attrs.style.width = `${tileMap.tileSize}px`;
        tile.attrs.style.height = `${tileMap.tileSize}px`;
    }

    getTileClassName(tileType, col, row) {
        switch (tileType) {
            case tileMap.tileTypes.WALL:
                return (row === 0 || row === tileMap.rows - 1 || col === 0 || col === tileMap.columns - 1) 
                    ? mapClass.BORDER_WALL_CLASS 
                    : mapClass.PILLAR_WALL_CLASS;
            case tileMap.tileTypes.BRICK:
                return mapClass.BRITTLE_BRICK_CLASS;
            case tileMap.tileTypes.EMPTY:
                return mapClass.EMPTY_DIV_CLASS;
            case tileMap.tileTypes.POWERUP:
                return mapClass.POWERUP_CLASS;
            default:
                return '';
        }
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
        // tileMap.placeRandomBricks(tileMap.gameConfig.BRICK_COUNT);
        this.createDivs();
        this.renderMap();
        this.attachEventListeners();
    }
}

function insertMap() {
    const gameBody = document.getElementById("maps");
    const eventHandler = new EventHandler();
    const gameRenderer = new GameRenderer(gameBody, eventHandler);
    gameRenderer.initialize();
}

export { mapWidth, insertMap };
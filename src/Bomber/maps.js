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
    tileSize: 45,
    tileTypes: {
        EMPTY: 0,
        WALL: 1,
        BRICK: 2,
        POWERUP: 3,
        SPECIALPOWERUP: 4,
        BRICK_WITH_POWERUP: 5
    },
    svgMap: {
        1: "../assets/Wall.svg",
        2: "../assets/Brick.svg",
        3: "../assets/RedPowerup.svg",
    },
    gameConfig: {
        BRICK_COUNT: 60,
        MAIN_DIV_HEIGHT_PERCENTAGE: 95
    },
    map: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
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
    bricksWithPowerup: [],

    getTile(col, row) {
        return this.map[row][col];
    },

    hasPowerup(row, col) {
        return this.map[row][col] === this.tileTypes.BRICK_WITH_POWERUP;
    },

    placeRandomBricks(count) {
        let placed = 0;
        this.bricksWithPowerup = []; // Réinitialiser la liste
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
                if (Math.random() < 0.1) {
                    this.map[randomRow][randomCol] = this.tileTypes.BRICK_WITH_POWERUP;
                    this.bricksWithPowerup.push({ row: randomRow, col: randomCol });
                } else {
                    this.map[randomRow][randomCol] = this.tileTypes.BRICK;
                }
                placed++;
            }
        }
    }
};

mapWidth = tileMap.tileSize;

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
        const className = this.getTileClassName(tileType, col, row);
        const svgPath = tileMap.svgMap[tileType === tileMap.tileTypes.BRICK_WITH_POWERUP ? tileMap.tileTypes.BRICK : tileType];

        const tileDiv = VDOM.createElement('div', {
            class: className,
            id: `${className}-${row}-${col}`,
            style: {
                position: 'absolute',
                left: `${col * tileMap.tileSize}px`,
                top: `${row * tileMap.tileSize}px`,
                width: `${tileMap.tileSize}px`,
                height: `${tileMap.tileSize}px`
            }
        });

        if (svgPath) {
            const svgElement = VDOM.createElement('img', {
                src: svgPath,
                style: {
                    width: '100%',
                    height: '100%'
                }
            });
            tileDiv.children.push(svgElement);
        }

        if (tileType === tileMap.tileTypes.BRICK_WITH_POWERUP) {
            const powerupDiv = VDOM.createElement('div', {
                class: mapClass.POWERUP_CLASS, 
                style: {
                    position: 'absolute',
                    left: '0',
                    top: '0',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'red',
                    display: 'none'
                }
            });
            tileDiv.children.push(powerupDiv);
        }

        return tileDiv;
    }

    updateTile(tile, tileType, col, row) {
        const className = this.getTileClassName(tileType, col, row);
        const svgPath = tileMap.svgMap[tileType === tileMap.tileTypes.BRICK_WITH_POWERUP ? tileMap.tileTypes.BRICK : tileType];

        tile.attrs.class = className;
        tile.attrs.style.left = `${col * tileMap.tileSize}px`;
        tile.attrs.style.top = `${row * tileMap.tileSize}px`;
        tile.attrs.style.width = `${tileMap.tileSize}px`;
        tile.attrs.style.height = `${tileMap.tileSize}px`;

        if (svgPath) {
            if (tile.children.length === 0) {
                const svgElement = VDOM.createElement('img', {
                    src: svgPath,
                    style: {
                        width: '100%',
                        height: '100%'
                    }
                });
                tile.children.push(svgElement);
            } else {
                tile.children[0].attrs.src = svgPath;
            }
        } else {
            tile.children = [];
        }

        if (tileType === tileMap.tileTypes.BRICK_WITH_POWERUP && tile.children.length === 1) {
            const powerupDiv = VDOM.createElement('div', {
                class: mapClass.POWERUP_CLASS, 
                style: {
                    position: 'absolute',
                    left: '0',
                    top: '0',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'red',
                    display: 'none'
                }
            });
            tile.children.push(powerupDiv);
        }
    }

    getTileClassName(tileType, col, row) {
        switch (tileType) {
            case tileMap.tileTypes.WALL:
                return (row === 0 || row === tileMap.rows - 1 || col === 0 || col === tileMap.columns - 1) 
                    ? mapClass.BORDER_WALL_CLASS 
                    : mapClass.PILLAR_WALL_CLASS;
            case tileMap.tileTypes.BRICK:
            case tileMap.tileTypes.BRICK_WITH_POWERUP:
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
        tileMap.placeRandomBricks(tileMap.gameConfig.BRICK_COUNT);
        this.createDivs();
        this.renderMap();
        // this.attachEventListeners();
    }
}

function destroyBrick(row, col) {
    const tileType = tileMap.getTile(col, row);
    const tileDiv = document.getElementById(`${mapClass.BRITTLE_BRICK_CLASS}-${row}-${col}`);

    if (tileType === tileMap.tileTypes.BRICK_WITH_POWERUP) {
        tileMap.map[row][col] = tileMap.tileTypes.POWERUP;
        
        // Supprimer l'élément de brique
        tileDiv.querySelector('img').remove();
        
        // Afficher le powerup
        const powerupDiv = tileDiv.querySelector(`.${mapClass.POWERUP_CLASS}`);
        powerupDiv.style.display = 'block';
        
        // Changer la classe du tileDiv
        tileDiv.className = mapClass.POWERUP_CLASS;
        tileDiv.id = `${mapClass.POWERUP_CLASS}-${row}-${col}`;

        // Retirer cette brique de la liste des briques avec powerup
        tileMap.bricksWithPowerup = tileMap.bricksWithPowerup.filter(brick => brick.row !== row || brick.col !== col);
    } else if (tileType === tileMap.tileTypes.BRICK) {
        tileMap.map[row][col] = tileMap.tileTypes.EMPTY;
        // Supprimer complètement l'élément de brique
        tileDiv.remove();
    }
}

function getBricksWithPowerup() {
    return tileMap.bricksWithPowerup;
}

function insertMap() {
    const gameBody = document.getElementById("maps");
    const eventHandler = new EventHandler();
    const gameRenderer = new GameRenderer(gameBody, eventHandler);
    gameRenderer.initialize();
}

export { mapWidth, insertMap, destroyBrick, getBricksWithPowerup };
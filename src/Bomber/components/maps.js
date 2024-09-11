import VDOM from "../../core/dom.mjs";
import EventHandler from "../../core/events.js";
import StateManager from "../../core/state.js";
import { playerPositions } from "./Player.js";

var mapWidth;

export var allpos = {}

export var positionsplayers = {}

const mapClass = {
  EMPTY_DIV_CLASS: "empty-div",
  BORDER_WALL_CLASS: "border-wall",
  PILLAR_WALL_CLASS: "pillar-wall",
  BRITTLE_BRICK_CLASS: "brittle-brick",
  POWERUP_CLASS: "powerup",
  POWERUP_BOMB_CLASS: "powerup-bomb",
  POWERUP_SPEED_CLASS: "powerup-speed",
  POWERUP_FLAME_CLASS: "powerup-flame",
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
    BRICK_WITH_POWERUP: 4
  },
  svgMap: {
    1: "../assets/Wall.svg",
    2: "../assets/Brick.svg",
  },
  gameConfig: {
    BRICK_COUNT: 60,
    MAIN_DIV_HEIGHT_PERCENTAGE: 95,
  },
  map: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 2, 0, 2, 0, 0, 2, 0, 2, 2, 2, 2, 0, 2, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 2, 1, 2, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 2, 2, 0, 0, 2, 4, 2, 2, 0, 0, 2, 0, 0, 0, 0, 1],
    [1, 2, 1, 0, 1, 0, 1, 0, 1, 2, 1, 2, 1, 0, 1, 0, 1, 2, 1, 2, 1],
    [1, 2, 0, 2, 0, 2, 0, 2, 0, 0, 0, 2, 0, 2, 4, 2, 2, 0, 4, 2, 1],
    [1, 0, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 0, 1, 2, 1, 0, 1, 2, 1],
    [1, 2, 2, 2, 0, 2, 2, 0, 0, 2, 2, 4, 0, 2, 0, 2, 0, 2, 0, 0, 1],
    [1, 4, 1, 0, 1, 2, 1, 2, 1, 0, 1, 2, 1, 2, 1, 0, 1, 0, 1, 2, 1],
    [1, 0, 0, 0, 2, 0, 0, 2, 0, 2, 2, 2, 2, 0, 0, 4, 2, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 2, 1, 2, 1, 0, 1, 2, 1, 2, 1, 2, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 2, 0, 2, 2, 2, 4, 2, 2, 2, 2, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],

  bricksWithPowerup: [],

  getTile(col, row) {
    return this.map[row][col];
  },

  hasPowerup(row, col) {
    return this.map[row][col] === this.tileTypes.POWERUP;
  },

  placeRandomBricks(count) {
    let placed = 0;
    this.bricksWithPowerup = [];
    while (placed < count) {
      const randomRow = Math.floor(Math.random() * (this.rows - 2)) + 1;
      const randomCol = Math.floor(Math.random() * (this.columns - 2)) + 1;

      if (
        (randomRow <= 3 && (randomCol <= 3 || randomCol >= this.columns - 4)) ||
        (randomRow >= this.rows - 4 &&
          (randomCol <= 3 || randomCol >= this.columns - 4))
      ) {
        continue;
      }

      if (this.map[randomRow][randomCol] === this.tileTypes.EMPTY) {
        this.map[randomRow][randomCol] = this.tileTypes.BRICK;
        placed++;
      }
    }
  },
};

mapWidth = tileMap.tileSize;

class GameRenderer {
  constructor(gameBody, eventHandler, objetOfPlayer) {
    this.gameBody = gameBody;
    this.eventHandler = eventHandler;
    this.stateManager = new StateManager({ mapDiv: null });
    this.tilePool = new Map();
    this.lastSize = { width: 0, height: 0 };
    this.resizeTimeout = null;
    this.currentPowerupIndex = 0;
    this.powerupTypes = ["bomb", "speed", "flame"];
    this.allPlayers = objetOfPlayer;
  }

  createDivs() {
    const mapDiv = this.createDiv("mapDiv", "100%", "95%");
    this.gameBody.append(mapDiv.render());
    this.stateManager.setState({ mapDiv });
  }

  createDiv(id, width, height) {
    return VDOM.createElement("div", { id, style: { width, height } });
  }

  renderMap() {
    console.log("les players", this.allPlayers);
    const gameBodyWidth = this.gameBody.offsetWidth;
    const gameBodyHeight =
      this.gameBody.offsetHeight *
      (tileMap.gameConfig.MAIN_DIV_HEIGHT_PERCENTAGE / 100);

    if (
      this.lastSize.width !== gameBodyWidth ||
      this.lastSize.height !== gameBodyHeight
    ) {
      this.lastSize = { width: gameBodyWidth, height: gameBodyHeight };
    }

    const gridWidth = tileMap.tileSize * tileMap.columns;
    const gridHeight = tileMap.tileSize * tileMap.rows;
    const offsetX = (gameBodyWidth - gridWidth) / 2;
    const offsetY = (gameBodyHeight - gridHeight) / 2;

    this.setupmapDiv(gridWidth, gridHeight, offsetX, offsetY);

    const fragment = VDOM.createElement("fragment");
    for (let row = 0; row < tileMap.rows; row++) {
      for (let col = 0; col < tileMap.columns; col++) {
        const tileType = tileMap.getTile(col, row);
        fragment.children.push(this.createOrUpdateTile(tileType, col, row));
      }
    }
    this.stateManager.getState().mapDiv.children = [fragment];
    this.gameBody
      .querySelector("#mapDiv")
      .replaceWith(this.stateManager.getState().mapDiv.render());

    const maxPlayers = Math.min(this.allPlayers.length, 4);
    const positions = this.getPlayerPositions(
      gridWidth,
      gridHeight,
      maxPlayers
    );

    for (let i = 0; i < maxPlayers; i++) {
      const player = this.allPlayers[i];
      const playerPosition = positions[i];
      allpos[player] = playerPosition
      this.createOrUpdatePlayer(player, playerPosition.x, playerPosition.y);
    }
  }

  getPlayerPositions(gridWidth, gridHeight, maxPlayers) {
    const positions = [];
    // const padding = 20; // Distance from the edges

    const possiblePositions = [
      { x: 1, y: 1 },
      { x: 1, y: 19 },
      { x: 11, y: 1 },
      { x: 11, y: 19 },
    ];

    for (let i = 0; i < maxPlayers; i++) {
      positions.push(possiblePositions[i]);
    }

    return positions;
  }

  // Function to create or update a player on the map
  createOrUpdatePlayer(player, x, y) {
    let playerElement = VDOM.createElement("div", {
      class: "player",
      id: `player-${player}`,
      style: {
        position: "absolute",
        left: `${y * 45}px`,//"45px"
        top: `${x * 45}px`,//"45px"
      },
    });
    document.getElementById("mapDiv").appendChild(playerElement.render());
  }

  setupmapDiv(width, height, left, top) {
    Object.assign(this.stateManager.getState().mapDiv.attrs.style, {
      position: "relative",
      width: `${width}px`,
      height: `${height}px`,
      left: `${left}px`,
      top: `${top}px`,
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
    const svgPath = tileMap.svgMap[tileType];

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
      const brickDiv = VDOM.createElement('div', {
        class: mapClass.BRITTLE_BRICK_CLASS,
        id: `${mapClass.BRITTLE_BRICK_CLASS}-${row}-${col}`,
        style: {
          position: 'absolute',
          left: `${col * tileMap.tileSize}px`,
          top: `${row * tileMap.tileSize}px`,
          width: `${tileMap.tileSize}px`,
          height: `${tileMap.tileSize}px`
        }
      });

      const brickSvg = VDOM.createElement('img', {
        src: tileMap.svgMap[tileMap.tileTypes.BRICK],
        style: {
          width: '100%',
          height: '100%'
        }
      });
      brickDiv.children.push(brickSvg);

      const powerupType = this.getNextPowerupType();
      const powerupClass = getPowerupClass(powerupType);
      const powerupDiv = VDOM.createElement('div', {
        class: `${powerupClass} hidden`,
        style: {
          position: 'absolute',
          left: '0',
          top: '0',
          width: '100%',
          height: '100%',
          zIndex: '1',
          display: 'none'
        }
      });
      const powerupSvg = VDOM.createElement('img', {
        src: `../assets/${powerupType}.svg`,
        style: {
          width: '100%',
          height: '100%'
        }
      });
      powerupDiv.children.push(powerupSvg);
      brickDiv.children.push(powerupDiv);

      return brickDiv;
    }

    if (tileType === tileMap.tileTypes.POWERUP) {
      const powerupType = this.getNextPowerupType();
      const powerupClass = getPowerupClass(powerupType);
      const powerupDiv = VDOM.createElement('div', {
        class: powerupClass,
        style: {
          position: 'absolute',
          left: '0',
          top: '0',
          width: '100%',
          height: '100%',
          zIndex: '1'
        }
      });
      const powerupSvg = VDOM.createElement('img', {
        src: `../assets/${powerupType}.svg`,
        style: {
          width: '100%',
          height: '100%'
        }
      });
      powerupDiv.children.push(powerupSvg);
      tileDiv.children.push(powerupDiv);
    }

    return tileDiv;
  }

  updateTile(tile, tileType, col, row) {
    const className = this.getTileClassName(tileType, col, row);
    const svgPath = tileMap.svgMap[tileType];

    tile.attrs.class = className;
    tile.attrs.style.left = `${col * tileMap.tileSize}px`;
    tile.attrs.style.top = `${row * tileMap.tileSize}px`;
    tile.attrs.style.width = `${tileMap.tileSize}px`;
    tile.attrs.style.height = `${tileMap.tileSize}px`;

    tile.children = [];

    if (svgPath) {
      const svgElement = VDOM.createElement('img', {
        src: svgPath,
        style: {
          width: '100%',
          height: '100%'
        }
      });
      tile.children.push(svgElement);
    }

    if (tileType === tileMap.tileTypes.POWERUP) {
      const powerupType = this.getNextPowerupType();
      const powerupClass = getPowerupClass(powerupType);
      const powerupDiv = VDOM.createElement('div', {
        class: powerupClass,
        style: {
          position: 'absolute',
          left: '0',
          top: '0',
          width: '100%',
          height: '100%',
          zIndex: '1'
        }
      });
      const powerupSvg = VDOM.createElement('img', {
        src: `../assets/${powerupType}.svg`,
        style: {
          width: '100%',
          height: '100%'
        }
      });
      powerupDiv.children.push(powerupSvg);
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
        return mapClass.BRITTLE_BRICK_CLASS;
      case tileMap.tileTypes.EMPTY:
        return mapClass.EMPTY_DIV_CLASS;
      case tileMap.tileTypes.POWERUP:
        return mapClass.POWERUP_CLASS;
      case tileMap.tileTypes.BRICK_WITH_POWERUP:
        return mapClass.BRITTLE_BRICK_CLASS;
      default:
        return '';
    }
  }

  getNextPowerupType() {
    const powerupType = this.powerupTypes[this.currentPowerupIndex];
    this.currentPowerupIndex =
      (this.currentPowerupIndex + 1) % this.powerupTypes.length;
    return powerupType;
  }

  onResize() {
    if (this.resizeTimeout) {
      cancelAnimationFrame(this.resizeTimeout);
    }
    this.resizeTimeout = requestAnimationFrame(() => this.renderMap());
  }

  attachEventListeners() {
    this.eventHandler.on(window, "resize", () => this.onResize());
  }

  initialize() {
    // tileMap.placeRandomBricks(tileMap.gameConfig.BRICK_COUNT);
    this.createDivs();
    this.renderMap();
  }
}

function getBricksWithPowerup() {
  return tileMap.bricksWithPowerup;
}

function getPowerupClass(powerupType) {
  switch (powerupType) {
    case "bomb":
      return mapClass.POWERUP_BOMB_CLASS;
    case "speed":
      return mapClass.POWERUP_SPEED_CLASS;
    case "flame":
      return mapClass.POWERUP_FLAME_CLASS;
    default:
      return mapClass.POWERUP_CLASS;
  }
}

function insertMap(objetOfPlayer) {
  const gameBody = document.querySelector(".gamebodyleftpart");
  const eventHandler = new EventHandler();
  const gameRenderer = new GameRenderer(gameBody, eventHandler, objetOfPlayer);
  gameRenderer.initialize();
}

export { insertMap, getBricksWithPowerup, tileMap, mapClass };

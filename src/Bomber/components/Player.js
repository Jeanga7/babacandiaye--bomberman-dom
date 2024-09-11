import VDOM from "../../core/dom.mjs";
import { tileMap, mapClass } from "./maps.js";

const playerElements = {};
export const playerPositions = {};
const bombElements = [];
var boxplaced = {};
var powerUp = {};
var whichpowerup;
export const playerLives = {};
const actionThrottleTime = 100;
const lastActionTime = {};

function canPerformAction(playerName) {
  const now = Date.now();
  if (!lastActionTime[playerName]) {
    lastActionTime[playerName] = now;
    return true;
  }

  const elapsed = now - lastActionTime[playerName];
  if (elapsed >= actionThrottleTime) {
    lastActionTime[playerName] = now;
    return true;
  }

  return false;
}

export function updatePlayerAction(playerName, action, ix, iy) {
  console.log(`${playerName} action: ${action} ix ${ix} yi ${iy}`);
  // let playerElement = playerElements[playerName];

  // Initialize player states if not already set
  if (!boxplaced.hasOwnProperty(playerName)) boxplaced[playerName] = 1;
  if (!powerUp.hasOwnProperty(playerName)) powerUp[playerName] = false;
  if (!playerLives.hasOwnProperty(playerName)) playerLives[playerName] = 3;

  playerPositions[playerName] = playerPositions[playerName] || {
    row: ix,
    col: iy,
  };
  console.log("playerPositions", playerPositions);
  let { row, col } = playerPositions[playerName];
  let newRow = row;
  let newCol = col;

  if (whichpowerup == "bomb" && powerUp[playerName]) {
    boxplaced[playerName] = 2;
  }

  // Movement logic
  switch (action) {
    case "move_left":
      if (canPerformAction(playerName)) {
        newCol = Math.max(1, col - 1);
        CollisionPowerup(newRow, newCol, playerName);
        console.log("newRow", newRow, "newCol", newCol);
      } else {
        console.log(`${playerName} is moving too fast. Please wait.`);
      }
      break;

    case "move_right":
      if (canPerformAction(playerName)) {
        newCol = Math.min(tileMap.columns - 2, col + 1);
        CollisionPowerup(newRow, newCol, playerName);
      } else {
        console.log(`${playerName} is moving too fast. Please wait.`);
      }
      break;

    case "move_up":
      if (canPerformAction(playerName)) {
        newRow = Math.max(1, row - 1);
        CollisionPowerup(newRow, newCol, playerName);
      } else {
        console.log(`${playerName} is moving too fast. Please wait.`);
      }
      break;

    case "move_down":
      if (canPerformAction(playerName)) {
        newRow = Math.min(tileMap.rows - 2, row + 1);
        CollisionPowerup(newRow, newCol, playerName);
      } else {
        console.log(`${playerName} is moving too fast. Please wait.`);
      }
      break;

    case "place_bomb":
      if (canPerformAction(playerName)) {
        if (boxplaced[playerName] !== 0) {
          if (boxplaced[playerName] === 1) {
            boxplaced[playerName]--;
            placeBomb(row, col, playerName);
            setTimeout(() => (boxplaced[playerName] = 1), 3000);
          } else {
            boxplaced[playerName]--;
            placeBomb(row, col, playerName);
            powerUp[playerName] = false;
          }
        } else {
          console.log(`${playerName} already placed a bomb.`);
        }
      } else {
        console.log(`${playerName} is placing bombs too fast. Please wait.`);
      }
      break;

    default:
      break;
  }

  // Update player position if valid
  if (canMoveTo(newRow, newCol)) {
    playerPositions[playerName] = { row: newRow, col: newCol };

    // Update player element's position
    const playerElement = document.getElementById(`player-${playerName}`);
    if (playerElement) {
      playerElement.style.left = `${newCol * tileMap.tileSize}px`;
      playerElement.style.top = `${newRow * tileMap.tileSize}px`;
    }
  }
}

function canMoveTo(row, col) {
  return (
    tileMap.getTile(col, row) === tileMap.tileTypes.EMPTY ||
    tileMap.getTile(col, row) === tileMap.tileTypes.POWERUP
  );
}
// function collision with the powerup
function CollisionPowerup(row, col, playername) {
  const tileType = tileMap.getTile(col, row);
  console.log("Checking collision at", row, col, "Tile type:", tileType);

  if (tileType === tileMap.tileTypes.POWERUP) {
    const tileDiv = document.getElementById(`${mapClass.POWERUP_CLASS}-${row}-${col}`);
    if (tileDiv) {
      const powerupDiv = tileDiv.querySelector(`:scope > div[class^="powerup-"]:not(.hidden)`);
      if (powerupDiv && !powerUp[playername]) {
        console.log("Collision with a powerup");
        powerUp[playername] = true;
        whichpowerup = powerupDiv.className.split("-")[1];
        console.log("Powerup type:", whichpowerup);
        removePowerUp(row, col);
      }
    }
  }
}

function placeBomb(row, col, playername) {
  const bombElement = VDOM.createElement("div", {
    class: "bomb",
    style: {
      position: "absolute",
      left: `${col * tileMap.tileSize}px`,
      top: `${row * tileMap.tileSize}px`,
      width: `${tileMap.tileSize}px`,
      height: `${tileMap.tileSize}px`,
    },
  });
  document.getElementById("mapDiv").appendChild(bombElement.render());
  bombElements.push(bombElement);
  setTimeout(() => {
    var b = document.querySelector(".bomb");
    if (b) {
      document.getElementById("mapDiv").removeChild(b);
    }
    destroyBrick(row, col, playername);
  }, 3000);
}

export function removePlayer(playerName) {
  const playerElement = document.getElementById(`player-${playerName}`);
  var map = document.getElementById("mapDiv");
  map.removeChild(playerElement);
  alert("GameOver");
  // const playerVDOM = playerElements[playerName];
  // if (playerVDOM) {
  //     const playerElement = playerVDOM.render();
  //     // Vous pouvez ajouter ici la logique pour retirer visuellement le joueur
  //     playerElement.style.display = 'none';
  //     delete playerElements[playerName];
  //     delete playerPositions[playerName];
  // }
}

function destroyBrick(row, col, playername) {
  const directions = [
    { rowOffset: -1, colOffset: 0 }, // Up
    { rowOffset: 1, colOffset: 0 },  // Down
    { rowOffset: 0, colOffset: -1 }, // Left
    { rowOffset: 0, colOffset: 1 },  // Right
  ];

  // Destroy the brick at the center of the explosion
  destroySingleBrick(row, col);

  // Destroy adjacent bricks
  directions.forEach(direction => {
    const newRow = row + direction.rowOffset;
    const newCol = col + direction.colOffset;

    if (newRow >= 0 && newRow < tileMap.rows && newCol >= 0 && newCol < tileMap.columns) {
      destroySingleBrick(newRow, newCol);
    }
  });

  // Check collisions with players
  for (const playerName in playerPositions) {
    const playerRow = playerPositions[playerName].row;
    const playerCol = playerPositions[playerName].col;

    if ((playerRow === row && (playerCol === col || playerCol === col - 1 || playerCol === col + 1)) ||
      (playerCol === col && (playerRow === row - 1 || playerRow === row + 1))) {
      playerLives[playerName] -= 1;
      console.log(`${playerName} a été touché, il lui reste ${playerLives[playerName]} vies`);

      if (playerLives[playerName] <= 0) {
        removePlayer(playerName);
      }
    }
  }
}

function destroySingleBrick(brickRow, brickCol) {
  const tileType = tileMap.getTile(brickCol, brickRow);
  const tileDiv = document.getElementById(`${mapClass.BRITTLE_BRICK_CLASS}-${brickRow}-${brickCol}`);

  if (tileType === tileMap.tileTypes.BRICK_WITH_POWERUP) {
    tileMap.map[brickRow][brickCol] = tileMap.tileTypes.POWERUP;

    // Remove the brick image
    const brickImage = tileDiv.querySelector(`img[src="${tileMap.svgMap[tileMap.tileTypes.BRICK]}"]`);
    if (brickImage) brickImage.remove();

    // Show the powerup
    const powerupDiv = tileDiv.querySelector('.hidden');
    if (powerupDiv) {
      powerupDiv.classList.remove('hidden');
      powerupDiv.style.display = 'block';
    }

    // Change the class and ID of the tileDiv
    tileDiv.className = mapClass.POWERUP_CLASS;
    tileDiv.id = `${mapClass.POWERUP_CLASS}-${brickRow}-${brickCol}`;

    // Remove this brick from the list of bricks with powerup
    tileMap.bricksWithPowerup = tileMap.bricksWithPowerup.filter(brick => brick.row !== brickRow || brick.col !== brickCol);
  } else if (tileType === tileMap.tileTypes.BRICK) {
    tileMap.map[brickRow][brickCol] = tileMap.tileTypes.EMPTY;
    if (tileDiv) tileDiv.remove();
  }
}

function removePowerUp(row, col) {
  const tileType = tileMap.getTile(col, row);
  if (tileType !== tileMap.tileTypes.POWERUP) {
    console.log("There is no power-up at this position.");
    return;
  }
  tileMap.map[row][col] = tileMap.tileTypes.EMPTY;
  const tileDiv = document.getElementById(`${mapClass.POWERUP_CLASS}-${row}-${col}`);
  if (tileDiv) {
    tileDiv.remove();
  } else {
    console.log("Unable to find the div corresponding to the power-up.");
  }
}
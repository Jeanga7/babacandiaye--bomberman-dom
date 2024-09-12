import VDOM from "../../core/dom.mjs";
import { ws } from "../globals.js";
import { gameover } from "./endgame.js";
import { tileMap, mapClass } from "./maps.js";
import { CurrentJoueur } from "./PlayerForm.js";

const playerElements = {};
export const playerPositions = {};
const bombElements = [];
var boxplaced = {};
var powerUp = {};
var whichpowerup;
var speed;
var lastmove = {};
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
  // Initialize player states if not already set
  if (!boxplaced.hasOwnProperty(playerName)) boxplaced[playerName] = 1;
  if (!powerUp.hasOwnProperty(playerName)) powerUp[playerName] = false;
  if (!playerLives.hasOwnProperty(playerName)) playerLives[playerName] = 3;

  playerPositions[playerName] = playerPositions[playerName] || {
    row: ix,
    col: iy,
  };
  let { row, col } = playerPositions[playerName];
  let newRow = row;
  let newCol = col;

  if (whichpowerup == "bomb" && powerUp[playerName]) {
    boxplaced[playerName] = 2;
  }

  if (whichpowerup === "speed") {
    speed = 2;
    setTimeout(() => {
      powerUp[playerName] = false;
      SelectCurrentPowerupImage(whichpowerup, "inactive");
      whichpowerup = "";
      speed = 1;
    }, 5000);
  } else {
    speed = 1;
  }
  
  switch (action) {
    case "move_left":
      if (canPerformAction(playerName)) {
        newCol = Math.max(1, col - speed);
        CollisionPowerup(newRow, newCol, playerName);
        lastmove = "L"
        console.log("newRow", newRow, "newCol", newCol);
      } else {
        console.log(`${playerName} is moving too fast. Please wait.`);
      }
      break;

    case "move_right":
      if (canPerformAction(playerName)) {
        newCol = Math.min(tileMap.columns - 2, col + speed);
        CollisionPowerup(newRow, newCol, playerName);
        lastmove = "R"
      } else {
        console.log(`${playerName} is moving too fast. Please wait.`);
      }
      break;

    case "move_up":
      if (canPerformAction(playerName)) {
        newRow = Math.max(1, row - speed);
        CollisionPowerup(newRow, newCol, playerName);
        lastmove = "U"
      } else {
        console.log(`${playerName} is moving too fast. Please wait.`);
      }
      break;

    case "move_down":
      if (canPerformAction(playerName)) {
        newRow = Math.min(tileMap.rows - 2, row + speed);
        CollisionPowerup(newRow, newCol, playerName);
        lastmove = "D"
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
            SelectCurrentPowerupImage(whichpowerup, "inactive");
          }
        } else {
          console.log(`${playerName} already placed a bomb.`);
        }
      } else {
        console.log(`${playerName} is placing bombs too fast. Please wait.`);
      }
      break;

    default:
      return;
  }

  if (speed === 1) {
    if (canMoveTo(newRow, newCol)) {
      playerPositions[playerName] = { row: newRow, col: newCol };

      const playerElement = document.getElementById(`player-${playerName}`);
      if (playerElement) {
        playerElement.style.left = `${newCol * tileMap.tileSize}px`;
        playerElement.style.top = `${newRow * tileMap.tileSize}px`;
      }
    }
  } else if (speed === 2) {
    // const newRowBy2 = row + (newRow > row ? 2 : -2); 
    // const newColBy2 = col + (newCol > col ? 2 : -2);  
    console.log("c'ant move by 2");
    var tempcol, temprow

    if (lastmove == 'D') {
      temprow = newRow - 1
      tempcol = newCol
    } else if (lastmove == "U") {
      temprow = newRow + 1
      tempcol = newCol
    } else if (lastmove == "L") {
      tempcol = newCol + 1
      temprow = newRow
    } else if (lastmove == "R") {
      tempcol = newCol - 1
      temprow = newRow
    }

    console.log("xxxxx", tempcol, temprow);


    if (canMoveTo(newRow, newCol) && canMoveTo(temprow, tempcol)) {
      console.log("2");

      playerPositions[playerName] = { row: newRow, col: newCol };

      const playerElement = document.getElementById(`player-${playerName}`);
      if (playerElement) {
        playerElement.style.left = `${newCol * tileMap.tileSize}px`;
        playerElement.style.top = `${newRow * tileMap.tileSize}px`;
      }
    } else if (canMoveTo(temprow, tempcol)) {
      console.log("1");

      playerPositions[playerName] = { row: temprow, col: tempcol };

      const playerElement = document.getElementById(`player-${playerName}`);
      if (playerElement) {
        playerElement.style.left = `${(tempcol) * tileMap.tileSize}px`;
        playerElement.style.top = `${(temprow) * tileMap.tileSize}px`;
      }

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
        SelectCurrentPowerupImage(whichpowerup, "active");
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

  const bombImageElement = VDOM.createElement("img", {
    src: "../assets/bomb-assets.svg", 
    style: {
      width: "100%",
      height: "100%",
    },
  });

  // First, render bombElement and bombImageElement if necessary
  const renderedBombElement = bombElement.render();
  const renderedBombImageElement = bombImageElement.render();

  // Append the image element to the bomb div
  renderedBombElement.appendChild(renderedBombImageElement);

  // Append the bomb element to the mapDiv
  document.getElementById("mapDiv").appendChild(renderedBombElement);

  bombElements.push(renderedBombElement);

  // Remove the bomb after 3 seconds and trigger brick destruction
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
  const map = document.getElementById("mapDiv");

  if (playerElement) {
    map.removeChild(playerElement);
    document.body.innerHTML = ""
    document.body.appendChild(gameover.render())
    delete playerElements[playerName];
    delete playerPositions[playerName];
    delete playerLives[playerName];

    const message = {
      type: 'playerDefeated',
      name: playerName,
    };

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket connection is not open.');
    }
  } else {
    console.warn(`Player element with name ${playerName} not found.`);
  }
}

function destroyBrick(row, col, playername) {
  var directions = {};
  if (powerUp[playername] && whichpowerup == "flame") {
    directions = [
      { rowOffset: -2, colOffset: 0 }, // Up
      { rowOffset: 2, colOffset: 0 },  // Down
      { rowOffset: 0, colOffset: -2 }, // Left
      { rowOffset: 0, colOffset: 2 },  // Right
    ];

  } else {
    directions = [
      { rowOffset: -1, colOffset: 0 }, // Up
      { rowOffset: 1, colOffset: 0 },  // Down
      { rowOffset: 0, colOffset: -1 }, // Left
      { rowOffset: 0, colOffset: 1 },  // Right
    ];
  }

  // Destroy the brick at the center of the explosion
  destroySingleBrick(row, col);

  // Destroy adjacent bricks
  directions.forEach(direction => {
    const newRow = row + direction.rowOffset;
    const newCol = col + direction.colOffset;

    if (newRow >= 0 && newRow < tileMap.rows && newCol >= 0 && newCol < tileMap.columns) {
      destroySingleBrick(newRow, newCol);
    }

    if (Math.abs(direction.rowOffset) === 2 || Math.abs(direction.colOffset) === 2) {
      // Check for adjacent tiles in the extended direction
      for (let offset = 1; offset <= 2; offset++) {
        const extendedRow = row + (direction.rowOffset / 2) * offset;
        const extendedCol = col + (direction.colOffset / 2) * offset;


        // Ensure the extended coordinates are within map boundaries
        if (extendedRow >= 0 && extendedRow < tileMap.map.length && extendedCol >= 0 && extendedCol < tileMap.map[0].length) {
          const extendedTileType = tileMap.getTile(extendedCol, extendedRow);
          console.log("this is extendedtiletype", extendedTileType);

          if (extendedTileType === tileMap.tileTypes.BRICK) {
            tileMap.map[extendedRow][extendedCol] = tileMap.tileTypes.EMPTY;
            const extendedTileDiv = document.getElementById(`${mapClass.BRITTLE_BRICK_CLASS}-${extendedRow}-${extendedCol}`);
            if (extendedTileDiv) {
              extendedTileDiv.remove();
            }

          } else if (extendedTileType === tileMap.tileTypes.WALL) {
            break;
            break; // Exit the inner loop, continue with the next direction
          }
        }
      }
      powerUp[playername] = false;
      SelectCurrentPowerupImage(whichpowerup, "inactive");
    }
  });

  // Check collisions with players
  for (const playerName in playerPositions) {
    const playerRow = playerPositions[playerName].row;
    const playerCol = playerPositions[playerName].col;

    if ((playerRow === row && (playerCol === col || playerCol === col - 1 || playerCol === col + 1)) ||
      (playerCol === col && (playerRow === row - 1 || playerRow === row + 1))) {
      playerLives[playerName] -= 1;
      retriveLive(playerName, playerLives[playerName]);
      console.log(`${playerName} a été touché, il lui reste ${playerLives[playerName]} vies`);
      if (playerLives[playerName] <= 0 && playerName == CurrentJoueur) {
        removePlayer(playerName);
      }
    }
  }
}

function retriveLive(playerName, life) {
  // Select the correct life counter container based on the player's name
  const lifecounterContainer = document.querySelector(`.lifecounter-${playerName}`);

  if (lifecounterContainer) {
    // Assuming the hearts are inside a deeper div, adjust to target the actual container holding the hearts
    const heartsContainer = lifecounterContainer.querySelector('.lifecounter');

    if (heartsContainer) {
      const hearts = heartsContainer.querySelectorAll('img'); // Target heart images

      if (hearts.length > life) {
        const lastHeart = hearts[hearts.length - 1];

        if (lastHeart && heartsContainer.contains(lastHeart)) {
          console.log("lifecounter", heartsContainer, "lastHeart", lastHeart);

          heartsContainer.removeChild(lastHeart);  // Remove the heart from the container
        } else {
          console.warn('The heart to be removed is not a child of the hearts container.');
        }
      } else {
        console.warn(`Hearts count (${hearts.length}) does not exceed life (${life}). No heart to remove.`);
      }
    } else {
      console.warn('Hearts container not found within the lifecounter.');
    }
  } else {
    console.warn(`Life counter for player ${playerName} not found.`);
  }
}

export function createLifeCounter(playerName, life) {
  console.log('playerName', playerName, "life", life)
  const hearts = Array.from({ length: life }).map((_, index) =>
    VDOM.createElement('img', { class: `lifecounter-${playerName}-${index}`, src: '../assets/heart.svg', alt: 'heart life' })
  );
  return VDOM.createElement('div', { class: `gamerightpart lifecounter-${playerName}` },
    VDOM.createElement('div', { class: 'lifecounter' }, VDOM.createElement('p', { class: 'playerlife' },playerName),
      ...hearts
    ),
  );
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

function SelectCurrentPowerupImage(whichpowerup, state) {
  // console.log("PLAYER", playerName);

  if (state === "active") {
    addActivePowerupImage(whichpowerup);
  } else {
    delActivePowerupImage(whichpowerup);
  }
}

function addActivePowerupImage(whichpowerup) {
  const powerupElement = document.querySelector(`#${whichpowerup} img`);
  if (powerupElement) {
    powerupElement.src = `../assets/selectpower${whichpowerup}.svg`;
  }
}

function delActivePowerupImage(whichpowerup) {
  const powerupElement = document.querySelector(`#${whichpowerup} img`);
  if (powerupElement) {
    powerupElement.src = `../assets/${whichpowerup}.svg`;
  }
}
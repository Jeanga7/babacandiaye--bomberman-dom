import VDOM from '../../core/dom.mjs';
import { mapWidth, tileMap } from '../maps.js';

const playerElements = {};
const playerPositions = {};
const bombElements = [];
var boxplaced = {}

export function updatePlayerAction(playerName, action) {
    console.log(`${playerName} action: ${action}`);
    let playerElement = playerElements[playerName];
    if (!boxplaced.hasOwnProperty(playerName)) {
        boxplaced[playerName] = false;
    }
    var map = document.getElementById('mapDiv')
    if (!playerElement) {
        playerElement = VDOM.createElement('div', {
            class: 'player',
            id: `player-${playerName}`,
            style: {
                position: 'absolute',
                left: '45px',  // Start at the first empty cell (1,1)
                top: '45px'
            }
        });
        document.getElementById('mapDiv').appendChild(playerElement.render());
        playerElements[playerName] = playerElement;
        playerPositions[playerName] = { row: 1, col: 1 };
    }

    let { row, col } = playerPositions[playerName];
    let newRow = row;
    let newCol = col;

    switch (action) {
        case 'move_left':
            newCol = Math.max(1, col - 1);
            break;
        case 'move_right':
            newCol = Math.min(tileMap.columns - 2, col + 1);
            break;
        case 'move_up':
            newRow = Math.max(1, row - 1);
            break;
        case 'move_down':
            newRow = Math.min(tileMap.rows - 2, row + 1);
            break;
        case 'place_bomb':
            if (!boxplaced[playerName]) {
                boxplaced[playerName] = true;
                placeBomb(row, col);
                setTimeout(() => {
                    boxplaced[playerName] = false;
                }, 4000);
            } else {
                console.log(`${playerName} a déjà placé une bombe.`);
            }
            break;
        default:
            break;
    }

    if (canMoveTo(newRow, newCol)) {
        playerPositions[playerName] = { row: newRow, col: newCol };

        const updatedPlayerElement = VDOM.createElement('div', {
            class: 'player',
            id: `player-${playerName}`,
            style: {
                position: 'absolute',
                left: `${newCol * tileMap.tileSize}px`,
                top: `${newRow * tileMap.tileSize}px`
            }
        });

        const oldElement = document.getElementById(`player-${playerName}`);
        oldElement.replaceWith(updatedPlayerElement.render());
        playerElements[playerName] = updatedPlayerElement;
    }
}

function canMoveTo(row, col) {
    return tileMap.getTile(col, row) === tileMap.tileTypes.EMPTY;
}

function placeBomb(row, col) {
    const bombElement = VDOM.createElement('div', {
        class: 'bomb',
        style: {
            position: 'absolute',
            left: `${col * tileMap.tileSize}px`,
            top: `${row * tileMap.tileSize}px`,
            width: `${tileMap.tileSize}px`,
            height: `${tileMap.tileSize}px`
        }
    });
    document.getElementById('mapDiv').appendChild(bombElement.render());
    bombElements.push(bombElement)
    setTimeout(() => {
        var b = document.querySelector(".bomb");
        if (b) {
            document.getElementById('mapDiv').removeChild(b);
        }
    }, 4000)
}

export function removePlayer(playerName) {
    const playerVDOM = playerElements[playerName];
    if (playerVDOM) {
        const playerElement = playerVDOM.render();
        // Vous pouvez ajouter ici la logique pour retirer visuellement le joueur
        playerElement.style.display = 'none';
        delete playerElements[playerName];
        delete playerPositions[playerName];
    }
}

// Ces fonctions ne sont plus nécessaires avec la nouvelle logique de déplacement
// mais je les laisse commentées au cas où vous en auriez besoin ailleurs
/*
function getObstacles() {
    const tiles = document.querySelectorAll('.pillar-border');
    const obstacles = [];
    tiles.forEach(tile => {
        const rect = tile.getBoundingClientRect();
        obstacles.push({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        });
    });
    return obstacles;
}

function isCollidingWithObstacle(playerX, playerY) {
    const obstacles = getObstacles();
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        if (
            playerX < obstacle.x + obstacle.width &&
            playerX + 32 > obstacle.x &&
            playerY < obstacle.y + obstacle.height &&
            playerY + 32 > obstacle.y
        ) {
            return true;
        }
    }
    return false;
}
*/
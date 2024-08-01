import VDOM from '../../core/dom.mjs';
import { mapWidth } from '../maps.js';
const playerElements = {};
const playerPositions = {};
const bombElements = [];
var boxplaced = {}

export function updatePlayerAction(playerName, action) {
    console.log(`${playerName} action: ${action}`);
    let playerElement = playerElements[playerName];
    if (!boxplaced.hasOwnProperty(playerName)) {
        boxplaced[playerName] = false; // Initialisez si le joueur n'a pas encore d'entrée
    }
    var map = document.getElementById('mapDiv')
    if (!playerElement) {
        playerElement = VDOM.createElement('div', {
            class: 'player',
            id: `player-${playerName}`,
            style: {
                position: 'relative',
                left: '0%',
                top: '0%'
            }
        });
        document.getElementById('mapDiv').appendChild(playerElement.render());
        playerElements[playerName] = playerElement;
        playerPositions[playerName] = { x: 0, y: 0 };
    }

    var obstacles = getObstacles()
    console.log(obstacles);

    const player_stats = document.querySelector(".player")
    const mapRect = map.getBoundingClientRect()
    const playerRect = player_stats.getBoundingClientRect()
    const Playerleft = playerRect.x
    const PlayerRight = Playerleft + playerRect.width
    const Playertop = playerRect.top
    const Playerbottom = playerRect.bottom


    // Switch case for handling player actions
    switch (action) {
        case 'move_left':
            let newXLeft = playerPositions[playerName].x - 1;
            if (Playerleft - 10 > mapRect.left + mapWidth && !isCollidingWithObstacle(newXLeft, playerPositions[playerName].y)) {
                console.log("mapwidth", mapWidth);
                console.log("maprectleft", mapRect.left);
                playerPositions[playerName].x = newXLeft;
            }
            break;
        case 'move_right':
            let newXRight = playerPositions[playerName].x + 1;
            console.log("thisisim", newXRight);
            if (PlayerRight + 10 < mapRect.right - mapWidth && !isCollidingWithObstacle(newXRight, playerPositions[playerName].y)) {
                console.log("mapwidth", mapWidth);
                console.log("maprectright", mapRect.right);
                playerPositions[playerName].x = newXRight;
            }
            break;
        case 'move_up':
            let newYUp = playerPositions[playerName].y - 1;
            if (Playertop - 5 > mapRect.top + mapWidth && !isCollidingWithObstacle(playerPositions[playerName].x, newYUp)) {
                playerPositions[playerName].y = newYUp;
            }
            break;
        case 'move_down':
            let newYDown = playerPositions[playerName].y + 1;
            if (Playerbottom + 7 < mapRect.bottom - mapWidth && !isCollidingWithObstacle(playerPositions[playerName].x, newYDown)) {
                playerPositions[playerName].y = newYDown;
            }
            break;
        case 'place_bomb':
            if (!boxplaced[playerName]) { // Vérifier si le joueur n'a pas encore placé une bombe
                boxplaced[playerName] = true;
                placeBomb(playerPositions[playerName]);
                setTimeout(() => {
                    boxplaced[playerName] = false; // Réinitialiser après 4 secondes
                }, 4000);
            } else {
                console.log(`${playerName} a déjà placé une bombe.`);
            }
            break;
        default:
            break;
    }

    const updatedPlayerElement = VDOM.createElement('div', {
        class: 'player',
        id: `player-${playerName}`,
        style: {
            position: 'absolute',
            left: `${playerPositions[playerName].x}%`,
            top: `${playerPositions[playerName].y}%`
        }
    });

    const oldElement = document.getElementById(`player-${playerName}`);
    oldElement.replaceWith(updatedPlayerElement.render());
    playerElements[playerName] = updatedPlayerElement;
}

function placeBomb(position) {
    const bombElement = VDOM.createElement('div', {
        class: 'bomb',
        style: {
            left: `${position.x + 0.7}%`,
            top: `${position.y + 0.7}%`
        }
    }
    );
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

        // UnmountComponent('#game-content', playerElement);
        // display none le player 

        delete playerElements[playerName];
        delete playerPositions[playerName];
    }
}

// Function to get obstacle positions and sizes from 'tile' div elements
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

// Function to check collision between the player and obstacles
function isCollidingWithObstacle(playerX, playerY) {
    const obstacles = getObstacles(); // Get current obstacle data
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        console.log(`Checking collision with obstacle ${i}: `, obstacle);
        console.log("playerX", playerX);
        console.log("playerY", playerY);
        if (
            playerX < obstacle.x + obstacle.width &&
            playerX + 32 > obstacle.x &&
            playerY < obstacle.y + obstacle.height &&
            playerY + 32 > obstacle.y
        ) {
            console.log('Collision detected');
            return true; // Collision detected
        }
    }
    console.log('No collision detected');
    return false; // No collision
}
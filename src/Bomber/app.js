import { insertMap, destroyBrick, getBricksWithPowerup } from './maps.js';
import { createChat, displayMessage } from './components/Chat.js';
import { createCountdown } from './components/waitingRoom.js';
import { updatePlayerAction } from './components/Player.js';
import { playerName } from './components/PlayerForm.js';
import { createGame } from './components/GameBoard.js';
import { removePlayer } from './components/Player.js';
import { HomeComponent } from './components/Home.js';

export let seconds
export let playerCount
export const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
    console.log('WebSocket connection established');
    MountComponent('#app', HomeComponent)
};

ws.onmessage = (event) => {
    console.log('Received message:', event.data);
    const data = JSON.parse(event.data);

    if (data.type === 'message') {
        displayMessage(`${data.name}: ${data.content}`, data.name === playerName);
    } else if (data.type === 'action') {
        updatePlayerAction(data.name, data.action);
    } else if (data.type === 'playerJoined') {
        showGameNotStarting(data.seconds, data.playerCount);
        displayMessage(`${data.name} has joined the game.\n`, false);
        seconds = data.seconds
        playerCount = data.playerCount
    } else if (data.type === 'playerDisconnected') {
        displayMessage(`${data.name} has left the game.\n`, false);
        removePlayer(data.name);
    }
};

// export function startGame() {
//     MountComponent('#app', createGame, createChat);
//     insertMap()
// }

export function startGame() {
    MountComponent('#app', createGame, createChat);
    insertMap();
    
    // Ajout de l'event listener pour le test
    document.addEventListener('keydown', (event) => {
        if (event.key === 'v') {
            const bricksWithPowerup = getBricksWithPowerup();
            if (bricksWithPowerup.length > 0) {
                const randomIndex = Math.floor(Math.random() * bricksWithPowerup.length);
                const { row, col } = bricksWithPowerup[randomIndex];
                destroyBrick(row, col);
                console.log(`Brick with powerup destroyed at row ${row}, col ${col}`);
            } else {
                console.log('No more bricks with powerup to destroy');
            }
        }
    });
}

export function showGameNotStarting(seconds, playerCount) {
    MountComponent('#app', createGame, createChat);
    MountComponent('#maps', createCountdown(seconds, playerCount));
}

export function MountComponent(target, ...components) {
    const container = document.querySelector(target);
    if (!container) {
        console.error(`Target container '${target}' not found.`);
        return;
    }

    container.innerHTML = '';

    components.forEach(component => {
        let element;
        if (typeof component === 'function') {
            element = component().render();
        } else if (typeof component === 'string') {
            element = document.getElementById(component);
        } else if (component instanceof HTMLElement) {
            element = component;
        } else if (component && typeof component.render === 'function') {
            element = component.render();
        } else {
            console.error('Invalid component, ID, or element:', component);
            return;
        }

        if (element) {
            container.appendChild(element);
        }
    });
}

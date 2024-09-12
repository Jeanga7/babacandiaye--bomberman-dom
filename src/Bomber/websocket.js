import { createChat, displayMessage } from './components/Chat.js';
import { updatePlayerAction } from './components/Player.js';
import { waitingRoom } from './components/waitingRoom.js';
import { startGame, startPreparation } from './game.js';
import { createCountdown, requestFullScreen } from './utils.js';
import VDOM from '../core/dom.mjs';
import { ws } from './globals.js';
import { allpos } from './components/maps.js';
import { keydownHandler } from './components/PlayerForm.js';

export let seconds;
export let playerCount;
export let objetOfPlayer = [];

export function setupWebSocket() {
  ws.onopen = () => {
    console.log('WebSocket connection established');
  };

  ws.onerror = () => console.log('WebSocket error');

  ws.onmessage = (event) => {
    console.log("Received message:", event.data);
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  };
}

function handleWebSocketMessage(data) {
  console.log("datatype", data);

  switch (data.type) {
    case 'pseudoUsed':
      HandlePseudo();
      break
    case 'message':
      displayMessage(data.name, data.content);
      break;
    case 'action':
      handlePlayerAction(data);
      break;
    case 'playerJoined':
      handlePlayerJoined(data);
      break;
    case 'playerDisconnected':
      handlePlayerDisconnected(data);
      break;
    case 'startPreparation':
      startPreparation();
      break;
    case 'gameStarted':
      alert(data.content);
      ws.close();
      break;
    case 'gameEnded':
      alert(data.content);
      ws.close();
      window.location.reload();
      break;
    case 'updateLives':
      if (data.name === getPlayerName()) {
        playerLives = data.lives;
        updateLivesDisplay(playerLives);
        if (playerLives === 0) {
          alert("Vous avez perdu toutes vos vies !");
        }
      } else {
        updateOtherPlayerLives(data.name, data.lives);
      }
      break;
    case 'playerEliminated':
      if (message.name === getPlayerName()) {
        alert("Vous êtes éliminé !");
      }
      break;
    case 'error':
      console.warn(data.content);
      window.location.reload();
      break;
    default:
      console.error('Unknown WebSocket message type:', data.type);
  }
}

function HandlePseudo() {
  let errorName = VDOM.createElement("div", { id: "errorName", style: "color:red;margin-top:10px;font-size:x-large;" }, "this pseudo is already used, please change it");

  if (!document.getElementById("errorName")) {
    VDOM.appendChildToElementById("app", errorName);
    setTimeout(() => (
      document.getElementById("errorName").remove()
    ), 2000);
  }
  document.addEventListener("keydown", keydownHandler);
}

function handlePlayerAction(data) {
  console.log("Received player action:", data);
  const playerPosition = allpos[data.name];
  updatePlayerAction(data.name, data.action, playerPosition.x, playerPosition.y);
}

function handlePlayerJoined(data) {
  seconds = data.seconds;
  playerCount = data.playerCount;
  objetOfPlayer = data.playerOrder;

  requestFullScreen();
  waitingRoom(playerCount);

  if (playerCount >= 2) {
    const timer = document.getElementById("timer");
    createCountdown(seconds, timer, "searching for other players...");
  }

  if (!document.querySelector(".gamemessage")) {
    VDOM.appendChildToElementById("part3", createChat());
  }
}

function handlePlayerDisconnected(data) {
  seconds = data.seconds;
  playerCount = data.playerCount;
  objetOfPlayer = data.playerOrder;

  waitingRoom(playerCount);
  displayMessage(`${data.name} has left the game.`, false);
}

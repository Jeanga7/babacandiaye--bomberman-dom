import { setupWebSocket } from './websocket.js';
import { initGame } from './initGame.js';

export const tabImageOfPlayer = [
  "../assets/player1.svg",
  "../assets/player2.svg",
  "../assets/player3.svg",
  "../assets/player4.svg"
];

setupWebSocket();
initGame();

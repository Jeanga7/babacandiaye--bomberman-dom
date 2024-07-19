import { createForm } from "./components/PlayerForm.js";
import { createChat, appendMessage } from "./components/Chat.js";
import { player } from "./components/index.js";
const ws = new WebSocket("ws://localhost:8080");

// ws.onopen = () => {
//     console.log('WebSocket connection established');
// };
const app = document.querySelector("#app");

const player1 = new player.Player();
ws.onmessage = (event) => {
  console.log("Received message:", event.data);
  const data = JSON.parse(event.data);
  switch (data.type) {
    case "message":
      appendMessage(`${data.name}: ${data.content}`);
      break;
    case "join":
      appendMessage(`${data.name} has joined the game.\n`);
      break;
    case "playerDisconnected":
      appendMessage(`${data.name} has left the game.\n`);
      break;
  }
};

app.appendChild(createForm().render());
app.appendChild(createChat().render());
// app.appendChild(player1.createPlayer());

document.addEventListener("keydown", (e) => {
  switch (e.key.toLowerCase()) {
    case "arrowleft":
      player1.moveLeft();
      break;
    case "arrowright":
      player1.moveRight();
      break;
    case "arrowup":
      player1.moveUp();
      break;
    case "arrowdown":
      player1.moveDown();
      break;
  }
});

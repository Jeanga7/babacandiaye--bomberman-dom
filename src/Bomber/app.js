import { createForm } from "./components/PlayerForm.js";
import { createChat, appendMessage } from "./components/Chat.js";
import { player } from "./components/index.js";
import { VDOM } from "./components/index.js";
const ws = new WebSocket("ws://localhost:8080");

// ws.onopen = () => {
//     console.log('WebSocket connection established');
// };
const app = document.querySelector("#app");

// creation on the div #map and his children #first_player
var map = VDOM.createElement("div", { id: "map", style: "border: solid 2px; width: 800px; height: 500px" },
)

app.appendChild(map.render())

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

const player_stats = document.querySelector(".player");
const mapx = document.querySelector("#map");

document.addEventListener("keydown", (e) => {
  const mapRect = mapx.getBoundingClientRect();
  const playerRect = player_stats.getBoundingClientRect();
  const Playerleft = playerRect.x
  const PlayerRight = Playerleft + playerRect.width
  const Playertop = playerRect.top
  const Playerbottom = playerRect.bottom

  switch (e.key.toLowerCase()) {
    case "arrowleft":
      if (Playerleft - 10 > mapRect.left) {
        player1.moveLeft();
      }
      break;
    case "arrowright":
      if (PlayerRight + 20 < mapRect.right) {
        player1.moveRight();
      }
      break;
    case "arrowup":
      if (Playertop - 10 > mapRect.top) {
        player1.moveUp();
      }
      break;
    case "arrowdown":
      if (Playerbottom + 15 < mapRect.bottom) {
        player1.moveDown();
      }
      break;
  }
});

import VDOM from "../core/dom.mjs";
import { createGame } from "./components/GameBoard.js";
import { insertMap } from "./components/maps.js";
import { createLifeCounter, createPowerUpContainer } from "./UI.js";
import { createCountdown, MountComponent } from "./utils.js";


export function startGame(objetOfPlayer) {
  MountComponent('#app', createGame);
  VDOM.appendChildToElementById('part2', createPowerUpContainer());
  VDOM.appendChildToElementById('part1', createLifeCounter());
  insertMap(objetOfPlayer);
}

export function startPreparation() {
  const timer = document.getElementById("timer");
  createCountdown (10, timer, " seconds left before start");
}

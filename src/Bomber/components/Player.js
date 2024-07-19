import { VDOM } from "./index.js";

export class Player {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.life = 3;
    this.element = this.createPlayer();
    this.appendToDom()
  }

  createPlayer() {
    return VDOM.createElement("div", { class: "player" }).render();
  }

  appendToDom(){
    const container = document.getElementById('app');
    container.appendChild(this.element);
  }

  updatePosition() {
    this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
  }

  moveLeft() {
    this.x -= 50;
    this.updatePosition();
  }

  moveRight() {
    this.x += 50;
    this.updatePosition();
  }

  moveUp() {
    this.y -= 50;
    this.updatePosition();
  }

  moveDown() {
    this.y += 50;
    this.updatePosition();
  }

  retry() {
    this.life--;
    if (this.life <= 0) {
      this.death();
    }
  }

  death() {
    this.element.remove();
  }
}

import VDOM from '../core/dom.mjs';

export function createPowerUpContainer() {
  return VDOM.createElement('div', { class: 'gamepowerup' },
    VDOM.createElement('div', { class: 'power', id: 'bomb' },
      VDOM.createElement('img', { src: '../assets/bomb.svg', alt: '' })
    ),
    VDOM.createElement('div', { class: 'power', id: 'speed' },
      VDOM.createElement('img', { src: '../assets/speed.svg', alt: '' })
    ),
    VDOM.createElement('div', { class: 'power', id: 'flame' },
      VDOM.createElement('img', { src: '../assets/flame.svg', alt: '' })
    ),
    VDOM.createElement('div', { class: 'power', id: 'special' },
      VDOM.createElement('img', { src: '../assets/power4.svg', alt: '' })
    )
  );
}

export function createLifeCounter() {
  return VDOM.createElement('div', { class: 'gamerightpart' },
    VDOM.createElement('div', { class: 'lifecounter' },
      VDOM.createElement('img', { src: '../assets/lifecounter.svg', alt: '' })
    ),
    VDOM.createElement('div', { class: 'gametimer' }, 'Time: 00:30')
  );
}

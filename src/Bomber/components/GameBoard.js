import VDOM from '../../core/dom.mjs';
import { playerName } from './PlayerForm.js';
import { ws } from '../globals.js';
import { MountComponent } from '../utils.js';

export function createGame() {
    document.addEventListener('keydown', handleKeyDown);
    return VDOM.createElement('div', { class: 'gamecenter' },
        VDOM.createElement('div', { class: 'gameheader' },
            VDOM.createElement('div', { class: 'gamelogo' },
                VDOM.createElement('img', { src: '../assets/logo.svg', alt: '' })
            ),
        ),
        VDOM.createElement('div', { class: 'gamebody' },
            VDOM.createElement('div', { class: 'gamebodyleftpart' }),
        )
    );
}

function handleLogout() {
    ws.send(JSON.stringify({ type: 'logout', name: playerName }));

    MountComponent('#app', HomeComponent);
    window.location.reload()

    ws.close();
}

function handleKeyDown(event) {
    const action = getActionFromKey(event.key);
    if (action) {
        ws.send(JSON.stringify({ type: 'action', name: playerName, action: action }));
    }
}

function getActionFromKey(key) {
    switch (key) {
        case 'ArrowLeft':
            return 'move_left';
        case 'ArrowRight':
            return 'move_right';
        case 'ArrowUp':
            return 'move_up';
        case 'ArrowDown':
            return 'move_down';
        case ' ':
            return 'place_bomb';
        default:
            return null;
    }
}

// const gameCenter = VDOM.createElement('div', { class: 'gamecenter' },
//     VDOM.createElement('div', { class: 'gameheader' },
//         VDOM.createElement('div', { class: 'gamelogo' },
//             VDOM.createElement('img', { src: 'assets/logo.svg', alt: '' })
//         ),
//         VDOM.createElement('div', { class: 'gamerightpart' },
//             VDOM.createElement('div', { class: 'lifecounter' },
//                 VDOM.createElement('img', { src: 'assets/lifecounter.svg', alt: '' })
//             ),
//             VDOM.createElement('div', { class: 'gametimer' }, 'Time: 00:30')
//         )
//     )
// )
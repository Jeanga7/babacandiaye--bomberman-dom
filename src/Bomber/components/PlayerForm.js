import VDOM from '../../core/dom.mjs';

const ws = new WebSocket('ws://localhost:8080/');
export let playerName = "";

export function createForm() {
    return VDOM.createElement('div', { id: 'form-container' },
        VDOM.createElement('form', { id: 'nameForm', onsubmit: handleSubmit },
            VDOM.createElement('label', { for: "playerName" }, 'Enter Your Name'),
            VDOM.createElement('input', { type: 'text', id: 'playerName', placeholder: 'Enter your name', required: true }),
            VDOM.createElement('button', { type: 'submit' }, 'Start Game')
        )
    );
}

function handleSubmit(event) {
    event.preventDefault();
    playerName = document.getElementById('playerName').value;
    if (playerName) {
        ws.send(JSON.stringify({ type: 'join', name: playerName }));

        document.getElementById('form-container').style.display = 'none';
        document.getElementById('chat-container').style.display = 'block';
    }
}

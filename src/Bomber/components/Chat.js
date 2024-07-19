import VDOM from '../../core/dom.mjs';

const ws = new WebSocket('ws://localhost:8080/');
import { playerName } from './PlayerForm.js';

export function createChat() {
    return VDOM.createElement('div', { id: 'chat-container', style: 'display: none;' },
        VDOM.createElement('div', { id: 'messages' }),
        VDOM.createElement('form', { id: 'chatForm', onsubmit: sendMessage },
            VDOM.createElement('input', { type: 'text', id: 'chatMessage', placeholder: 'Type your message...', required: true }),
            VDOM.createElement('button', { type: 'submit' }, 'Send')
        )
    );
}

function sendMessage(event) {
    event.preventDefault();
    const message = document.getElementById('chatMessage').value;
    if (message) {
        console.log('Chat Sending message:', message);
        ws.send(JSON.stringify({ type: 'message', name: playerName, content: message }));
        document.getElementById('chatMessage').value = '';
    }
}

export function appendMessage(message) {
    console.log('message to append', message);
    const messagesContainer = document.getElementById('messages');
    const messageElement = VDOM.createElement('p', {}, message);
    messagesContainer.appendChild(messageElement.render());
}

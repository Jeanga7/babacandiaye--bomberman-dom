import { createForm } from './components/PlayerForm.js';
import { createChat, appendMessage } from './components/Chat.js';

const ws = new WebSocket('ws://localhost:8080');

// ws.onopen = () => {
//     console.log('WebSocket connection established');
// };

ws.onmessage = (event) => {
    console.log('Received message:', event.data);
    const data = JSON.parse(event.data);
    if (data.type === 'message') {
        appendMessage(`${data.name}: ${data.content}`);
    } else if (data.type === 'join') {
        appendMessage(`${data.name} has joined the game.\n`);
    } else if (data.type === 'playerDisconnected') {
        appendMessage(`${data.name} has left the game.\n`);
    }
};



const app = document.querySelector('#app');
app.appendChild(createForm().render());
app.appendChild(createChat().render());
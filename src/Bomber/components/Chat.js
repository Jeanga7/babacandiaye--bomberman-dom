export function createChat() {
    const chatContainer = VDOM.createElement('div', { id: 'chat-container', style: 'display: none;' }, [
        VDOM.createElement('div', { id: 'messages' }),
        VDOM.createElement('form', { id: 'chatForm', onsubmit: sendMessage }, [
            VDOM.createElement('input', { type: 'text', id: 'chatMessage', placeholder: 'Type your message...', required: true }),
            VDOM.createElement('button', { type: 'submit' }, 'Send')
        ])
    ]);

    return chatContainer;
}

function sendMessage(event) {
    event.preventDefault();
    const message = document.getElementById('chatMessage').value;
    if (message) {
        ws.send(JSON.stringify({ type: 'message', content: message }));
        document.getElementById('chatMessage').value = '';
    }
}

export function appendMessage(message) {
    const messagesContainer = document.getElementById('messages');
    const messageElement = VDOM.createElement('p', {}, message);
    messagesContainer.appendChild(messageElement);
}

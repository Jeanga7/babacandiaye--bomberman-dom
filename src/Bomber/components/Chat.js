import VDOM from '../../core/dom.mjs';
import { ws } from '../globals.js';
import { playerName } from './PlayerForm.js';

export function createChat() {
    // return VDOM.createElement('div', { id: 'chat-container' },
    //     VDOM.createElement("div", { id: "messagehead" }, "Chat center"),
    //     VDOM.createElement('div', { id: 'messages' }),
    //     VDOM.createElement('form', { id: 'chatForm', onsubmit: sendMessage },
    //         VDOM.createElement('input', { type: 'text', id: 'chatMessage', placeholder: 'Type your message...', required: true }),
    //         VDOM.createElement('button', { type: 'submit', id:"submitmessage"}, VDOM.createElement("img",{src:"../assets/send.svg"}))
    //     )
    // );
    return VDOM.createElement('div', { class: 'gamemessage' },
        VDOM.createElement('div', { class: 'messageheader' }, 'Chat center'),
        VDOM.createElement('div', { class: 'messageType' },

        ),
        VDOM.createElement('form', { class: 'messageform', onsubmit: sendMessage },
            VDOM.createElement('input', { type: 'text', id: 'chatMessage', placeholder: 'Type your message...', required: true }),
            VDOM.createElement('button', { type: 'submit' },
                VDOM.createElement('img', { src: '../assets/sendbutton.svg', alt: '' })
            )
        )
    )
}

function sendMessage(event) {
    event.preventDefault();
    const message = document.getElementById('chatMessage').value;
    if (message) {
        ws.send(JSON.stringify({ type: 'message', name: playerName, content: message }));
        document.getElementById('chatMessage').value = '';
    }
}

export function displayMessage(sender, message) {
    console.log('message to append', message);
    const messagesContainer = document.querySelector('.messageType');
    // const messageElement = VDOM.createElement('div', {
    //     class: `message ${isSent ? 'sent' : 'received'}`
    // }, message);

    const messageElement = VDOM.createElement('div', { class: 'thecontent' },
        VDOM.createElement('div', { class: 'messagepic' },
            VDOM.createElement('img', { src: '../assets/messagepic.svg', alt: '' })
        ),
        VDOM.createElement('div', { class: 'sendername' }, `${sender}:`),
        VDOM.createElement('div', { class: 'messagecontent' }, `${message}`)
    )
    messagesContainer.appendChild(messageElement.render());
}


// const messagePart = VDOM.createElement('div', { class: 'gamemessage' },
//     VDOM.createElement('div', { class: 'messageheader' }, 'Chat center'),
//     VDOM.createElement('div', { class: 'messageType' },
//         VDOM.createElement('div', { class: 'thecontent' },
//             VDOM.createElement('div', { class: 'messagepic' },
//                 VDOM.createElement('img', { src: 'assets/messagepic.svg', alt: '' })
//             ),
//             VDOM.createElement('div', { class: 'sendername' }, 'Al qaida:'),
//             VDOM.createElement('div', { class: 'messagecontent' }, 'HELLO THERE')
//         )
//     ),
//     VDOM.createElement('div', { class: 'messageform' },
//         VDOM.createElement('input', { type: 'text', name: 'message', placeholder: 'Type a message' }),
//         VDOM.createElement('button', {},
//             VDOM.createElement('img', { src: 'assets/sendbutton.svg', alt: '' })
//         )
//     )
// )


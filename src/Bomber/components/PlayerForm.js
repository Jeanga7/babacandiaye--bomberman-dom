export function createForm() {
    const formContainer = VDOM.createElement('div', { id: 'form-container' }, [
        VDOM.createElement('h1', {}, 'Enter Your Name'),
        VDOM.createElement('form', { id: 'nameForm', onsubmit: handleSubmit }, [
            VDOM.createElement('input', { type: 'text', id: 'playerName', placeholder: 'Enter your name', required: true }),
            VDOM.createElement('button', { type: 'submit' }, 'Start Game')
        ])
    ]);

    return formContainer;
}

function handleSubmit(event) {
    event.preventDefault();
    const playerName = document.getElementById('playerName').value;
    if (playerName) {
        ws.send(JSON.stringify({ type: 'join', name: playerName }));

        document.getElementById('form-container').style.display = 'none';
        document.getElementById('chat-container').style.display = 'block';
    }
}

import VDOM from '../../core/dom.mjs';
import EventHandler from '../../core/events.js';
import { ws } from '../globals.js';

export let playerName = "";

export function changeScreen() {
    const eventHandler = new EventHandler();

    function onEnterPressed(data) {
        document.getElementById("app").innerHTML = data;
    }

    eventHandler.once("enterkey", onEnterPressed);

    document.addEventListener("keydown", keydownHandler);
}

export const keydownHandler = (event) => {
    if (event.key === "Enter") {
        playerName = document.getElementById('inputfield').value.trim();
        
        if (playerName) {
            if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
                console.warn("WebSocket is in CLOSING or CLOSED state. Reloading page...");
                window.location.reload();
                return;
            }
            
            if (playerName.length > 6) {
                showError("Please use less than 7 characters");
                return;
            }
            
            sendJoinMessage(playerName);

            document.removeEventListener("keydown", keydownHandler);
        } else {
            showError("Please use a valid pseudo");
        }
    }
};

function showError(message) {
    let errorName = VDOM.createElement("div", { id: "errorName", style: "color:red;margin-top:10px;font-size:x-large;" }, message);

    const appElement = document.getElementById("app");
    if (appElement) {
        if (!document.getElementById("errorName")) {
            VDOM.appendChildToElementById("app", errorName);
            setTimeout(() => {
                const errorElement = document.getElementById("errorName");
                if (errorElement) {
                    errorElement.remove();
                }
            }, 2000);
        }
    }
}

function sendJoinMessage(playerName) {
    if (ws.readyState === WebSocket.OPEN) {
        const message = {
            type: 'join',
            name: playerName
        };
        ws.send(JSON.stringify(message));
    } else {
        console.error("WebSocket is not open. Cannot send message.");
    }
}

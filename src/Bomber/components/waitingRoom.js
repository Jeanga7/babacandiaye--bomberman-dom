import VDOM from '../../core/dom.mjs';
import { tabImageOfPlayer } from '../app.js';
import { objetOfPlayer } from '../websocket.js';

export function waitingRoom(nbrOfPlayer) {
    
    if (!document.getElementById("container") && nbrOfPlayer !== undefined) {
        console.log("nbrOfPlayer", nbrOfPlayer);
        let container = document.createElement("div")
        container.id = "container"
        document.body.appendChild(container)
        let app = document.getElementById("app")
        app.innerHTML = ""
        container.appendChild(app)

        let logo2 = VDOM.createElement("div", { id: "logoContainer" }, VDOM.createElement("img", { src: "../assets/logo2.svg" }))

        let timer = VDOM.createElement("div", { id: "timer" }, "Waiting...")


        let allPlayer = VDOM.createElement("div", { id: "allplayer" })

        // let qtoquit = VDOM.createElement("img", { id: "qtoquit", src: "../assets/qtoquit.svg" })

        VDOM.appendChildToElementById("app", logo2)

        VDOM.appendChildToElementById("app", timer)

        VDOM.appendChildToElementById("app", allPlayer)

        // VDOM.appendChildToElementById("app", qtoquit)

        VDOM.appendChildToElementById("container", VDOM.createElement("div", { id: "otherside" }, VDOM.createElement("div", { id: "part1" }), VDOM.createElement("div", { id: "part2" }), VDOM.createElement("div", { id: "part3" })))
    }

    document.getElementById("allplayer").innerHTML = ""

    for (let i = 0; i < nbrOfPlayer; i++) {
        VDOM.appendChildToElementById("allplayer", setPlayerImgAndName(objetOfPlayer[i], "player" + (i + 1).toString(), tabImageOfPlayer[i]))
    }
}

export function setPlayerImgAndName(name, playerNbr, src) {
    return VDOM.createElement("div", { id: playerNbr, class: "playerContainer" }, VDOM.createElement("div", { class: "playerImg" }, VDOM.createElement("img", { id: `${playerNbr}` + "Img", src: src })), VDOM.createElement("div", { id: `${playerNbr}` + "Name", class: "NameOfPlayer" }, name))
}


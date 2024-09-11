import VDOM from "../core/dom.mjs";
import { animatePlaceholder } from "./components/utils.js";
import { changeScreen } from "./components/PlayerForm.js";

export function initGame(){
    let image=VDOM.createElement("div",{id:"logoContainer"},VDOM.createElement("img", {src:"../assets/logo1.svg"}))
    let input=VDOM.createElement("div",{id:"inputContainer"},VDOM.createElement("img",{id:"imgInput",src:"../assets/inputimg.svg"}),VDOM.createElement("input", {type:"text", id:"inputfield", autocomplete:"off"}))
    let playerContainer=VDOM.createElement("div",{id:"playerContainer"},VDOM.createElement("img",{src:"../assets/logo2.svg", id:"playerimg"}))
    let betterxpImg=VDOM.createElement("img",{id:"betterxp", src:"../assets/betterxp.svg"})
    VDOM.appendChildToElementById("app",image)
    VDOM.appendChildToElementById("app",input)
    VDOM.appendChildToElementById("app",playerContainer)
    VDOM.appendChildToElementById("app",betterxpImg)

    animatePlaceholder("inputfield",["Enter Your Pseudo and press 'Enter'... "], 100,100,1500)

    changeScreen()
}


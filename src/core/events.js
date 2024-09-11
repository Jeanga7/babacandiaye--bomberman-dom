// export default class EventHandler {
//     constructor() {
//         this.events = {};
//     }

//     addEventListener(event, callback) {
//         if (!this.events[event]) {
//             this.events[event] = [];
//         }
//         this.events[event].push(callback);
//     }

//     trigger(event, data) {
//         if (this.events[event]) {
//             this.events[event].forEach(callback => callback(data));
//         }
//     }
// }

export default class EventHandler {
    constructor() {
        this.events = {};
    }

    addEventListener(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    removeEventListener(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }

    removeAllListeners(event) {
        if (this.events[event]) {
            delete this.events[event];
        }
    }

    trigger(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }

    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.removeEventListener(event, wrapper);
        };
        this.addEventListener(event, wrapper);
    }
}

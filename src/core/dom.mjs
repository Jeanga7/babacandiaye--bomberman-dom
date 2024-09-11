export default class VDOM {
    constructor(tagName, attrs = {}, children = []) {
        this.tagName = tagName;
        this.attrs = attrs;
        this.children = children;
    }
  
    static createElement(tagName, attrs = {}, ...children) {
        return new VDOM(tagName, attrs, children);
    }
   
    render() {
        const element = document.createElement(this.tagName);
        for (let [key, value] of Object.entries(this.attrs)) {
            if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.substring(2).toLowerCase(), value);
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else {
                element.setAttribute(key, value);
            }
        }

        this.children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (typeof child === 'number') {
                console.warn('Ignoring number child:', child);
            } else if (typeof child.render === 'function') {
                element.appendChild(child.render());
            } else {
                console.error('Invalid child type:', child);
            }
        });

        return element;
    }

    static getElementById(id) {
        return document.getElementById(id);
    }

    static getElementsByClassName(className) {
        return document.getElementsByClassName(className);
    }

    static appendChildToElementById(id, childVDOM) {
        const parentElement = this.getElementById(id);
        if (parentElement) {
            parentElement.appendChild(childVDOM.render());
        } else {
            console.error(`No element found with id: ${id}`);
        }
    }

    static appendChildToElementsByClassName(className, childVDOM) {
        const parentElements = this.getElementsByClassName(className);
        if (parentElements.length > 0) {
            Array.from(parentElements).forEach(parentElement => {
                parentElement.appendChild(childVDOM.render());
            });
        } else {
            console.error(`No elements found with class name: ${className}`);
        }
    }

    static appendChildToBody(childVDOM) {
        document.body.appendChild(childVDOM.render());
    }
}



// export default class VDOM {
//     constructor(tagName, attrs = {}, children = []) {
//         this.tagName = tagName;
//         this.attrs = attrs;
//         this.children = children;
//     }
  
//     static createElement(tagName, attrs = {}, ...children) {
//         return new VDOM(tagName, attrs, children);
//     }
   
//     render() {
//         const element = document.createElement(this.tagName);
//         for (let [key, value] of Object.entries(this.attrs)) {
//             if (key.startsWith('on') && typeof value === 'function') {
//                 element.addEventListener(key.substring(2).toLowerCase(), value);
//             } else if (key === 'style' && typeof value === 'object') {
//                 Object.assign(element.style, value);
//             } else {
//                 element.setAttribute(key, value);
//             }
//         }

//         this.children.forEach(child => {
//             if (typeof child === 'string') {
//                 element.appendChild(document.createTextNode(child));
//             } else if (typeof child === 'number') {
//                 console.warn('Ignoring number child:', child);
//             } else if (typeof child.render === 'function') {
//                 element.appendChild(child.render());
//             } else {
//                 console.error('Invalid child type:', child);
//             }
//         });

//         return element;
//     }
// }


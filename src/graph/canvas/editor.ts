export class Editor {
    dom: HTMLElement
    constructor() {
        this.dom = document.createElement('div')
        this.dom.contentEditable = 'true'
        this.dom.innerHTML = 'Hello'
        this.dom.style.position = 'absolute'
        this.dom.style.zIndex = '999'
        document.body.style.position = 'relative'
        document.body.appendChild(this.dom)
    }

    show(x: number, y: number, width: number, height: number, context: string) {
        this.dom.style.transformOrigin = `bottom left`
        this.dom.style.transform = `translate(${x}px, ${y}px)`
        this.dom.innerText = context


        console.log(x, y, width, height)
    }

    hide() {

    }

    on() {

    }

}


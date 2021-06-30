import { NodeItem } from "./nodes"

export class Editor {
    box: HTMLElement
    dom: HTMLElement
    chagneEvents: Function[]
    changeNode: NodeItem
    lastPosition: { x: number, y: number, scale: number }
    constructor() {
        this.chagneEvents = []
        const box = this.box = document.createElement('div')


        box.style.position = 'absolute'
        box.style.zIndex = '999'
        this.dom = document.createElement('div')
        this.dom.innerHTML = 'Hello'
        this.dom.contentEditable = 'true'
        this.dom.style.font = "14px Arial"
        this.dom.style.position = 'absolute'
        this.dom.style.left = '0'
        this.dom.style.top = '0'
        this.dom.style.whiteSpace = 'nowrap'

        this.dom.style.transform = "translate(0, -100%)"
        box.appendChild(this.dom)
        document.body.style.position = 'relative'
        document.body.appendChild(box)
        // bind Change event
        this.dom.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.returnValue = false
            }
        })
        this.dom.addEventListener('input', (e) => {
            console.log(this.dom.innerText.replace(/\n/gi, ''))
            this.changeNode.context = this.dom.innerText.replace(/\n/gi, '')
        })

    }

    show(x: number, y: number, width: number, height: number, scale: number, node: NodeItem) {
        const lastPosition = this.lastPosition || { x: 0, y: 0, scale: 0 }

        this.changeNode = node
        this.box.style.display = 'inline-block'
        this.dom.style.transformOrigin = `bottom left`
        this.box.style.transform = `translate(${x}px, ${y}px) scale(${scale / 2})`

        if (!(x === lastPosition.x && y === lastPosition.y && scale === lastPosition.scale)) {
            this.dom.innerText = node.context
            var range = document.createRange()
            var sel = window.getSelection()
            range.setStart(this.dom, 0)
            range.collapse(true)

            sel.removeAllRanges()
            sel.addRange(range)

        }
        this.lastPosition = { x, y, scale }
    }

    hide() {
        this.box.style.display = 'none'
    }

    change(fn: Function) {
        this.chagneEvents.push(fn)
    }

}


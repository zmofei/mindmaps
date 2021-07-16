import { NodeItem } from "./nodes"

export class Editor {
    box: HTMLElement
    dom: HTMLElement
    events: {
        [key: string]: Function[]
    }
    changeNode: NodeItem
    lastPosition: { x: number, y: number, scale: number }
    renderTimeoutId: ReturnType<typeof setTimeout>
    lastNodeId: string
    constructor() {
        const box = this.box = document.createElement('div')

        box.style.position = 'absolute'
        box.style.zIndex = '999'
        this.dom = document.createElement('div')
        this.dom.innerHTML = 'Hello'
        this.dom.contentEditable = 'true'
        this.dom.style.font = "14px Arial"
        this.dom.style.position = 'absolute'
        this.dom.style.left = '1px'
        this.dom.style.top = '0'
        this.dom.style.whiteSpace = 'nowrap'
        this.dom.style.minWidth = '40px'

        this.dom.style.transform = "translate(0, -100%)"
        box.appendChild(this.dom)
        document.body.style.position = 'relative'
        document.body.appendChild(box)
        // bind Change event
        this.dom.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.returnValue = false
                // this.events.new = this.events.new || []
                // this.events.new.forEach(fn => {
                //     fn({
                //         father: this.changeNode.id,
                //         after: null
                //     })
                // })
            }
        })
        // 
        this.dom.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.returnValue = false
            }
        })

        this.dom.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                // console.log(1)
                this.events.done.forEach(fn => {
                    fn({
                        father: this.changeNode.fatherId,
                        after: this.changeNode.id
                    })
                })
                e.preventDefault()
            }
        })
        // 
        this.dom.addEventListener('input', (e) => {
            this.changeNode.context = this.dom.innerText.replace(/\n/gi, '')
        })

        // init events
        this.events = {}

    }

    show(x: number, y: number, width: number, height: number, scale: number, node: NodeItem) {
        const lastPosition = this.lastPosition || { x: 0, y: 0, scale: 0 }

        this.changeNode = node
        this.box.style.display = 'inline-block'
        this.dom.style.transformOrigin = `bottom left`
        this.box.style.transform = `translate(${x}px, ${y}px) scale(${scale / 2})`

        const willUpdate = !(node.id === this.lastNodeId)
        // focus to the dom only if we change the node
        if (willUpdate) {
            this.dom.innerText = node.context
            var range = document.createRange()
            var sel = window.getSelection()
            range.selectNodeContents(this.dom)
            sel.removeAllRanges()
            sel.addRange(range)
            this.lastNodeId = node.id
        }
        this.lastPosition = { x, y, scale }
    }

    hide() {
        this.lastNodeId = null
        this.box.style.display = 'none'
    }

    onChange(type: string, fn: Function) {
        this.events[type] = this.events[type] || []
        this.events[type].push(fn)
    }

}


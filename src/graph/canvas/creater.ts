// This file is to create the init Canvas document and set up the resolution and other stuffs.
// @ts-nocheck

import { NodeItem, NodeTree } from './nodes'
import { NodeType, NodeState } from './cavnas-node-types'

interface size {
    width: number,
    height: number
}

class CoreCanvas {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    offset: {
        x: number,
        y: number,
    }
    events: any
    scale: number
    nodeTrees: NodeItem[]
    hover: NodeItem
    selected: NodeItem
    editItem: NodeItem
    size: size
    dpr: number

    constructor(size: size) {
        this.dpr = window.devicePixelRatio || 1
        this.scale = this.dpr;
        this.size = size
        this.offset = { x: size.width / 2 * this.scale, y: size.height / 2 * this.scale }
        this.events = {}

        const canvas = this.canvas = document.createElement('canvas')
        this.ctx = canvas.getContext('2d')
        window.ctx = this.ctx

        this.adjustCanvs(canvas, size);
        this.bindEvent()

        // TEST
        // addNode
        const testNode = window.testNode = new NodeTree(this, {
            x: 0,
            y: 0,
            context: 'Hello World'
        })

        let tid = 0;
        tid = testNode.addNode({
            context: 'Robin Ma'
        })

        for (let i = 0; i < 5; i++) {
            testNode.addNode({
                context: 'Robin Ma'
            }, tid)
        }


        tid = testNode.addNode({
            context: 'Mofei Zhu'
        })

        for (let i = 0; i < 5; i++) {
            testNode.addNode({
                context: 'Mofei Zhu'
            }, tid)
        }
        this.nodeTrees = [testNode]
    }

    adjustCanvs(canvas: HTMLCanvasElement, size: size) {
        // Get the device pixel ratio, falling back to 1.

        // Give the canvas pixel dimensions of their CSS
        // size * the device pixel ratio.
        canvas.style.width = `${size.width}px`;
        canvas.style.height = `${size.height}px`;
        canvas.width = size.width * this.dpr;
        canvas.height = size.height * this.dpr;
        this.ctx.translate(this.offset.x, this.offset.y)
        this.ctx.scale(this.dpr, this.dpr)
    }

    // The events Config the canvas by translate and scale, so that NodeItems don't need to care about the translate and scale
    bindEvent() {
        const canvas = this.canvas;
        let moving = 'DONE';
        let mousedownX = null;
        let mousedownY = null;
        let lastX = null;
        let lastY = null;

        canvas.addEventListener('mousedown', (e) => {
            moving = 'PREPARE';
            lastX = mousedownX = e.offsetX
            lastY = mousedownY = e.offsetY

            if (this.editItem) {
                // Clean the Editor model
                this.editItem?.state = NodeState.Default
                this.editItem = null
                this.draw()
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (moving === 'PREPARE' || moving === 'MOVING') {
                // Moving modle
                // In moving modle we translate the canvas, 
                //   so that in the node tree draw step, 
                //   the nodes don't need to consider the canvas translate.
                const { dpr, scale, offset } = this
                const moveDelteX = e.offsetX - lastX;
                const moveDelteY = e.offsetY - lastY;
                const scaleRatio = (scale / dpr);
                lastY = e.offsetY
                lastX = e.offsetX
                moving = 'MOVING'

                this.ctx.translate(moveDelteX / scaleRatio, moveDelteY / scaleRatio)

                this.draw()
            } else {
                // Free move modle
                // In free modle, we calculate the mouse's relation with the nodes,
                //   and save the hovered node to this.hover
                const onCanvasX = (e.offsetX * this.dpr - this.offset.x) / this.scale
                const onCanvasY = (e.offsetY * this.dpr - this.offset.y) / this.scale

                let matchedNode = null;
                // Loop the tree's position
                this.nodeTrees.forEach(({ tree }) => {
                    const stack = [Object.keys(tree).map(roodId => tree[roodId])];
                    while (stack.length >= 1) {
                        const nodes = stack.pop();

                        for (let node of nodes) {
                            const xInBoundary = node.x >= 0 ? (onCanvasX >= node.x) : (onCanvasX <= node.x)
                            const yBoundarys = [node.y - node.childrenSumHeight, node.y + node.childrenSumHeight]
                            const yInBoundary = onCanvasY >= Math.min.apply(null, yBoundarys) && onCanvasY <= Math.max.apply(null, yBoundarys)
                            const nodeChildren = node.children
                            if (xInBoundary && yInBoundary) {
                                // math Node
                                //  -----------------         -----------------
                                // |                 |       |                 |
                                // .(x,y) ROOOT      |       |    Others       |
                                // |                 |       |                 |
                                //  -----------------        .(x,y)------------
                                // If the node type is root the origin is in the left-middle
                                // Other whise the origin is in the left-bottom
                                const XinBox = onCanvasX >= node.x && onCanvasX <= node.x + node.boxWidth
                                let YOffset = node.type === NodeType.Root ? node.boxHeight / 2 : 0
                                const YinBox = onCanvasY >= (node.y - node.boxHeight + YOffset) && onCanvasY <= (node.y + YOffset)
                                if (XinBox && YinBox) {
                                    matchedNode = node
                                    stack.length = 0
                                    break
                                }

                                if (nodeChildren) {
                                    stack.push(nodeChildren)
                                }
                            }
                        }
                    }
                })

                if (matchedNode) {
                    this.canvas.style.cursor = 'pointer'
                } else {
                    this.canvas.style.cursor = 'default'
                }

                this.hover = matchedNode
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            e.preventDefault()
            moving = 'DONE'
            lastX = lastY = null
            const newTransform = this.ctx.getTransform()
            this.scale = newTransform.a
            this.offset = {
                x: newTransform.e,
                y: newTransform.f
            }
        });

        canvas.addEventListener('wheel', (e) => {
            const { dpr, scale, offset } = this
            e.preventDefault();

            const scaleDelta = Math.pow(1.01, -e.deltaY);
            const scaleRatio = (scale / dpr);

            ctx.setTransform(scale, 0, 0, scale, offset.x, offset.y)
            this.ctx.translate(-offset.x / scale + e.offsetX / scaleRatio, -offset.y / scale + e.offsetY / scaleRatio)
            this.ctx.scale(scaleDelta, scaleDelta)
            this.ctx.translate(-(-offset.x / scale + e.offsetX / scaleRatio), -(-offset.y / scale + e.offsetY / scaleRatio))

            const newTransform = this.ctx.getTransform()
            this.scale = newTransform.a
            this.offset = {
                x: newTransform.e,
                y: newTransform.f
            }

            this.draw()
        });

        canvas.addEventListener('click', (e) => {
            // Prevent trigger the click event while you movingthe canvas
            if (Math.abs(e.offsetX - mousedownX) > 5 || Math.abs(e.offsetY - mousedownY) > 5) return false;

            this.selected?.selected = false
            // If you click the Node twice the node will become the Editor mode
            // Otherwise the Node will exit the Editor mode
            if (this.hover && this.selected === this.hover) {
                this.selected = null
                this.hover.state = NodeState.Edit
                this.editItem = this.hover
            } else if (this.hover !== this.editItem) {
                this.editItem?.state = NodeState.Default
                this.editItem = null
                // Re assign the select Node
                this.selected = this.hover;
                this.selected?.selected = true;
            }
            this.draw();
        })

        window.addEventListener('keyup', (e) => {
            const NodeTree = this.nodeTrees[0];
            if (e.key === 'Enter') {
                // console.log(NodeTree.editoringNode)
                if (this.editItem) {
                    // If you press enter, and if we have the edit node, we will quit the edit mode by:
                    // 1. set the editor node as seleced node
                    this.editItem.selected = true
                    this.selected = this.editItem
                    // 2. set the editItem to null
                    this.editItem.state = NodeState.Default;
                    this.editItem = null;
                } else if (this.selected) {
                    // If we have the selected node, we will enter the edit mode by
                    const { fatherId, id } = this.selected;
                    // 1. clean the selected node
                    this.selected && (this.selected.selected = false)
                    this.selected = null;
                    // 2. add a new editor and set it to the editor mode
                    NodeTree.addNode({ context: 'New Node' }, fatherId, id, true)
                }
                this.draw()
            }
        })
    }

    // Draw Nodetree
    // 1. Clean the canvas
    // 2. Call the draw function from the Node tree
    draw() {
        const ctx = this.ctx;
        // Reset the canvas and clean it
        ctx.save()
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = '#f3f3f4'
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.restore();


        // 
        if (window.debug) {
            // origin 
            this.ctx.save()
            this.ctx.beginPath()
            this.ctx.strokeStyle = 'red'
            this.ctx.lineWidth = 2
            this.ctx.moveTo(0, -5)
            this.ctx.lineTo(0, 5)
            this.ctx.moveTo(-5, 0)
            this.ctx.lineTo(5, 0)
            this.ctx.stroke()
            this.ctx.closePath()

            // gird
            this.ctx.beginPath()
            this.ctx.strokeStyle = '#ddd'
            const xCount = Math.round(this.size.width / 10)
            for (let i = -xCount; i < xCount; i += 1) {
                this.ctx.moveTo(i * -10, -this.size.height)
                this.ctx.lineTo(i * -10, this.size.height)
            }
            const yCount = Math.round(this.size.height / 10)
            for (let i = -yCount; i < yCount; i += 1) {
                this.ctx.moveTo(-this.size.width, i * -10)
                this.ctx.lineTo(this.size.width, i * -10)
            }
            this.ctx.closePath()
            this.ctx.stroke()

            this.ctx.restore()
        }

        // Draw the node tree
        const nodeTrees = this.nodeTrees || [];
        nodeTrees.forEach(item => {
            item.draw()
        });

    }
}

// Canvas garph
class CanvasGraph {
    coreCanvas: CoreCanvas
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    needUpdate: boolean
    constructor(dom: HTMLElement) {
        const styleInfo = getComputedStyle(dom)
        const size = {
            width: parseFloat(styleInfo.width),
            height: parseFloat(styleInfo.height)
        }
        this.coreCanvas = new CoreCanvas(size);

        this.canvas = this.coreCanvas.canvas
        this.ctx = this.coreCanvas.ctx

        this.coreCanvas.draw()
    }

}

export { CanvasGraph }
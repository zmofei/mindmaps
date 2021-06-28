// This file is to create the init Canvas document and set up the resolution and other stuffs.
// @ts-nocheck

import { NodeItem, NodeTree } from './nodes'
import { NodeType } from './cavnas-node-types'

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
    size: size
    dpr: number

    constructor(size: size) {
        this.dpr = window.devicePixelRatio
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
        const testNode = window.testNode = new NodeTree(this.ctx, {
            x: 0,
            y: 0,
            context: 'Hello'
        })

        let tid = 0;
        tid = testNode.addNode({
            context: 'Robin Ma'
        })



        tid = testNode.addNode({
            context: 'CKY'
        })
        testNode.addNode({
            context: 'Name: kaiyue'
        }, tid)
        tid = testNode.addNode({
            context: 'Mofei Zhu'
        })

        testNode.addNode({
            context: 'Name: Mofei'
        }, tid)
        testNode.addNode({
            context: 'Sex: Fame'
        }, tid)

        tid = testNode.addNode({
            context: 'Age: 18'
        }, tid)


        tid = testNode.addNode({
            context: 'Mll'
        })

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


    bindEvent() {
        const canvas = this.canvas;
        let drawing = false;
        let lastX = 0;
        let lastY = 0;

        canvas.addEventListener('mousedown', (e) => {
            drawing = true;
            lastX = e.offsetX
            lastY = e.offsetY
        });

        canvas.addEventListener('mousemove', (e) => {
            if (drawing) {
                // drawing modle
                const { dpr, scale, offset } = this
                const moveDelteX = e.offsetX - lastX;
                const moveDelteY = e.offsetY - lastY;
                const scaleRatio = (scale / dpr);
                lastY = e.offsetY
                lastX = e.offsetX

                this.ctx.translate(moveDelteX / scaleRatio, moveDelteY / scaleRatio)

                this.draw()
            } else {
                // free move modle
                const onCanvasX = (e.pageX * this.dpr - this.offset.x) / this.scale
                const onCanvasY = (e.pageY * this.dpr - this.offset.y) / this.scale

                let matchedNode = null;
                this.nodeTrees.forEach(({ tree }) => {
                    // Loop the tree's position
                    const stack = [Object.keys(tree).map(roodId => tree[roodId])];
                    while (stack.length >= 1) {
                        const nodes = stack.pop();

                        for (let node of nodes) {
                            const nodeXRange = Math.max(Math.abs(node.x), 0)

                            const xInBoundary = nodeXRange < Math.abs(onCanvasX);
                            const yInBoundary = Math.abs(node.y || 0) < (Math.abs(onCanvasY) + node.outerHeight);
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
            drawing = false
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
            delete this.selected?.selected;
            this.selected = this.hover;
            this.selected?.selected = true;
            this.draw();
        })
    }

    draw() {
        const ctx = this.ctx;
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
        // 

        const nodeTrees = this.nodeTrees || [];
        nodeTrees.forEach(item => {
            item.draw()
        })

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
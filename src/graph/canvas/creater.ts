// This file is to create the init Canvas document and set up the resolution and other stuffs.
// @ts-nocheck

import { Nodes } from './nodes'

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
    drawList: Nodes[]
    size: size
    dpr: number

    constructor(size: size) {
        this.dpr = window.devicePixelRatio
        this.scale = this.dpr;
        this.size = size
        this.offset = { x: size.width / 2 * this.scale, y: size.height / 2 * this.scale }
        // this.offset = { x: 0, y: 0 }
        this.events = {}

        const canvas = this.canvas = document.createElement('canvas')
        this.ctx = canvas.getContext('2d')
        window.ctx = this.ctx

        this.adjustCanvs(canvas, size);
        this.bindEvent()

        // TEST
        // addNode
        const testNode = window.testNode = new Nodes(this.ctx, {
            x: 0,
            y: 0,
            context: 'Hello'
        })

        let tid = 0;
        // tid = testNode.addNode({
        //     context: 'Robin Ma'
        // })
        // for (let i = 0; i < 10; i++) {
        //     let x = testNode.addNode({
        //         context: '1989'
        //     }, tid)
        //     if (i === 0) {
        //         for (let i = 0; i < 10; i++) {
        //             testNode.addNode({
        //                 context: '111'
        //             }, x)
        //         }
        //     }
        // }


        tid = testNode.addNode({
            context: 'CKY'
        })
        testNode.addNode({
            context: 'Name: kaiyue'
        }, tid)
        tid = testNode.addNode({
            context: 'Mofei Zhu'
        })

        // testNode.addNode({
        //     context: 'Name: Mofei'
        // }, tid)
        // testNode.addNode({
        //     context: 'Sex: Fame'
        // }, tid)

        // tid = testNode.addNode({
        //     context: 'Age: 18'
        // }, tid)


        // tid = testNode.addNode({
        //     context: 'Mll'
        // })

        this.drawList = [testNode]
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
        })
        canvas.addEventListener('mousemove', (e) => {
            if (!drawing) return false;
            const { dpr, scale, offset } = this
            const moveDelteX = e.offsetX - lastX;
            const moveDelteY = e.offsetY - lastY;
            const scaleRatio = (scale / dpr);
            lastY = e.offsetY
            lastX = e.offsetX

            this.ctx.translate(moveDelteX / scaleRatio, moveDelteY / scaleRatio)

            this.draw()
        })
        canvas.addEventListener('mouseup', (e) => {
            drawing = false
            const newTransform = this.ctx.getTransform()
            this.scale = newTransform.a
            this.offset = {
                x: newTransform.e,
                y: newTransform.f
            }
        })
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
            this.ctx.restore()
        }
        // 

        const drawList = this.drawList || [];
        drawList.forEach(item => {
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
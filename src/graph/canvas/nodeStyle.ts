import { NodeType } from './cavnas-node-types'

const NodeMargin = 10
const NodePadding = 10
const ListPadding = 100


function drawNode(type: NodeType, ctx: CanvasRenderingContext2D, list: any) {
    ctx.save()
    ctx.strokeStyle = '#e99b47';
    if (type === NodeType.Root) {
        ctx.beginPath()
        list.forEach((board: any) => {
            const [item, offset] = board
            const { context, boxHeight, boxWidth, outerHeight } = item
            let { x, y } = offset
            y = y + item.boxHeight / 2
            ctx.translate(x + NodePadding, y - item.boxHeight / 2)
            const radius = 6;
            ctx.lineWidth = 4
            ctx.moveTo(-NodePadding, 0)
            ctx.lineTo(-NodePadding, -boxHeight / 2 + radius)
            ctx.arc(-NodePadding + radius, -boxHeight / 2 + radius, radius, Math.PI, Math.PI * (3 / 2))
            ctx.lineTo(boxWidth - NodePadding - radius, -boxHeight / 2)
            ctx.arc(boxWidth - NodePadding - radius, -boxHeight / 2 + radius, radius, Math.PI * (3 / 2), 2 * Math.PI)
            ctx.lineTo(boxWidth - NodePadding, boxHeight / 2 - radius)
            ctx.arc(boxWidth - NodePadding - radius, boxHeight / 2 - radius, radius, 2 * Math.PI, Math.PI * (1 / 2))
            ctx.lineTo(-NodePadding + radius, boxHeight / 2)
            ctx.arc(-NodePadding + radius, boxHeight / 2 - radius, radius, Math.PI / 2, Math.PI)
            ctx.lineTo(-NodePadding, 0)
            ctx.translate(-(x + NodePadding), -(y - item.boxHeight / 2))
        })
        ctx.closePath()
        ctx.stroke()
        ctx.fillStyle = 'white'
        ctx.fill()
    } else if (type === NodeType.Node) {
        ctx.beginPath()
        list.forEach((board: any) => {
            const [item, offset] = board
            const { context, boxHeight, boxWidth, outerHeight } = item
            const { x, y } = offset
            ctx.translate(x + NodePadding, y - item.boxHeight / 2)
            ctx.lineCap = 'round';
            ctx.lineWidth = 2
            ctx.moveTo(-NodePadding, boxHeight / 2)
            ctx.lineTo(item.boxWidth - NodePadding, boxHeight / 2)
            ctx.translate(-(x + NodePadding), -(y - item.boxHeight / 2))
        })
        ctx.closePath()
        ctx.stroke()
    }
    ctx.restore()
}



export { NodeType, NodeMargin, NodePadding, ListPadding, drawNode }
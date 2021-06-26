import { NodeType, drawNode, NodeMargin, NodePadding, ListPadding, } from './nodeStyle'

interface config {
    x: number,
    y: number,
    context: string,
    fatherId?: string,
    type?: NodeType
}

class NodeItem {
    ctx: CanvasRenderingContext2D
    id: string
    contextWidth: number
    contextHeight: number
    x: number
    y: number
    boxWidth: number
    boxHeight: number
    outerHeight: number
    outerWidth: number
    childern: NodeItem[]
    childrenSumHeight: number
    context: string
    fatherId: string
    father: NodeItem
    type: NodeType
    _groupindex: number
    constructor(ctx: CanvasRenderingContext2D, config: config = { x: 0, y: 0, context: '', fatherId: null }) {
        const id = (+new Date()).toString(32) + (Math.random().toString(32))
        this.id = id
        this.ctx = ctx
        this.x = config.x
        this.y = config.y
        this.type = config.type ?? NodeType.Node

        this.context = config.context
        this.fatherId = config.fatherId || null

        ctx.font = "30px Arial";
        const txt = this.ctx.measureText(config.context);
        this.contextWidth = txt.actualBoundingBoxRight - txt.actualBoundingBoxLeft;
        this.contextHeight = txt.actualBoundingBoxAscent - txt.actualBoundingBoxDescent;
        this.boxWidth = this.contextWidth + NodePadding * 2;
        this.boxHeight = this.contextHeight + NodePadding * 2;
        this.outerHeight = this.boxHeight + NodeMargin * 2
        this.outerWidth = this.boxWidth + NodeMargin * 2
        // 
        this.childrenSumHeight = this.outerHeight
    }
}

class Nodes {
    config: {
        x: number,
        y: number,
        context?: any,
        contextWidth?: number,
        contextHeight?: number,
    }

    ctx: CanvasRenderingContext2D
    nodesTree: any
    rootid: string
    nodesRef: any
    boardList: [NodeItem, { x: number, y: number }][]
    textList: [NodeItem, { x: number, y: number }][]
    linkList: [number, number, number, number][]

    constructor(ctx: CanvasRenderingContext2D, config = { x: 0, y: 0, context: '', type: NodeType.Root }) {
        this.ctx = ctx
        const item = new NodeItem(ctx, { ...config, type: NodeType.Root });
        this.rootid = item.id
        this.nodesTree = {}
        this.nodesTree[this.rootid] = item
        this.nodesRef = this.nodesRef || {}
        this.nodesRef[this.rootid] = item
        // bind father
        if (item.fatherId && this.nodesTree[item.fatherId]) {
            item.father = this.nodesTree[item.fatherId]
        }

        console.log('init id', item.id)
    }

    addNode(config = { y: 0, context: '' }, fatherid?: string) {

        const fatherId = fatherid || this.rootid;
        const fatherItem = this.nodesRef[fatherId];
        const item = new NodeItem(this.ctx, {
            ...config,
            x: fatherItem.contextWidth + fatherItem.x + 40,
            fatherId: fatherId
        });

        // add item to fater
        fatherItem.children = fatherItem.children || []
        fatherItem.children.push(item)
        this.nodesRef[item.id] = item

        // bind father
        if (item.fatherId && this.nodesTree[item.fatherId]) {
            item.father = fatherItem
        }

        // Re-computer position
        // Height: update the height of all the affected nodes from parent to root
        const onlyChildren = (fatherItem.children || []).length <= 1
        const increateHeight = onlyChildren ? 0 : item.outerHeight
        let loopItem = item;
        while (loopItem) {
            const loopItemId = loopItem.fatherId
            const fatherItem = this.nodesRef[loopItemId];
            if (!loopItemId || !fatherItem) {
                loopItem = null
            } else {
                fatherItem.childrenSumHeight += increateHeight
                loopItem = fatherItem
            }
        }

        // x,y
        // A Node added may cause all the tree's layout change
        // we need to restracture all the x,y for the tree.
        this._shakeTree()

        // 
        return item.id
    }

    _shakeTree() {
        interface drawInfo {
            x: number
            fatherY: number,
            fatherX: number,
            father?: NodeItem
        }

        const root = Object.keys(this.nodesTree).map(id => this.nodesRef[id]);
        const stacks: { info: drawInfo, items: any[] }[] = [{ info: { x: 0, fatherY: 0, fatherX: 0, }, items: root }];

        const boardList: [NodeItem, { x: number, y: number }][] = [];
        const textList: [NodeItem, { x: number, y: number }][] = [];
        const linkList: [number, number, number, number][] = [];

        while (stacks.length > 0) {
            const stackItem = stacks.shift();

            const info = stackItem.info;
            const items = stackItem.items;

            let listHgihtTrim = 0;
            items.forEach((item, index) => {
                listHgihtTrim += item.childrenSumHeight
            })

            const listStartY = info.fatherY - listHgihtTrim / 2

            let nextSilbingStartY = listStartY
            const onlyChildren = items.length === 1
            items.forEach((item, index) => {
                let itemY;
                if (onlyChildren) {
                    itemY = info.fatherY
                } else {
                    itemY = nextSilbingStartY + item.childrenSumHeight / 2
                    nextSilbingStartY += item.childrenSumHeight
                }
                boardList.push([item, { x: info.x, y: itemY }])
                textList.push([item, { x: info.x, y: itemY }])

                if (info.father) {
                    linkList.push([
                        info.fatherX + info.father.boxWidth,
                        info.fatherY,
                        info.x,
                        itemY
                    ])
                }

                const children = item.children;
                if (children) {
                    stacks.push({ info: { x: info.x + item.boxWidth + ListPadding, fatherY: itemY, fatherX: info.x, father: item }, items: children })
                }
            })
        }

        this.boardList = boardList
        this.textList = textList
        this.linkList = linkList
    }

    // draw board box
    drawBoard() {
        const list = this.boardList
        const ctx = this.ctx
        ctx.save()
        const listByType: {
            [key: string]: {
                type: NodeType,
                list: any[]
            }
        } = {}
        list.forEach(listItem => {
            const [NodeItem] = listItem
            listByType[NodeItem.type] = listByType[NodeItem.type] || {
                type: NodeItem.type,
                list: []
            }
            listByType[NodeItem.type].list.push(listItem)
        })

        Object.keys(listByType).forEach(type => {
            const list = listByType[type];
            drawNode(list.type, this.ctx, list.list);
        })
        ctx.restore()

        // for debug
        if (window.debug) {
            list.forEach(board => {
                const [item, offset] = board
                const { x, y } = offset

                ctx.save()
                ctx.translate(x + NodePadding, y - item.boxHeight / 2)
                ctx.fillRect(0, 0, 1, 1)
                // childrenSumHeight
                this.ctx.strokeStyle = 'red'
                this.ctx.fillStyle = 'red'
                ctx.font = "10px Arial";
                ctx.fillText((item.childrenSumHeight).toFixed(2).toString(), 0, NodePadding * 2)
                ctx.fillText((item.outerHeight).toFixed(2).toString(), 0, NodePadding * 2 + 10)
                ctx.strokeRect(-NodePadding, -item.childrenSumHeight / 2, item.boxWidth, item.childrenSumHeight)
                ctx.translate(-(x + NodePadding), -(y - item.boxHeight / 2))
                ctx.restore()

            })

        }
        // 

    }

    drawText() {
        const list = this.textList
        const ctx = this.ctx
        ctx.save()
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'

        list.forEach(board => {
            const [item, offset] = board
            let { x, y } = offset
            if (item.type === NodeType.Root) {
                y = y + item.boxHeight / 2
            }
            ctx.translate(x + NodePadding, y - item.boxHeight / 2)
            const { context, boxHeight, boxWidth, outerHeight } = item
            ctx.fillText(context, 0, 0)
            ctx.translate(-(x + NodePadding), -(y - item.boxHeight / 2))
        })
        ctx.restore()
    }

    drawLink() {
        const list = this.linkList
        const ctx = this.ctx
        ctx.save()

        ctx.beginPath()
        list.forEach(board => {
            const [startX, startY, endX, endY] = board;
            const deltaY = endY - startY;
            const radius = 6;
            ctx.moveTo(startX, startY);
            ctx.lineTo((startX + endX) / 2 - radius, startY);
            // if (Math.abs(deltaY) > 5) {
            if (endY < startY) {
                ctx.arc((startX + endX) / 2 - radius, startY - radius, radius, Math.PI / 2, 0, true)
            } else if (endY > startY) {
                ctx.arc((startX + endX) / 2 - radius, startY + radius, radius, Math.PI * (3 / 2), 2 * Math.PI)
            }

            if (endY < startY) {
                ctx.lineTo((startX + endX) / 2, endY + radius);
                ctx.arc((startX + endX) / 2 + radius, endY + radius, radius, Math.PI, Math.PI * (3 / 2))
            } else if (endY > startY) {
                ctx.lineTo((startX + endX) / 2, endY - radius);
                ctx.arc((startX + endX) / 2 + radius, endY - radius, radius, Math.PI, Math.PI / 2, true)
            }
            // }

            ctx.lineTo(endX, endY)
        })
        ctx.stroke()
        ctx.closePath()
    }

    draw(offset: { x: number, y: number }) {
        this.drawBoard()
        this.drawText()
        this.drawLink()
    }
}


export { Nodes }
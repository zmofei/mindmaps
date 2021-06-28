import { NodeType, drawNode, NodeMargin, NodePadding, ListPadding, } from './nodeStyle'

interface config {
    context: string,
    fatherId?: string,
    type?: NodeType
}


type renderListWithItem = [NodeItem, { x: number, y: number }][];
type renderListwithCoordinate = [number, number, number, number][]


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
    childrenSumHeight: number
    children: NodeItem[]
    context: string
    selected: boolean
    fatherId: string
    father: NodeItem
    type: NodeType
    _groupindex: number
    constructor(ctx: CanvasRenderingContext2D, config: config = { context: '', fatherId: null }) {
        const id = (+new Date()).toString(32) + (Math.random().toString(32))
        this.id = id
        this.ctx = ctx
        this.x = 0
        this.y = 0
        this.type = config.type ?? NodeType.Node

        this.context = config.context
        this.fatherId = config.fatherId || null

        ctx.font = "14px Arial";
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


class NodeTree {
    config: {
        x: number,
        y: number,
        context?: string,
        contextWidth?: number,
        contextHeight?: number,
    }

    ctx: CanvasRenderingContext2D
    tree: { [key: string]: NodeItem }
    rootid: string
    nodesRef: { [key: string]: NodeItem }
    boardList: renderListWithItem
    textList: renderListWithItem
    linkList: renderListwithCoordinate

    constructor(ctx: CanvasRenderingContext2D, config = { x: 0, y: 0, context: '', type: NodeType.Root }) {
        this.ctx = ctx
        const item = new NodeItem(ctx, { ...config, type: NodeType.Root });
        this.rootid = item.id
        this.tree = {}
        this.tree[this.rootid] = item
        this.nodesRef = this.nodesRef || {}
        this.nodesRef[this.rootid] = item
        // bind father
        if (item.fatherId && this.tree[item.fatherId]) {
            item.father = this.tree[item.fatherId]
        }

        console.log('init id', item.id)
    }

    addNode(config = { y: 0, context: '' }, fatherid?: string) {
        const fatherId = fatherid || this.rootid;
        const fatherItem = this.nodesRef[fatherId];
        console.log(fatherItem.contextWidth)
        const item = new NodeItem(this.ctx, {
            ...config,
            fatherId: fatherId
        });

        // add item to fater
        fatherItem.children = fatherItem.children || []
        fatherItem.children.push(item)
        this.nodesRef[item.id] = item

        // bind father
        if (item.fatherId && this.tree[item.fatherId]) {
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
        this.shakeTree()

        // 
        this.draw()

        // 
        return item.id
    }

    private shakeTree() {
        interface drawInfo {
            x: number
            fatherY: number,
            fatherX: number,
            father?: NodeItem
        }

        const root = Object.keys(this.tree).map(id => this.nodesRef[id]);
        const stacks: { info: drawInfo, items: NodeItem[] }[] = [{ info: { x: 0, fatherY: 0, fatherX: 0, }, items: root }];

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
                item.x = info.x
                item.y = itemY

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
        const selecteNode: NodeItem[] = []
        ctx.save()
        const listByType: {
            [key: string]: {
                type: NodeType,
                list: renderListwithCoordinate | renderListWithItem
            }
        } = {}
        // console.log('xx', list)
        list.forEach(listItem => {
            const [NodeItem] = listItem
            if (NodeItem.selected) {
                selecteNode.push(NodeItem)
            }
            listByType[NodeItem.type] = listByType[NodeItem.type] || {
                type: NodeItem.type,
                list: []
            }
            // @ts-ignore
            listByType[NodeItem.type].list.push(listItem)
        })

        Object.keys(listByType).forEach(type => {
            const list = listByType[type];
            drawNode(list.type, this.ctx, list.list);
        })
        ctx.restore()

        // draw selected
        ctx.save()
        selecteNode?.forEach(node => {
            this.ctx.fillStyle = 'rgba(0,102,255,0.2)'
            if (node.type === NodeType.Root) {
                this.ctx.fillRect(node.x, node.y - node.boxHeight / 2, node.boxWidth, node.boxHeight)
            } else {
                this.ctx.fillRect(node.x, node.y - node.boxHeight, node.boxWidth, node.boxHeight)
            }
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
                ctx.fillText(`${(item.x).toFixed(0).toString()},${(item.y || 0).toFixed(0).toString()} `, 0, NodePadding * 2 + 20)
                // ctx.fillText((item.y).toFixed(0).toString(), 20, NodePadding * 2 + 30)
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
            //                                    (endX, endY)
            //                              ---------- B
            //                             |
            //          A --------(middleX, startY)
            //  (startX, startY)           |
            //                              ---------- C
            //                                    (endX, endY)

            const [startX, startY, endX, endY] = board;
            const deltaY = Math.abs(endY - startY);
            const radius = 6 || Math.min(6, deltaY / 2);
            const middleX = (startX + endX) / 2;
            const endLowerThanStart = endY < startY;

            ctx.moveTo(startX, startY);
            ctx.lineTo(middleX - radius, startY);
            // inflection
            if (deltaY / 2 >= radius) {
                ctx.quadraticCurveTo(middleX, startY, middleX, startY + (endLowerThanStart ? -radius : radius))
                ctx.lineTo(middleX, endY + (endLowerThanStart ? radius : -radius));
                ctx.quadraticCurveTo(middleX, endY, middleX + radius, endY)
            } else {
                ctx.bezierCurveTo(middleX, startY, middleX, endY, middleX + radius, endY)
            }
            // 
            ctx.lineTo(endX, endY)
        })
        ctx.stroke()
        ctx.closePath()
    }

    draw() {
        this.drawBoard()
        this.drawText()
        this.drawLink()
    }
}


export { NodeItem, NodeTree }
import { NodeType, drawNode, NodeMargin, NodePadding, ListPadding, } from './nodeStyle'
import { NodeState } from './cavnas-node-types'
import { Editor } from './editor'

const editor = new Editor()

interface config {
    context: string,
    fatherId?: string,
    type?: NodeType
}


type renderListWithItem = [NodeItem, { x: number, y: number }][];
type renderListwithCoordinate = [number, number, number, number][]

// editor: Editor
// Bind edirot object
//  this.editor = editor

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

    selected: boolean
    fatherId: string
    father: NodeItem
    type: NodeType
    _state: NodeState
    _groupindex: number
    _context: string
    bindTree: NodeTree
    constructor(ctx: CanvasRenderingContext2D, config: config = { context: '', fatherId: null }) {
        const id = (+new Date()).toString(32) + (Math.random().toString(32))
        this.id = id
        this.ctx = ctx
        this.x = 0
        this.y = 0
        this.type = config.type ?? NodeType.Node
        this._state = NodeState.Default

        this.context = config.context
        this.fatherId = config.fatherId || null

        // 
        this.childrenSumHeight = this.outerHeight
    }

    computerSize() {
        const ctx = this.ctx

        ctx.font = "14px Arial";
        const txt = this.ctx.measureText(this._context);
        this.contextWidth = Math.max(txt.width, 40);
        // @ts-ignore
        this.contextHeight = txt.fontBoundingBoxAscent + txt.fontBoundingBoxDescent;
        this.boxWidth = this.contextWidth + NodePadding * 2;
        this.boxHeight = this.contextHeight + NodePadding * 2;
        this.outerHeight = this.boxHeight + NodeMargin * 2
        this.outerWidth = this.boxWidth + NodeMargin * 2
    }

    get context(): string {
        return this._context
    }
    set context(value) {
        this._context = value
        this.computerSize()
        this.bindTree?.shakeTree()
        this.bindTree?.graph?.draw()
    }

    get state(): NodeState {
        return this._state
    }

    set state(value) {
        if (value === NodeState.Edit) {
            this.bindTree.editoringNode = this
        } else {
            this.bindTree.editoringNode = null
        }
        this._state = value
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
    editoringNode: NodeItem
    editor: Editor
    graph: any

    constructor(graph: any, config = { x: 0, y: 0, context: '', type: NodeType.Root }) {
        this.graph = graph
        const ctx = this.ctx = graph.ctx
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
        item.bindTree = this

        // bind editor and listen to the editor events
        this.editor = editor
        editor.onChange('done', ({ father, after }: { [key: string]: string }) => {
            this.editoringNode = null
            this.graph.draw()
        })

    }

    addNode(config = { context: '' }, fatherid?: string, afterid?: string, edit?: boolean) {

        const fatherId = fatherid || this.rootid;
        const fatherItem = this.nodesRef[fatherId];
        const item = new NodeItem(this.ctx, {
            ...config,
            fatherId: fatherId
        });

        // add item to fater
        const children = fatherItem.children = fatherItem.children || [];
        // fatherItem.children = fatherItem.children || []

        // if we have afterid we have to put the new item after the id
        // else we can add the new node to the end of the list
        if (afterid) {
            const index = children.findIndex(item => { return item.id === afterid });
            if (index !== -1) {
                children.splice(index + 1, 0, item)
            } else {
                return false;
            }
        } else {
            children.push(item)
        }

        if (edit) {
            // this.graph.selected && (this.graph.selected.selected = false);
            // this.graph.selected = item;
            // item.selected = true
            this.graph.editItem = item
            this.editoringNode = item
        }

        this.nodesRef[item.id] = item

        // bind father
        if (item.fatherId && this.tree[item.fatherId]) {
            item.father = fatherItem
        }
        item.bindTree = this

        // Re-computer position
        // Height: update the height of all the affected nodes from parent to root
        const onlyChildren = children.length <= 1
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
        this.graph.draw()

        // 
        return item.id
    }

    // Reset all the node's position
    shakeTree() {
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

        let editingNode = null

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

                // 
                if (item.state === NodeState.Edit) {
                    editingNode = item
                }

                const children = item.children;
                if (children) {
                    stacks.push({ info: { x: info.x + item.boxWidth + ListPadding, fatherY: itemY, fatherX: info.x, father: item }, items: children })
                }
            })
        }

        this.boardList = boardList;
        this.textList = textList;
        this.linkList = linkList;
    }

    // draw board box
    drawBoard() {
        const list = this.boardList || []
        const ctx = this.ctx
        const selecteNode: NodeItem[] = []
        ctx.save()
        const listByType: {
            [key: string]: {
                type: NodeType,
                list: renderListwithCoordinate | renderListWithItem
            }
        } = {}

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
                // origin
                ctx.save()
                ctx.fillStyle = 'red'
                ctx.translate(x, y)
                ctx.fillRect(-2, -2, 4, 4)
                ctx.restore()
                // group
                ctx.save()
                ctx.fillStyle = 'red'
                ctx.translate(x + NodePadding, y - item.boxHeight / 2)
                this.ctx.strokeStyle = 'red'
                ctx.strokeRect(-NodePadding, -item.childrenSumHeight / 2, item.boxWidth, item.childrenSumHeight)
                ctx.restore()

                // context
                ctx.save()
                ctx.translate(x, y)
                ctx.translate(NodePadding, -item.boxHeight / 2)
                ctx.strokeRect(0, -item.contextHeight / 2, item.contextWidth, item.contextHeight)
                ctx.restore()
                // outer
                ctx.save()
                ctx.strokeStyle = 'grey'
                ctx.translate(x, y)
                ctx.translate(-NodePadding, -item.boxHeight - NodeMargin)
                ctx.strokeRect(0, 0, item.outerWidth, item.outerHeight)
                ctx.restore()
                // box
                ctx.save()
                ctx.strokeStyle = 'yellow'
                ctx.translate(x, y)
                ctx.translate(0, -item.boxHeight)
                ctx.strokeRect(0, 0, item.boxWidth, item.boxHeight)
                ctx.restore()


                // Tips text
                ctx.save()
                ctx.translate(x + NodePadding, y - item.boxHeight / 2)
                this.ctx.fillStyle = 'red'
                ctx.font = "10px Arial";
                ctx.fillText((item.childrenSumHeight).toFixed(2).toString(), item.boxWidth, NodePadding * 2 - item.boxHeight)
                ctx.fillText((item.outerHeight).toFixed(2).toString(), item.boxWidth, NodePadding * 2 - item.boxHeight + 10)
                ctx.fillText(`${(item.x).toFixed(0).toString()},${(item.y || 0).toFixed(0).toString()} `, item.boxWidth, NodePadding * 2 - item.boxHeight + 20)
                ctx.translate(-(x + NodePadding), -(y - item.boxHeight / 2))
                ctx.restore()

            })

        }
    }

    drawText() {
        const list = this.textList || []
        const ctx = this.ctx
        ctx.save()
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'

        list.forEach(board => {
            const [item, offset] = board
            if (item === this.editoringNode) return false
            let { x, y } = offset
            if (item.type === NodeType.Root) {
                y = y + item.boxHeight / 2
            }
            ctx.translate(x + NodePadding, y - item.boxHeight / 2)
            const { context, boxHeight, boxWidth, outerHeight } = item
            ctx.font = "14px Arial";
            ctx.fillText(context, 0, 0)
            ctx.translate(-(x + NodePadding), -(y - item.boxHeight / 2))
        })
        ctx.restore()
    }

    drawLink() {
        const list = this.linkList || []
        const ctx = this.ctx
        ctx.save()
        ctx.strokeStyle = '#e99b47';
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
            const radius = 6;
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

    updateEditor() {
        const node = this.editoringNode;
        const dpr = window.devicePixelRatio || 1
        if (!node) {
            editor.hide()
            return;
        }
        // TODO: Show the editor 
        const { a: ctxScale, e: ctxOffsetX, f: ctxOffsetY } = this.ctx.getTransform()

        const { x: nodeX, y: nodeY, contextWidth, contextHeight } = node

        const [screenOrignX, screenOrginY] = [(ctxOffsetX + nodeX * ctxScale) / dpr, (ctxOffsetY + nodeY * ctxScale) / dpr]

        let offsetX = 0;
        let offsetY = 0;
        if (node.type === NodeType.Node) {
            offsetX = NodePadding * (ctxScale / dpr)
            offsetY -= NodePadding * (ctxScale / dpr)
        } else if (node.type === NodeType.Root) {
            offsetX = NodePadding * (ctxScale / dpr)
            offsetY += (NodePadding - 2) * (ctxScale / dpr)
        }


        editor.show(screenOrignX + offsetX, screenOrginY + offsetY, contextWidth, contextHeight, ctxScale, node)

    }

    draw() {
        // draw components step by step
        this.drawBoard()
        this.drawText()
        this.drawLink()
        this.updateEditor()
    }
}


export { NodeItem, NodeTree }
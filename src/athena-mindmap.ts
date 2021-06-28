import * as graph from './graph/canvas'

// window.debug = true;

/**
 * @class
 * @param {string} container the dom id where we put the mindmap
 */
class AthenaMindmap {
    container: HTMLElement
    graph: graph.CanvasGraph
    ctx: CanvasRenderingContext2D
    constructor(container: string, config?: object) {
        this.container = document.getElementById(container);
        this.graph = new graph.CanvasGraph(this.container);
        // 
        console.log('Hello Athena!')
        this.container.appendChild(this.graph.canvas)
    }
}

export { AthenaMindmap }
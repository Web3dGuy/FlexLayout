import { BorderNode } from "./BorderNode";
export class BorderSet {
    /** @internal */
    static fromJson(json, model) {
        const borderSet = new BorderSet(model);
        borderSet.borders = json.map((borderJson) => BorderNode.fromJson(borderJson, model));
        for (const border of borderSet.borders) {
            borderSet.borderMap.set(border.getLocation(), border);
        }
        return borderSet;
    }
    /** @internal */
    constructor(_model) {
        this.borders = [];
        this.borderMap = new Map();
        this.layoutHorizontal = true;
    }
    toJson() {
        return this.borders.map((borderNode) => borderNode.toJson());
    }
    /** @internal */
    getLayoutHorizontal() {
        return this.layoutHorizontal;
    }
    /** @internal */
    getBorders() {
        return this.borders;
    }
    /** @internal */
    getBorderMap() {
        return this.borderMap;
    }
    /** @internal */
    forEachNode(fn) {
        for (const borderNode of this.borders) {
            fn(borderNode, 0);
            for (const node of borderNode.getChildren()) {
                node.forEachNode(fn, 1);
            }
        }
    }
    /** @internal */
    setPaths() {
        for (const borderNode of this.borders) {
            const path = "/border/" + borderNode.getLocation().getName();
            borderNode.setPath(path);
            let i = 0;
            for (const node of borderNode.getChildren()) {
                node.setPath(path + "/t" + i);
                i++;
            }
        }
    }
    /** @internal */
    findDropTargetNode(dragNode, x, y) {
        for (const border of this.borders) {
            if (border.isShowing()) {
                const dropInfo = border.canDrop(dragNode, x, y);
                if (dropInfo !== undefined) {
                    return dropInfo;
                }
            }
        }
        return undefined;
    }
}
//# sourceMappingURL=BorderSet.js.map
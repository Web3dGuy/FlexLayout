import { DockLocation } from "../DockLocation";
import { Orientation } from "../Orientation";
import { Rect } from "../Rect";
export class Node {
    /** @internal */
    constructor(_model) {
        this.model = _model;
        this.attributes = {};
        this.children = [];
        this.rect = Rect.empty();
        this.listeners = new Map();
        this.path = "";
    }
    getId() {
        let id = this.attributes.id;
        if (id !== undefined) {
            return id;
        }
        id = this.model.nextUniqueId();
        this.setId(id);
        return id;
    }
    getModel() {
        return this.model;
    }
    getType() {
        return this.attributes.type;
    }
    getParent() {
        return this.parent;
    }
    getChildren() {
        return this.children;
    }
    getRect() {
        return this.rect;
    }
    getPath() {
        return this.path;
    }
    getOrientation() {
        if (this.parent === undefined) {
            return this.model.isRootOrientationVertical() ? Orientation.VERT : Orientation.HORZ;
        }
        else {
            return Orientation.flip(this.parent.getOrientation());
        }
    }
    // event can be: resize, visibility, maximize (on tabset), close
    setEventListener(event, callback) {
        this.listeners.set(event, callback);
    }
    removeEventListener(event) {
        this.listeners.delete(event);
    }
    /** @internal */
    setId(id) {
        this.attributes.id = id;
    }
    /** @internal */
    fireEvent(event, params) {
        // console.log(this._type, " fireEvent " + event + " " + JSON.stringify(params));
        if (this.listeners.has(event)) {
            this.listeners.get(event)(params);
        }
    }
    /** @internal */
    getAttr(name) {
        let val = this.attributes[name];
        if (val === undefined) {
            const modelName = this.getAttributeDefinitions().getModelName(name);
            if (modelName !== undefined) {
                val = this.model.getAttribute(modelName);
            }
        }
        // console.log(name + "=" + val);
        return val;
    }
    /** @internal */
    forEachNode(fn, level) {
        fn(this, level);
        level++;
        for (const node of this.children) {
            node.forEachNode(fn, level);
        }
    }
    /** @internal */
    setPaths(path) {
        let i = 0;
        for (const node of this.children) {
            let newPath = path;
            if (node.getType() === "row") {
                if (node.getOrientation() === Orientation.VERT) {
                    newPath += "/c" + i;
                }
                else {
                    newPath += "/r" + i;
                }
            }
            else if (node.getType() === "tabset") {
                newPath += "/ts" + i;
            }
            else if (node.getType() === "tab") {
                newPath += "/t" + i;
            }
            node.path = newPath;
            node.setPaths(newPath);
            i++;
        }
    }
    /** @internal */
    setParent(parent) {
        this.parent = parent;
    }
    /** @internal */
    setRect(rect) {
        this.rect = rect;
    }
    /** @internal */
    setPath(path) {
        this.path = path;
    }
    /** @internal */
    setWeight(weight) {
        this.attributes.weight = weight;
    }
    /** @internal */
    setSelected(index) {
        this.attributes.selected = index;
    }
    /** @internal */
    findDropTargetNode(windowId, dragNode, x, y) {
        let rtn;
        if (this.rect.contains(x, y)) {
            if (this.model.getMaximizedTabset(windowId) !== undefined) {
                rtn = this.model.getMaximizedTabset(windowId).canDrop(dragNode, x, y);
            }
            else {
                rtn = this.canDrop(dragNode, x, y);
                if (rtn === undefined) {
                    if (this.children.length !== 0) {
                        for (const child of this.children) {
                            rtn = child.findDropTargetNode(windowId, dragNode, x, y);
                            if (rtn !== undefined) {
                                break;
                            }
                        }
                    }
                }
            }
        }
        return rtn;
    }
    /** @internal */
    canDrop(dragNode, x, y) {
        return undefined;
    }
    /** @internal */
    canDockInto(dragNode, dropInfo) {
        if (dropInfo != null) {
            if (dropInfo.location === DockLocation.CENTER && dropInfo.node.isEnableDrop() === false) {
                return false;
            }
            // prevent named tabset docking into another tabset, since this would lose the header
            if (dropInfo.location === DockLocation.CENTER && dragNode.getType() === "tabset" && dragNode.getName() !== undefined) {
                return false;
            }
            if (dropInfo.location !== DockLocation.CENTER && dropInfo.node.isEnableDivide() === false) {
                return false;
            }
            // finally check model callback to check if drop allowed
            if (this.model.getOnAllowDrop()) {
                return this.model.getOnAllowDrop()(dragNode, dropInfo);
            }
        }
        return true;
    }
    /** @internal */
    removeChild(childNode) {
        const pos = this.children.indexOf(childNode);
        if (pos !== -1) {
            this.children.splice(pos, 1);
        }
        return pos;
    }
    /** @internal */
    addChild(childNode, pos) {
        if (pos != null) {
            this.children.splice(pos, 0, childNode);
        }
        else {
            this.children.push(childNode);
            pos = this.children.length - 1;
        }
        childNode.parent = this;
        return pos;
    }
    /** @internal */
    removeAll() {
        this.children = [];
    }
    /** @internal */
    styleWithPosition(style) {
        if (style == null) {
            style = {};
        }
        return this.rect.styleWithPosition(style);
    }
    /** @internal */
    isEnableDivide() {
        return true;
    }
    /** @internal */
    toAttributeString() {
        return JSON.stringify(this.attributes, undefined, "\t");
    }
}
//# sourceMappingURL=Node.js.map